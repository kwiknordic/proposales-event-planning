// Tests for the other requests section: cleaning, change lines and the summary for the hotel.
import { describe, expect, it } from "vitest";
import { cleanRequests, diffRequests, summarizeRequests } from "./requests";

describe("cleanRequests", () => {
  it("trims label and details", () => {
    expect(cleanRequests([{ label: " AV ", details: " Two mics " }])).toEqual([{ label: "AV", details: "Two mics" }]);
  });

  it("drops rows where both label and details are empty", () => {
    const requests = [
      { label: " ", details: "" },
      { label: "", details: "Signage" },
    ];
    expect(cleanRequests(requests)).toEqual([{ label: "", details: "Signage" }]);
  });
});

describe("diffRequests", () => {
  it("reports no change when requests are only reordered", () => {
    const before = [
      { label: "AV", details: "Two mics" },
      { label: "Signage", details: "Door sign" },
    ];
    const after = [
      { label: "Signage", details: "Door sign" },
      { label: "AV", details: "Two mics" },
    ];
    expect(diffRequests(before, after)).toEqual([]);
  });

  it("reports no change when the label is retyped with other case or whitespace", () => {
    const before = [{ label: "AV", details: "Two mics" }];
    const after = [{ label: "  av  ", details: "Two mics" }];
    expect(diffRequests(before, after)).toEqual([]);
  });

  it("reports a details change for the same label as one changed line", () => {
    const before = [{ label: "AV", details: "Two mics" }];
    const after = [{ label: "AV", details: "Three mics" }];
    expect(diffRequests(before, after)).toEqual([
      { section: "requests", kind: "changed", line: "Request AV: Two mics -> Three mics" },
    ]);
  });

  it("treats a label rename as a removed and an added request", () => {
    const before = [{ label: "AV", details: "Two mics" }];
    const after = [{ label: "Sound", details: "Two mics" }];
    expect(diffRequests(before, after)).toEqual([
      { section: "requests", kind: "removed", line: "Request removed: AV: Two mics" },
      { section: "requests", kind: "added", line: "Request added: Sound: Two mics" },
    ]);
  });

  it("writes only the label for an added request without details", () => {
    expect(diffRequests([], [{ label: "AV", details: "" }])).toEqual([
      { section: "requests", kind: "added", line: "Request added: AV" },
    ]);
  });
});

describe("summarizeRequests", () => {
  it("returns no lines when there are no requests", () => {
    expect(summarizeRequests([])).toEqual([]);
  });

  it("lists requests in the client's order", () => {
    const requests = [
      { label: "AV", details: "Two wireless microphones" },
      { label: "", details: "Flowers" },
    ];
    expect(summarizeRequests(requests)).toEqual(["Other requests:", "- AV: Two wireless microphones", "- Flowers"]);
  });
});
