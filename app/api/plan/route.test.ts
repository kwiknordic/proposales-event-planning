// Tests for POST /api/plan (save): the handler is called directly, the Proposales client is mocked.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyPlan, type Plan } from "@/lib/planning/schema";
import type { Proposal } from "@/lib/proposales/parseProposal";

vi.mock("@/lib/proposales/client", () => ({
  getProposal: vi.fn(),
  savePlanningData: vi.fn(),
}));
vi.mock("@/lib/email/sendEmail", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/jev/flagUrgent", () => ({ flagUrgent: vi.fn(async () => []) }));

import { sendEmail } from "@/lib/email/sendEmail";
import { flagUrgent } from "@/lib/jev/flagUrgent";
import { getProposal, savePlanningData } from "@/lib/proposales/client";
import { POST } from "./route";

const UUID = "67c008dd-7ee6-4687-bc60-1647fdf46a9a";

const storedPlan: Plan = {
  ...emptyPlan,
  agenda: [{ time: "09:00", title: "Welcome" }],
  seating: { layout: "classroom", notes: "" },
};

function acceptedProposal(planning: unknown = storedPlan, planningStatus?: string): Proposal {
  return {
    uuid: UUID,
    title: "Acme Sales Kickoff",
    status: "accepted",
    data: planningStatus ? { planning, planning_status: planningStatus } : { planning },
  };
}

function postPlan(body: unknown) {
  return POST(
    new Request("http://localhost/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const editedPlan: Plan = { ...storedPlan, agenda: [{ time: "09:30", title: "Welcome" }] };

beforeEach(() => {
  vi.mocked(getProposal).mockReset();
  vi.mocked(savePlanningData).mockReset();
  vi.mocked(sendEmail).mockReset();
});

describe("POST /api/plan (save)", () => {
  it("400 when the body is not valid JSON", async () => {
    const response = await postPlan("{not json");
    expect(response.status).toBe(400);
  });

  it("400 when the plan breaks the schema", async () => {
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: { extras: ["x".repeat(501)] } });
    expect(response.status).toBe(400);
    expect(getProposal).not.toHaveBeenCalled();
  });

  it("404 when the proposal does not exist", async () => {
    vi.mocked(getProposal).mockResolvedValue(null);
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });
    expect(response.status).toBe(404);
  });

  it("403 when the proposal is not accepted", async () => {
    vi.mocked(getProposal).mockResolvedValue({ ...acceptedProposal(), status: "active" });
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });
    expect(response.status).toBe(403);
    expect(savePlanningData).not.toHaveBeenCalled();
  });

  it("409 with the stored plan when another save happened since the page loaded", async () => {
    const otherSave = { ...storedPlan, seating: { layout: "banquet", notes: "" } };
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal(otherSave));
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });
    expect(response.status).toBe(409);
    expect((await response.json()).plan.seating.layout).toBe("banquet");
    expect(savePlanningData).not.toHaveBeenCalled();
  });

  it("200 saves the cleaned plan and its summary", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    const withEmptyRow = { ...editedPlan, agenda: [...editedPlan.agenda, { time: "", title: " " }] };
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: withEmptyRow });

    expect(response.status).toBe(200);
    expect((await response.json()).plan).toEqual(editedPlan);
    const [savedUuid, saved] = vi.mocked(savePlanningData).mock.calls[0];
    expect(savedUuid).toBe(UUID);
    expect(saved.planning).toEqual(editedPlan);
    expect(saved.planning_summary).toContain("09:30 Welcome");
  });

  it("200 on the first save, when nothing is stored yet", async () => {
    vi.mocked(getProposal).mockResolvedValue({ ...acceptedProposal(), data: {} });
    const response = await postPlan({ uuid: UUID, action: "save", baseline: emptyPlan, plan: editedPlan });
    expect(response.status).toBe(200);
  });

  it("502 when Proposales refuses the write", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    vi.mocked(savePlanningData).mockRejectedValue(new Error("Proposales savePlanningData failed with status 500"));
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });
    expect(response.status).toBe(502);
  });
});

describe("POST /api/plan (notify rule)", () => {
  it("save before the first submit stores no status and sends no email", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });

    expect((await response.json()).status).toBeNull();
    const [, saved] = vi.mocked(savePlanningData).mock.calls[0];
    expect(saved.planning_status).toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("first submit emails the full plan and stores submitted with a timestamp, even without changes", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    const response = await postPlan({ uuid: UUID, action: "submit", baseline: storedPlan, plan: storedPlan });

    const body = await response.json();
    expect(body.status).toBe("submitted");
    const [, saved] = vi.mocked(savePlanningData).mock.calls[0];
    expect(saved.planning_status).toBe("submitted");
    expect(saved.planning_submitted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(saved.planning_notified_at).toBeUndefined();
    expect(vi.mocked(sendEmail).mock.calls[0][0].subject).toBe("New event plan: Acme Sales Kickoff");
  });

  it("update with a real change emails the change and records when the hotel was notified", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal(storedPlan, "submitted"));
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });

    const body = await response.json();
    expect(body.status).toBe("submitted");
    expect(body.notifiedAt).toMatch(/^\d{4}-/);
    const [, saved] = vi.mocked(savePlanningData).mock.calls[0];
    expect(saved.planning_submitted_at).toBeUndefined();
    expect(saved.planning_notified_at).toBe(body.notifiedAt);
    const email = vi.mocked(sendEmail).mock.calls[0][0];
    expect(email.subject).toBe("Event plan updated: Acme Sales Kickoff");
    expect(email.text).toContain("Agenda: Welcome 09:00 -> 09:30");
  });

  it("update without a real change (retyped, reordered) sends no email", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal(storedPlan, "submitted"));
    const retyped = { ...storedPlan, agenda: [{ time: "09:00", title: " WELCOME " }] };
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: retyped });

    expect(response.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
    const [, saved] = vi.mocked(savePlanningData).mock.calls[0];
    expect(saved.planning_notified_at).toBeUndefined();
  });

  it("attaches the attendees CSV only when there are attendees", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    const withAttendees = { ...storedPlan, attendees: [{ name: "Anna", diet: "vegan" }] };
    await postPlan({ uuid: UUID, action: "submit", baseline: storedPlan, plan: withAttendees });
    expect(vi.mocked(sendEmail).mock.calls[0][0].attendeesCsv).toBe("name,diet\r\nAnna,vegan\r\n");

    vi.mocked(sendEmail).mockReset();
    await postPlan({ uuid: UUID, action: "submit", baseline: storedPlan, plan: storedPlan });
    expect(vi.mocked(sendEmail).mock.calls[0][0].attendeesCsv).toBeNull();
  });

  it("an email failure does not fail the save", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    vi.mocked(sendEmail).mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await postPlan({ uuid: UUID, action: "submit", baseline: storedPlan, plan: storedPlan });
    expect(response.status).toBe(200);
  });
});

describe("POST /api/plan (urgency flag)", () => {
  it("puts urgent changes in the email and prefixes the subject", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal(storedPlan, "submitted"));
    vi.mocked(flagUrgent).mockResolvedValueOnce(["Agenda: Welcome 09:00 -> 09:30"]);
    await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });

    expect(flagUrgent).toHaveBeenCalledWith("Acme Sales Kickoff", ["Agenda: Welcome 09:00 -> 09:30"]);
    const email = vi.mocked(sendEmail).mock.calls[0][0];
    expect(email.subject).toBe("[Action needed] Event plan updated: Acme Sales Kickoff");
    expect(email.text).toContain("Needs attention");
  });

  it("does not ask Jev on a first submit", async () => {
    vi.mocked(flagUrgent).mockClear();
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    await postPlan({ uuid: UUID, action: "submit", baseline: storedPlan, plan: editedPlan });
    expect(flagUrgent).not.toHaveBeenCalled();
  });
});

describe("POST /api/plan (email preview for demo proposals)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the sent email's HTML for a demo proposal, so reviewers can open it", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ACCEPTED_UUID", UUID);
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    const response = await postPlan({ uuid: UUID, action: "submit", baseline: storedPlan, plan: storedPlan });

    const body = await response.json();
    expect(body.emailPreview).toContain("<!DOCTYPE html>");
    expect(body.emailPreview).toBe(vi.mocked(sendEmail).mock.calls[0][0].html);
  });

  it("never returns it for a real proposal", async () => {
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    const response = await postPlan({ uuid: UUID, action: "submit", baseline: storedPlan, plan: storedPlan });
    expect((await response.json()).emailPreview).toBeUndefined();
  });

  it("does not return it when no email was sent", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ACCEPTED_UUID", UUID);
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal());
    const response = await postPlan({ uuid: UUID, action: "save", baseline: storedPlan, plan: editedPlan });
    expect((await response.json()).emailPreview).toBeUndefined();
  });
});
