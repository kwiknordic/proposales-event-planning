// Tests for the readable change lines shown in the hotel email.
import { describe, expect, it } from "vitest";
import { formatTransition, formatValue } from "./changes";

describe("formatValue", () => {
  it("keeps the client's original text", () => {
    expect(formatValue("  Nut allergy ")).toBe("Nut allergy");
  });

  it("shows empty values as (empty)", () => {
    expect(formatValue("")).toBe("(empty)");
    expect(formatValue(null)).toBe("(empty)");
  });
});

describe("formatTransition", () => {
  it("writes subject: before -> after", () => {
    expect(formatTransition("Hugo Berg: diet", "", "vegan")).toBe("Hugo Berg: diet (empty) -> vegan");
    expect(formatTransition("Agenda: Lunch", "12:00", "12:30")).toBe("Agenda: Lunch 12:00 -> 12:30");
  });
});
