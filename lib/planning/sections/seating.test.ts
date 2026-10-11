// Tests for the Seating section: cleaning, change lines for the hotel email, and the summary for planning_summary.
import { describe, expect, it } from "vitest";
import { cleanSeating, diffSeating, summarizeSeating } from "./seating";

describe("cleanSeating", () => {
  it("trims layout and notes", () => {
    expect(cleanSeating({ layout: "  classroom ", notes: " Projector at the front  " })).toEqual({
      layout: "classroom",
      notes: "Projector at the front",
    });
  });
});

describe("diffSeating", () => {
  it("reports a layout change as a readable line", () => {
    expect(diffSeating({ layout: "theatre", notes: "" }, { layout: "classroom", notes: "" })).toEqual([
      { section: "seating", kind: "changed", line: "Seating layout: theatre -> classroom" },
    ]);
  });

  it("reports a notes change as a readable line", () => {
    expect(
      diffSeating({ layout: "banquet", notes: "" }, { layout: "banquet", notes: "Two tables near the door" }),
    ).toEqual([{ section: "seating", kind: "changed", line: "Seating notes: (empty) -> Two tables near the door" }]);
  });

  it("ignores case and whitespace only", () => {
    expect(
      diffSeating({ layout: "U-shape", notes: "Near  the window" }, { layout: " u-shape ", notes: "near the window" }),
    ).toEqual([]);
  });

  it("treats an empty string and a missing value as the same", () => {
    const missing = { layout: null, notes: undefined } as unknown as { layout: string; notes: string };
    expect(diffSeating({ layout: "", notes: "" }, missing)).toEqual([]);
  });
});

describe("summarizeSeating", () => {
  it("returns no lines when both fields are empty", () => {
    expect(summarizeSeating({ layout: "", notes: "  " })).toEqual([]);
  });

  it("writes one line per filled field", () => {
    expect(summarizeSeating({ layout: "classroom", notes: "" })).toEqual(["Seating: classroom"]);
    expect(summarizeSeating({ layout: "", notes: "Quiet corner" })).toEqual(["Seating notes: Quiet corner"]);
    expect(summarizeSeating({ layout: "classroom", notes: "Quiet corner" })).toEqual([
      "Seating: classroom",
      "Seating notes: Quiet corner",
    ]);
  });
});
