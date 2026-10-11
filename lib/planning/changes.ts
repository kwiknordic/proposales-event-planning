// The Change type every section diff returns, and helpers that write readable change lines
// (e.g. "Hugo Berg: diet (empty) -> vegan"). Used by sections/*, notifyRule and the hotel email.

export type PlanSection = "agenda" | "seating" | "extras" | "requests" | "attendees";

export type Change = {
  section: PlanSection;
  kind: "added" | "removed" | "changed";
  line: string;
};

export function formatValue(text: string | null | undefined): string {
  const trimmed = (text ?? "").trim();
  return trimmed === "" ? "(empty)" : trimmed;
}

// "Agenda: Lunch" + "12:00" + "12:30" -> "Agenda: Lunch 12:00 -> 12:30".
// A subject ending in ":" or a field name reads naturally either way.
export function formatTransition(
  subject: string,
  before: string | null | undefined,
  after: string | null | undefined,
): string {
  return `${subject} ${formatValue(before)} -> ${formatValue(after)}`;
}
