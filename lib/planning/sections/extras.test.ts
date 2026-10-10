// Tests for the extras section: cleaning, change lines and the summary for the hotel.
import { describe, expect, it } from "vitest";
import { cleanExtras, diffExtras, summarizeExtras } from "./extras";

describe("cleanExtras", () => {
  it("trims each extra and drops empty rows", () => {
    expect(cleanExtras([" Projector and screen ", "", "   ", "Name badges"])).toEqual([
      "Projector and screen",
      "Name badges",
    ]);
  });
});

describe("diffExtras", () => {
  it("reports no change when extras are only reordered", () => {
    const before = ["Projector and screen", "Name badges"];
    const after = ["Name badges", "Projector and screen"];
    expect(diffExtras(before, after)).toEqual([]);
  });

  it("reports no change when an extra is retyped with other case or whitespace", () => {
    expect(diffExtras(["Name badges"], ["  name   BADGES "])).toEqual([]);
  });

  it("reports an added extra", () => {
    expect(diffExtras(["Projector and screen"], ["Projector and screen", "Name badges"])).toEqual([
      { section: "extras", kind: "added", line: "Extra added: Name badges" },
    ]);
  });

  it("reports a removed extra with its trimmed original text", () => {
    expect(diffExtras(["Projector and screen", " Name badges "], ["Projector and screen"])).toEqual([
      { section: "extras", kind: "removed", line: "Extra removed: Name badges" },
    ]);
  });

  it("lists removed changes before added changes", () => {
    expect(diffExtras(["Flowers"], ["Name badges"])).toEqual([
      { section: "extras", kind: "removed", line: "Extra removed: Flowers" },
      { section: "extras", kind: "added", line: "Extra added: Name badges" },
    ]);
  });
});

describe("summarizeExtras", () => {
  it("returns no lines when there are no extras", () => {
    expect(summarizeExtras([])).toEqual([]);
  });

  it("returns no lines when all extras are blank", () => {
    expect(summarizeExtras(["", "  "])).toEqual([]);
  });

  it("lists trimmed extras in the client's order", () => {
    expect(summarizeExtras([" Projector and screen ", "Name badges"])).toEqual([
      "Extras:",
      "- Projector and screen",
      "- Name badges",
    ]);
  });
});
