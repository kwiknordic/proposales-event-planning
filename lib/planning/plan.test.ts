// Tests for the whole-plan functions that compose the sections (clean, diff, summary, staleness).
import { describe, expect, it } from "vitest";
import { cleanPlan, diffPlan, isStale, readStoredPlan, summarizePlan } from "./plan";
import { emptyPlan, type Plan } from "./schema";

const plan: Plan = {
  ...emptyPlan,
  agenda: [
    { time: "09:00", title: "Welcome" },
    { time: "12:00", title: "Lunch" },
  ],
  seating: { layout: "classroom", notes: "" },
};

describe("cleanPlan", () => {
  it("drops empty agenda rows and trims seating", () => {
    const messy = {
      ...plan,
      agenda: [...plan.agenda, { time: " ", title: "" }],
      seating: { layout: " classroom ", notes: "" },
    };
    expect(cleanPlan(messy)).toEqual(plan);
  });
});

describe("diffPlan", () => {
  it("is empty for the same plan retyped and reordered", () => {
    const retyped = {
      ...plan,
      agenda: [
        { time: "12:00", title: " lunch" },
        { time: "09:00", title: "WELCOME" },
      ],
    };
    expect(diffPlan(plan, retyped)).toEqual([]);
  });

  it("lists agenda changes before seating changes", () => {
    const edited = {
      ...plan,
      agenda: [
        { time: "09:00", title: "Welcome" },
        { time: "12:30", title: "Lunch" },
      ],
      seating: { layout: "banquet", notes: "" },
    };
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

  it("is true when another save changed something", () => {
    expect(isStale(plan, { ...plan, seating: { layout: "banquet", notes: "" } })).toBe(true);
  });
});

const fullPlan: Plan = {
  agenda: [{ time: "09:00", title: "Welcome" }],
  seating: { layout: "classroom", notes: "" },
  extras: ["Projector and screen"],
  requests: [{ label: "AV", details: "Two mics" }],
  attendees: [{ name: "Anna Lindqvist", diet: "Vegetarian" }],
};

describe("diffPlan on all sections", () => {
  it("lists changes in section order: agenda, seating, extras, requests, attendees", () => {
    const edited: Plan = {
      agenda: [{ time: "09:30", title: "Welcome" }],
      seating: { layout: "banquet", notes: "" },
      extras: [],
      requests: [{ label: "AV", details: "Three mics" }],
      attendees: [{ name: "Anna Lindqvist", diet: "Vegan" }],
    };
    expect(diffPlan(fullPlan, edited).map((change) => change.section)).toEqual([
      "agenda",
      "seating",
      "extras",
      "requests",
      "attendees",
    ]);
  });

  it("finds no change when attendees and extras are only reordered", () => {
    const before = {
      ...fullPlan,
      extras: ["A", "B"],
      attendees: [
        { name: "Anna", diet: "" },
        { name: "Ben", diet: "Halal" },
      ],
    };
    const after = {
      ...before,
      extras: ["b", "A"],
      attendees: [
        { name: "Ben", diet: "halal" },
        { name: "Anna", diet: "" },
      ],
    };
    expect(diffPlan(before, after)).toEqual([]);
  });
});

describe("cleanPlan on all sections", () => {
  it("drops empty rows in every list", () => {
    const messy: Plan = {
      ...fullPlan,
      extras: [...fullPlan.extras, " "],
      requests: [...fullPlan.requests, { label: "", details: "" }],
      attendees: [...fullPlan.attendees, { name: "", diet: "vegan" }],
    };
    expect(cleanPlan(messy)).toEqual(fullPlan);
  });
});

describe("summarizePlan", () => {
  it("summarizes all sections in order", () => {
    expect(summarizePlan(fullPlan)).toBe(
      [
        "Agenda:",
        "- 09:00 Welcome",
        "Seating: classroom",
        "Extras:",
        "- Projector and screen",
        "Other requests:",
        "- AV: Two mics",
        "Attendees (1):",
        "- Anna Lindqvist (Vegetarian)",
      ].join("\n"),
    );
  });

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
