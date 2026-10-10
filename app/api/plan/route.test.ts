// Tests for POST /api/plan (save): the handler is called directly, the Proposales client is mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyPlan, type Plan } from "@/lib/planning/schema";
import type { Proposal } from "@/lib/proposales/parseProposal";

vi.mock("@/lib/proposales/client", () => ({
  getProposal: vi.fn(),
  savePlanningData: vi.fn(),
}));

import { getProposal, savePlanningData } from "@/lib/proposales/client";
import { POST } from "./route";

const UUID = "67c008dd-7ee6-4687-bc60-1647fdf46a9a";

const storedPlan: Plan = {
  ...emptyPlan,
  agenda: [{ time: "09:00", title: "Welcome" }],
  seating: { layout: "classroom", notes: "" },
};

function acceptedProposal(planning: unknown = storedPlan): Proposal {
  return { uuid: UUID, title: "Acme Sales Kickoff", status: "accepted", data: { planning } };
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

  it("409 with the stored plan when the hotel changed it since the page loaded", async () => {
    const hotelEdit = { ...storedPlan, seating: { layout: "banquet", notes: "" } };
    vi.mocked(getProposal).mockResolvedValue(acceptedProposal(hotelEdit));
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
