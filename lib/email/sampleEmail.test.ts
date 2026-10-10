// Tests for the small sample email shown on the landing page.
import { describe, expect, it } from "vitest";
import { sampleEmail } from "./sampleEmail";

describe("sampleEmail", () => {
  it("is an update with one urgent change", () => {
    expect(sampleEmail.kind).toBe("updated");
    expect(sampleEmail.subject.startsWith("[Action needed] Event plan updated:")).toBe(true);
    expect(sampleEmail.urgentChanges).toHaveLength(1);
    expect(sampleEmail.changes.length).toBeGreaterThan(sampleEmail.urgentChanges.length);
  });

  it("stays short: one entry in agenda, extras and attendees, no seating or other requests", () => {
    const { plan } = sampleEmail;
    expect(plan.agenda).toHaveLength(1);
    expect(plan.extras).toHaveLength(1);
    expect(plan.attendees).toHaveLength(1);
    expect(plan.seating).toEqual({ layout: "", notes: "" });
    expect(plan.requests).toEqual([]);
  });
});
