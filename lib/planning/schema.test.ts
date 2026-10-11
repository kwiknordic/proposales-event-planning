// Tests for the plan schema: shape, defaults and the server-side limits.
import { describe, expect, it } from "vitest";
import samplePlan from "@/fixtures/sample-plan.json";
import { emptyPlan, planSchema } from "./schema";

describe("planSchema", () => {
  it("accepts the sample plan", () => {
    expect(planSchema.safeParse(samplePlan).success).toBe(true);
  });

  it("fills missing sections with empty values", () => {
    expect(planSchema.parse({})).toEqual(emptyPlan);
  });

  it("reads null text (stored by the hotel in the Data panel) as empty", () => {
    const plan = planSchema.parse({ attendees: [{ name: "Anna", diet: null }] });
    expect(plan.attendees).toEqual([{ name: "Anna", diet: "" }]);
  });

  it("rejects text over 500 characters", () => {
    expect(planSchema.safeParse({ extras: ["x".repeat(501)] }).success).toBe(false);
  });

  it("allows 1000 attendees but not 1001", () => {
    const attendees = (count: number) => Array.from({ length: count }, (_, i) => ({ name: `P${i}`, diet: "" }));
    expect(planSchema.safeParse({ attendees: attendees(1000) }).success).toBe(true);
    expect(planSchema.safeParse({ attendees: attendees(1001) }).success).toBe(false);
  });

  it("allows 100 rows in other lists but not 101", () => {
    expect(planSchema.safeParse({ extras: Array(100).fill("a") }).success).toBe(true);
    expect(planSchema.safeParse({ extras: Array(101).fill("a") }).success).toBe(false);
  });
});
