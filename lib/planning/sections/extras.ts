// The extras section of the event plan: a plain list of equipment and services, with change lines and the hotel summary.
// Used by plan.ts (diffPlan, planSummary) and by the extras form in components/plan/ExtrasSection.tsx.
import type { Change } from "../changes";
import { matchByIdentity } from "../matchByIdentity";

// Blank rows are form leftovers, not extras. Trimming keeps the client's text but drops stray spaces.
export function cleanExtras(extras: string[]): string[] {
  return extras.map((extra) => extra.trim()).filter((extra) => extra !== "");
}

// The text itself is the identity: an extra is either there or not, so reordering is no change.
export function diffExtras(before: string[], after: string[]): Change[] {
  const match = matchByIdentity(cleanExtras(before), cleanExtras(after), (extra) => extra);

  const removed: Change[] = match.removed.map((extra): Change => ({
    section: "extras",
    kind: "removed",
    line: `Extra removed: ${extra}`,
  }));

  const added: Change[] = match.added.map((extra): Change => ({
    section: "extras",
    kind: "added",
    line: `Extra added: ${extra}`,
  }));

  return [...removed, ...added];
}

// Plain text for the planning_summary in the Data panel: one line per extra, in the client's order.
export function summarizeExtras(extras: string[]): string[] {
  const clean = cleanExtras(extras);
  if (clean.length === 0) return [];
  return ["Extras:", ...clean.map((extra) => `- ${extra}`)];
}
