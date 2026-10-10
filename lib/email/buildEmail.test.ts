// Tests for buildEmail: subject, editor link, change lines and the cleaned plan the hotel email is built from.
import { describe, expect, it } from "vitest";
import type { Change } from "@/lib/planning/changes";
import { summarizeDiets } from "@/lib/planning/dietSummary";
import { cleanPlan } from "@/lib/planning/plan";
import type { Plan } from "@/lib/planning/schema";
import { buildEmail } from "./buildEmail";

const uuid = "11111111-2222-3333-4444-555555555555";

const plan: Plan = {
  agenda: [{ time: "09:00", title: "Welcome" }, { time: " ", title: "" }],
  seating: { layout: "classroom", notes: "" },
  extras: ["Projector"],
  requests: [],
  attendees: [
    { name: "Anna", diet: "Vegetarian" },
    { name: "Ben", diet: "" },
  ],
};

const change: Change = { section: "extras", kind: "added", line: "Extras added: Name badges" };

function input(overrides: Partial<Parameters<typeof buildEmail>[0]> = {}) {
  return {
    kind: "submitted" as const,
    proposal: { uuid, title: "Acme Sales Kickoff", status: "accepted" },
    plan,
    changes: [] as Change[],
    urgentChanges: [] as string[],
    ...overrides,
  };
}

describe("buildEmail subject", () => {
  it("names a first submit as a new event plan", () => {
    expect(buildEmail(input({ kind: "submitted" })).subject).toBe("New event plan: Acme Sales Kickoff");
  });

  it("names a later change as an updated event plan", () => {
    expect(buildEmail(input({ kind: "updated" })).subject).toBe("Event plan updated: Acme Sales Kickoff");
  });

  it("prefixes the subject when a change is urgent", () => {
    expect(buildEmail(input({ kind: "submitted", urgentChanges: ["Agenda removed: Lunch"] })).subject).toBe(
      "[Action needed] New event plan: Acme Sales Kickoff",
    );
    expect(buildEmail(input({ kind: "updated", urgentChanges: ["Agenda removed: Lunch"] })).subject).toBe(
      "[Action needed] Event plan updated: Acme Sales Kickoff",
    );
  });
});

describe("buildEmail proposal", () => {
  it("links to the editor page of the proposal", () => {
    const email = buildEmail(input());
    expect(email.proposal).toEqual({
      title: "Acme Sales Kickoff",
      status: "accepted",
      editorUrl: `https://secure.proposales.com/proposals/${uuid}/edit`,
    });
  });
});

describe("buildEmail changes", () => {
  it("lists the change lines for an update", () => {
    expect(buildEmail(input({ kind: "updated", changes: [change] })).changes).toEqual([
      "Extras added: Name badges",
    ]);
  });

  it("lists no changes for a first submit, even if some were passed in", () => {
    expect(buildEmail(input({ kind: "submitted", changes: [change] })).changes).toEqual([]);
  });

  it("passes the urgent changes through", () => {
    expect(buildEmail(input({ urgentChanges: ["Agenda removed: Lunch"] })).urgentChanges).toEqual([
      "Agenda removed: Lunch",
    ]);
  });
});

describe("buildEmail plan", () => {
  it("uses the cleaned plan (blank agenda rows dropped)", () => {
    const email = buildEmail(input());
    expect(email.plan).toEqual(cleanPlan(plan));
    expect(email.plan.agenda).toEqual([{ time: "09:00", title: "Welcome" }]);
  });

  it("summarizes the diets of the attendees", () => {
    expect(buildEmail(input()).dietSummary).toEqual(summarizeDiets(plan.attendees));
  });

  it("reports whether there are attendees", () => {
    expect(buildEmail(input()).hasAttendees).toBe(true);
    expect(buildEmail(input({ plan: { ...plan, attendees: [] } })).hasAttendees).toBe(false);
  });
});
