// Tests for the whole-plan functions that compose the sections (clean, diff, summary, staleness).
import { describe, expect, it } from "vitest";
import { cleanPlan, diffPlan, isStale, readStoredPlan, summarizePlan } from "./plan";
import { emptyPlan, type Plan } from "./schema";

const plan: Plan = {
  ...emptyPlan,
  agenda: [{ time: "09:00", title: "Welcome" }, { time: "12:00", title: "Lunch" }],
  seating: { layout: "classroom", notes: "" },
};

describe("cleanPlan", () => {
  it("drops empty agenda rows and trims seating", () => {
    const messy = { ...plan, agenda: [...plan.agenda, { time: " ", title: "" }], seating: { layout: " classroom ", notes: "" } };
    expect(cleanPlan(messy)).toEqual(plan);
  });
});

describe("diffPlan", () => {
  it("is empty for the same plan retyped and reordered", () => {
    const retyped = { ...plan, agenda: [{ time: "12:00", title: " lunch" }, { time: "09:00", title: "WELCOME" }] };
    expect(diffPlan(plan, retyped)).toEqual([]);
  });

  it("lists agenda changes before seating changes", () => {
    const edited = { ...plan, agenda: [{ time: "09:00", title: "Welcome" }, { time: "12:30", title: "Lunch" }], seating: { layout: "banquet", notes: "" } };
    expect(diffPlan(plan, edited).map((change) => change.line)).toEqual([
      "Agenda: Lunch 12:00 -> 12:30",
      "Seating layout: classroom -> banquet",
    ]);
  });
});

describe("isStale", () => {
  it("is false when the stored plan only differs in case and order", () => {
    expect(isStale(plan, { ...plan, agenda: [...plan.agenda].reverse() })).toBe(false);
  });

  it("is true when the hotel changed something", () => {
    expect(isStale(plan, { ...plan, seating: { layout: "banquet", notes: "" } })).toBe(true);
  });
});

describe("summarizePlan", () => {
  it("joins the section summaries as plain text", () => {
    expect(summarizePlan(plan)).toBe("Agenda:\n- 09:00 Welcome\n- 12:00 Lunch\nSeating: classroom");
  });

  it("is empty for an empty plan", () => {
    expect(summarizePlan(emptyPlan)).toBe("");
  });
});

describe("readStoredPlan", () => {
  it("reads nothing stored yet as the empty plan", () => {
    expect(readStoredPlan(undefined)).toEqual(emptyPlan);
    expect(readStoredPlan(null)).toEqual(emptyPlan);
  });

  it("cleans a stored plan", () => {
    expect(readStoredPlan({ ...plan, agenda: [...plan.agenda, { time: "", title: "" }] })).toEqual(plan);
  });

  it("reads an unreadable stored plan as empty", () => {
    expect(readStoredPlan({ agenda: "not a list" })).toEqual(emptyPlan);
  });
});
