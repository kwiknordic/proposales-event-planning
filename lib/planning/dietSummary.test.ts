// Tests for the diet summary in the hotel email: counts per normalized diet, "no restriction" last.
import { describe, expect, it } from "vitest";
import { summarizeDiets } from "./dietSummary";
import type { Attendee } from "./schema";

describe("summarizeDiets", () => {
  it("returns an empty list when there are no attendees", () => {
    expect(summarizeDiets([])).toEqual([]);
  });

  it("merges diets that differ only in case or spacing, and sorts by count then name", () => {
    const attendees: Attendee[] = [
      { name: "Anna", diet: "Vegetarian" },
      { name: "Ben", diet: " vegetarian " },
      { name: "Cleo", diet: "vegan" },
      { name: "Dan", diet: "Nut allergy" },
      { name: "Eva", diet: "" },
      { name: "Finn", diet: "none" },
    ];
    expect(summarizeDiets(attendees)).toEqual([
      { diet: "vegetarian", count: 2 },
      { diet: "nut allergy", count: 1 },
      { diet: "vegan", count: 1 },
      { diet: "no restriction", count: 2 },
    ]);
  });

  it("counts empty, none, no, - and n/a as no restriction", () => {
    const attendees: Attendee[] = [
      { name: "A", diet: "" },
      { name: "B", diet: "None" },
      { name: "C", diet: "no" },
      { name: "D", diet: "-" },
      { name: "E", diet: "N/A" },
    ];
    expect(summarizeDiets(attendees)).toEqual([{ diet: "no restriction", count: 5 }]);
  });

  it("keeps no restriction last even when it has the highest count", () => {
    const attendees: Attendee[] = [
      { name: "A", diet: "" },
      { name: "B", diet: "" },
      { name: "C", diet: "vegan" },
    ];
    expect(summarizeDiets(attendees)).toEqual([
      { diet: "vegan", count: 1 },
      { diet: "no restriction", count: 2 },
    ]);
  });

  it("ignores attendees whose name is empty after trimming", () => {
    const attendees: Attendee[] = [
      { name: "   ", diet: "vegan" },
      { name: "", diet: "" },
      { name: "Anna", diet: "vegan" },
    ];
    expect(summarizeDiets(attendees)).toEqual([{ diet: "vegan", count: 1 }]);
  });
});
