// Tests the pure Jev urgency functions: request shape, batch cap and reading answers. No I/O.
import { describe, it, expect } from "vitest";
import { buildUrgencyRequest, readUrgentIds, THRESHOLD, MAX_CHANGES } from "./urgency";

describe("buildUrgencyRequest", () => {
  it("builds one batched noul question per change with ids c0, c1", () => {
    const request = buildUrgencyRequest("Acme Sales Kickoff", [
      "Attendee added: Hugo Berg (severe nut allergy)",
      "Extras: Coffee -> Coffee and tea",
    ]) as {
      model: string;
      state: { event: string; changes: { id: string; text: string }[] };
      questions: Record<string, { type: string; instructions: string }>;
    };

    expect(request.model).toBe("jev-latest");
    expect(request.state.event).toBe("Acme Sales Kickoff");
    expect(request.state.changes).toEqual([
      { id: "c0", text: "Attendee added: Hugo Berg (severe nut allergy)" },
      { id: "c1", text: "Extras: Coffee -> Coffee and tea" },
    ]);
    expect(Object.keys(request.questions)).toEqual(["c0", "c1"]);
    expect(request.questions.c0.type).toBe("noul");
    expect(request.questions.c0.instructions).toContain('"c0"');
    expect(request.questions.c1.instructions).toContain('"c1"');
  });

  it("includes only the first 20 of 25 changes", () => {
    const lines = Array.from({ length: 25 }, (_, index) => `change ${index}`);

    const request = buildUrgencyRequest("Event", lines);

    expect(MAX_CHANGES).toBe(20);
    expect(request.state.changes).toHaveLength(20);
    expect(request.state.changes[19]).toEqual({ id: "c19", text: "change 19" });
    expect(Object.keys(request.questions)).toHaveLength(20);
    expect(JSON.stringify(request)).not.toContain("change 20");
  });
});

describe("readUrgentIds", () => {
  it("includes an answer exactly at the threshold and excludes one just below", () => {
    const response = {
      answers: {
        c0: { type: "noul", noul: 0.7 },
        c1: { type: "noul", noul: 0.69 },
        c2: { type: "noul", noul: 0.97 },
      },
    };

    expect(THRESHOLD).toBe(0.7);
    expect(readUrgentIds(response, 0.7)).toEqual(["c0", "c2"]);
  });

  it("returns [] for malformed responses", () => {
    expect(readUrgentIds(null, 0.7)).toEqual([]);
    expect(readUrgentIds("oops", 0.7)).toEqual([]);
    expect(readUrgentIds({}, 0.7)).toEqual([]);
    expect(readUrgentIds({ answers: "nope" }, 0.7)).toEqual([]);
    expect(readUrgentIds({ answers: { c0: { type: "noul" } } }, 0.7)).toEqual([]);
    expect(readUrgentIds({ answers: { c0: { noul: "0.9" } } }, 0.7)).toEqual([]);
    expect(readUrgentIds({ answers: { c0: null } }, 0.7)).toEqual([]);
  });
});
