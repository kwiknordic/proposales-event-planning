// The Seating section: cleans the layout and notes, diffs them for change detection and writes
// the summary lines. Used by plan.ts (diffPlan, summary) and the save flow.
import type { Change } from "../changes";
import { formatTransition } from "../changes";
import { isSameText } from "../normalize";
import type { Seating } from "../schema";

export function cleanSeating(seating: Seating): Seating {
  return {
    layout: (seating.layout ?? "").trim(),
    notes: (seating.notes ?? "").trim(),
  };
}

export function diffSeating(before: Seating, after: Seating): Change[] {
  const changes: Change[] = [];
  if (!isSameText(before.layout, after.layout)) {
    changes.push({
      section: "seating",
      kind: "changed",
      line: formatTransition("Seating layout:", before.layout, after.layout),
    });
  }
  if (!isSameText(before.notes, after.notes)) {
    changes.push({
      section: "seating",
      kind: "changed",
      line: formatTransition("Seating notes:", before.notes, after.notes),
    });
  }
  return changes;
}

export function summarizeSeating(seating: Seating): string[] {
  const layout = (seating.layout ?? "").trim();
  const notes = (seating.notes ?? "").trim();
  const lines: string[] = [];
  if (layout !== "") lines.push(`Seating: ${layout}`);
  if (notes !== "") lines.push(`Seating notes: ${notes}`);
  return lines;
}
