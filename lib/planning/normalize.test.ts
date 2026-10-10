// Tests for text normalization: the rule behind "is this a real change?".
import { describe, expect, it } from "vitest";
import { isSameText, normalizeText } from "./normalize";

describe("normalizeText", () => {
  it("trims, collapses inner whitespace and lowercases", () => {
    expect(normalizeText("  Hugo   BERG\t ")).toBe("hugo berg");
  });

  it("treats null, undefined and empty as the same empty value", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
    expect(normalizeText("   ")).toBe("");
  });
});

describe("isSameText", () => {
  it("ignores case and whitespace", () => {
    expect(isSameText("Vegan", " vegan ")).toBe(true);
  });

  it("sees null and empty string as equal", () => {
    expect(isSameText(null, "")).toBe(true);
  });

  it("sees different words as different", () => {
    expect(isSameText("vegan", "vegetarian")).toBe(false);
  });
});
