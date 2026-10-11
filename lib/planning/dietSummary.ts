// Counts attendees per diet for the hotel email ("vegetarian: 2, no restriction: 4").
// Used by lib/email/buildEmail.ts.

import type { Attendee } from "./schema";
import { normalizeText } from "./normalize";

export type DietCount = { diet: string; count: number };

const NO_RESTRICTION_TEXTS = new Set(["", "none", "no", "-", "n/a"]);
const NO_RESTRICTION = "no restriction";

// Groups attendees by normalized diet. "No restriction" always goes last, so the hotel
// sees the special diets first; the other diets are sorted by count, then by name.
export function summarizeDiets(attendees: Attendee[]): DietCount[] {
  const counts = new Map<string, number>();
  for (const attendee of attendees) {
    if (attendee.name.trim() === "") continue;
    const diet = dietKey(attendee.diet);
    counts.set(diet, (counts.get(diet) ?? 0) + 1);
  }

  const restricted = [...counts.entries()]
    .filter(([diet]) => diet !== NO_RESTRICTION)
    .map(([diet, count]): DietCount => ({ diet, count }))
    .sort((a, b) => b.count - a.count || (a.diet < b.diet ? -1 : a.diet > b.diet ? 1 : 0));

  const unrestricted = counts.get(NO_RESTRICTION);
  return unrestricted === undefined ? restricted : [...restricted, { diet: NO_RESTRICTION, count: unrestricted }];
}

function dietKey(diet: string): string {
  const normalized = normalizeText(diet);
  return NO_RESTRICTION_TEXTS.has(normalized) ? NO_RESTRICTION : normalized;
}
