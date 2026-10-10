// Builds the attendees.csv attachment (columns name,diet) from the plan's attendees.
// Used by app/api/plan/route.ts; the sender (sendEmail) adds the UTF-8 BOM so Excel reads accents correctly.
import type { Attendee } from "@/lib/planning/schema";

const HEADER = "name,diet";
const LINE_END = "\r\n";

// A leading = + - or @ makes spreadsheets run the cell as a formula; a quote prefix keeps it text.
const FORMULA_START = /^[=+\-@]/;
// Characters that force a value into double quotes under RFC 4180.
const NEEDS_QUOTES = /[",\r\n]/;

export function attendeesCsv(attendees: Attendee[]): string {
  const rows = attendees.map((attendee) => `${csvCell(attendee.name)},${csvCell(attendee.diet)}`);
  return [HEADER, ...rows].join(LINE_END) + LINE_END;
}

// The guard runs first so the apostrophe is itself inside the quotes when both apply.
function csvCell(value: string): string {
  const guarded = FORMULA_START.test(value) ? `'${value}` : value;
  if (!NEEDS_QUOTES.test(guarded)) return guarded;
  return `"${guarded.replace(/"/g, '""')}"`;
}
