// Tests for the attendees section: cleaning, change lines, the summary and the paste import.
import { describe, expect, it } from "vitest";
import { cleanAttendees, diffAttendees, parsePastedAttendees, summarizeAttendees } from "./attendees";

describe("cleanAttendees", () => {
  it("trims name and diet", () => {
    expect(cleanAttendees([{ name: " Anna ", diet: " vegetarian " }])).toEqual([{ name: "Anna", diet: "vegetarian" }]);
  });

  it("drops rows without a name, even when a diet is given", () => {
    const attendees = [
      { name: "  ", diet: "vegan" },
      { name: "", diet: "" },
      { name: "Ben", diet: "" },
    ];
    expect(cleanAttendees(attendees)).toEqual([{ name: "Ben", diet: "" }]);
  });
});

describe("diffAttendees", () => {
  it("reports no change when attendees are only reordered", () => {
    const before = [
      { name: "Anna", diet: "" },
      { name: "Ben", diet: "vegan" },
    ];
    const after = [
      { name: "Ben", diet: "vegan" },
      { name: "Anna", diet: "" },
    ];
    expect(diffAttendees(before, after)).toEqual([]);
  });

  it("reports no change when the name is retyped with other case or whitespace", () => {
    const before = [{ name: "Anna Lindqvist", diet: "" }];
    const after = [{ name: "  anna   lindqvist ", diet: "" }];
    expect(diffAttendees(before, after)).toEqual([]);
  });

  it("reports a diet change as one changed line", () => {
    const before = [{ name: "Hugo Berg", diet: "" }];
    const after = [{ name: "Hugo Berg", diet: "vegan" }];
    expect(diffAttendees(before, after)).toEqual([
      { section: "attendees", kind: "changed", line: "Hugo Berg: diet (empty) -> vegan" },
    ]);
  });

  it("reports a count line when attendees are added", () => {
    const before = [
      { name: "Anna", diet: "" },
      { name: "Ben", diet: "" },
    ];
    const after = [
      { name: "Anna", diet: "" },
      { name: "Ben", diet: "" },
      { name: "Cara", diet: "" },
    ];
    expect(diffAttendees(before, after)).toEqual([
      { section: "attendees", kind: "changed", line: "Attendees: 2 -> 3" },
      { section: "attendees", kind: "added", line: "Attendee added: Cara" },
    ]);
  });

  it("writes no count line when only diets change", () => {
    const before = [{ name: "Anna", diet: "" }];
    const after = [{ name: "Anna", diet: "gluten free" }];
    const lines = diffAttendees(before, after).map((change) => change.line);
    expect(lines).toEqual(["Anna: diet (empty) -> gluten free"]);
  });

  it("writes added attendees with and without diet", () => {
    const after = [
      { name: "Hugo Berg", diet: "vegan" },
      { name: "Ida", diet: "" },
    ];
    expect(diffAttendees([], after)).toEqual([
      { section: "attendees", kind: "changed", line: "Attendees: 0 -> 2" },
      { section: "attendees", kind: "added", line: "Attendee added: Hugo Berg (vegan)" },
      { section: "attendees", kind: "added", line: "Attendee added: Ida" },
    ]);
  });

  it("writes removed attendees with and without diet", () => {
    const before = [
      { name: "Hugo Berg", diet: "vegan" },
      { name: "Ida", diet: "" },
    ];
    expect(diffAttendees(before, [])).toEqual([
      { section: "attendees", kind: "changed", line: "Attendees: 2 -> 0" },
      { section: "attendees", kind: "removed", line: "Attendee removed: Hugo Berg (vegan)" },
      { section: "attendees", kind: "removed", line: "Attendee removed: Ida" },
    ]);
  });

  it("pairs duplicate names in order", () => {
    const before = [
      { name: "Sam", diet: "" },
      { name: "Sam", diet: "" },
    ];
    const after = [
      { name: "Sam", diet: "vegan" },
      { name: "Sam", diet: "" },
    ];
    expect(diffAttendees(before, after)).toEqual([
      { section: "attendees", kind: "changed", line: "Sam: diet (empty) -> vegan" },
    ]);
  });

  it("treats a renamed attendee as removed plus added", () => {
    const before = [{ name: "Ida Berg", diet: "" }];
    const after = [{ name: "Ida Lund", diet: "" }];
    expect(diffAttendees(before, after)).toEqual([
      { section: "attendees", kind: "removed", line: "Attendee removed: Ida Berg" },
      { section: "attendees", kind: "added", line: "Attendee added: Ida Lund" },
    ]);
  });
});

describe("summarizeAttendees", () => {
  it("returns no lines for an empty list", () => {
    expect(summarizeAttendees([])).toEqual([]);
  });

  it("counts attendees and lists them with diet when given", () => {
    const attendees = [
      { name: "Anna Lindqvist", diet: "Vegetarian" },
      { name: "Ben Carter", diet: "" },
    ];
    expect(summarizeAttendees(attendees)).toEqual(["Attendees (2):", "- Anna Lindqvist (Vegetarian)", "- Ben Carter"]);
  });
});

describe("parsePastedAttendees", () => {
  it("reads a plain name", () => {
    expect(parsePastedAttendees("Ben Carter")).toEqual([{ name: "Ben Carter", diet: "" }]);
  });

  it("splits on the first comma", () => {
    expect(parsePastedAttendees("Hugo Berg, vegan")).toEqual([{ name: "Hugo Berg", diet: "vegan" }]);
  });

  it("splits on a hyphen with spaces around it", () => {
    expect(parsePastedAttendees("Hugo Berg - vegan")).toEqual([{ name: "Hugo Berg", diet: "vegan" }]);
  });

  it("splits on a tab (spreadsheet paste)", () => {
    expect(parsePastedAttendees("Hugo Berg\tvegan")).toEqual([{ name: "Hugo Berg", diet: "vegan" }]);
  });

  it("skips blank lines and accepts CRLF line endings", () => {
    const text = "Anna, vegetarian\r\n\r\n   \r\nBen\r\n";
    expect(parsePastedAttendees(text)).toEqual([
      { name: "Anna", diet: "vegetarian" },
      { name: "Ben", diet: "" },
    ]);
  });

  it("trims and collapses extra spaces in name and diet", () => {
    expect(parsePastedAttendees("   Hugo    Berg ,   gluten   free  ")).toEqual([
      { name: "Hugo Berg", diet: "gluten free" },
    ]);
  });

  it("does not split a hyphenated name", () => {
    expect(parsePastedAttendees("Anne-Marie Dupont")).toEqual([{ name: "Anne-Marie Dupont", diet: "" }]);
  });

  it("skips lines where the name is empty", () => {
    expect(parsePastedAttendees(", vegan\n\tvegan\nIda")).toEqual([{ name: "Ida", diet: "" }]);
  });
});
