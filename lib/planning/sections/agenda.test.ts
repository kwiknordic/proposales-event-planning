// Tests for the agenda section: cleaning, change lines and the summary for the hotel.
import { describe, expect, it } from "vitest";
import { cleanAgenda, diffAgenda, summarizeAgenda } from "./agenda";

describe("cleanAgenda", () => {
  it("trims time and title", () => {
    expect(cleanAgenda([{ time: " 09:00 ", title: " Welcome " }])).toEqual([{ time: "09:00", title: "Welcome" }]);
  });

  it("drops rows where both time and title are empty", () => {
    const items = [{ time: " ", title: "" }, { time: "", title: "Lunch" }];
    expect(cleanAgenda(items)).toEqual([{ time: "", title: "Lunch" }]);
  });
});

describe("diffAgenda", () => {
  it("reports no change when items are only reordered", () => {
    const before = [{ time: "09:00", title: "Welcome" }, { time: "12:00", title: "Lunch" }];
    const after = [{ time: "12:00", title: "Lunch" }, { time: "09:00", title: "Welcome" }];
    expect(diffAgenda(before, after)).toEqual([]);
  });

  it("reports no change when the title is retyped with other case or whitespace", () => {
    const before = [{ time: "12:00", title: "Lunch" }];
    const after = [{ time: "12:00", title: "  lunch  " }];
    expect(diffAgenda(before, after)).toEqual([]);
  });

  it("reports a time change for the same title as one changed line", () => {
    const before = [{ time: "12:00", title: "Lunch" }];
    const after = [{ time: "12:30", title: "Lunch" }];
    expect(diffAgenda(before, after)).toEqual([
      { section: "agenda", kind: "changed", line: "Agenda: Lunch 12:00 -> 12:30" },
    ]);
  });

  it("reports added and removed items", () => {
    const before = [{ time: "", title: "Dinner" }];
    const after = [{ time: "09:00", title: "Welcome" }];
    expect(diffAgenda(before, after)).toEqual([
      { section: "agenda", kind: "removed", line: "Agenda removed: Dinner" },
      { section: "agenda", kind: "added", line: "Agenda added: 09:00 Welcome" },
    ]);
  });

  it("writes only the title for an added item without a time", () => {
    expect(diffAgenda([], [{ time: "", title: "Break" }])).toEqual([
      { section: "agenda", kind: "added", line: "Agenda added: Break" },
    ]);
  });
});

describe("summarizeAgenda", () => {
  it("returns no lines for an empty agenda", () => {
    expect(summarizeAgenda([])).toEqual([]);
  });

  it("lists items in the client's order", () => {
    const items = [{ time: "09:00", title: "Welcome" }, { time: "", title: "Lunch" }];
    expect(summarizeAgenda(items)).toEqual(["Agenda:", "- 09:00 Welcome", "- Lunch"]);
  });
});
