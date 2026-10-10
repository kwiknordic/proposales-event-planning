// The whole plan, composed from the sections one by one: clean, diff, summary, staleness check.
// Used by the API route (save) and the planning page (reading the stored plan).
import type { Change } from "./changes";
import { emptyPlan, planSchema, type Plan } from "./schema";
import { cleanAgenda, diffAgenda, summarizeAgenda } from "./sections/agenda";
import { cleanSeating, diffSeating, summarizeSeating } from "./sections/seating";

export function cleanPlan(plan: Plan): Plan {
  return {
    ...plan,
    agenda: cleanAgenda(plan.agenda),
    seating: cleanSeating(plan.seating),
  };
}

export function diffPlan(before: Plan, after: Plan): Change[] {
  return [
    ...diffAgenda(before.agenda, after.agenda),
    ...diffSeating(before.seating, after.seating),
  ];
}

// Reuses the diff, so "someone else changed something" means the same as "a real change" everywhere.
export function isStale(baseline: Plan, stored: Plan): boolean {
  return diffPlan(baseline, stored).length > 0;
}

// Plain text for planning_summary, readable in the Proposales Data panel.
export function summarizePlan(plan: Plan): string {
  return [...summarizeAgenda(plan.agenda), ...summarizeSeating(plan.seating)].join("\n");
}

// The stored planning value comes from the proposal's custom data, which the hotel can edit freely.
// If it no longer fits the schema we cannot show it, so it reads as empty (and the next save replaces it).
export function readStoredPlan(planning: unknown): Plan {
  const parsed = planSchema.safeParse(planning ?? {});
  if (!parsed.success) {
    console.warn("Stored planning data does not match the plan schema; reading it as empty");
    return emptyPlan;
  }
  return cleanPlan(parsed.data);
}
