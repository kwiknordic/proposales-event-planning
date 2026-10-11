// The attendees section of the event plan: cleaning, change lines, the hotel summary and the paste import.
// Used by plan.ts (diffPlan, planSummary) and by the attendee form in components/plan/AttendeesSection.tsx.
import type { Attendee } from "../schema";
import type { Change } from "../changes";
import { formatTransition } from "../changes";
import { isSameText } from "../normalize";
import { matchByIdentity } from "../matchByIdentity";

// A diet without a name is not a person, so such rows are dropped.
export function cleanAttendees(attendees: Attendee[]): Attendee[] {
  return attendees
    .map((attendee) => ({ name: attendee.name.trim(), diet: attendee.diet.trim() }))
    .filter((attendee) => attendee.name !== "");
}

// The name is the identity: a retyped diet is a change, a reordered list is not.
// The headcount line comes first so a jump in numbers is visible at a glance.
export function diffAttendees(before: Attendee[], after: Attendee[]): Change[] {
  const cleanBefore = cleanAttendees(before);
  const cleanAfter = cleanAttendees(after);
  const match = matchByIdentity(cleanBefore, cleanAfter, (attendee) => attendee.name);

  const countLine: Change[] =
    cleanBefore.length === cleanAfter.length
      ? []
      : [
          {
            section: "attendees",
            kind: "changed",
            line: formatTransition("Attendees:", String(cleanBefore.length), String(cleanAfter.length)),
          },
        ];

  const changed: Change[] = match.pairs
    .filter(([old, current]) => !isSameText(old.diet, current.diet))
    .map(([old, current]): Change => ({
      section: "attendees",
      kind: "changed",
      line: formatTransition(`${current.name}: diet`, old.diet, current.diet),
    }));

  const removed: Change[] = match.removed.map((attendee): Change => ({
    section: "attendees",
    kind: "removed",
    line: `Attendee removed: ${attendeeLabel(attendee)}`,
  }));

  const added: Change[] = match.added.map((attendee): Change => ({
    section: "attendees",
    kind: "added",
    line: `Attendee added: ${attendeeLabel(attendee)}`,
  }));

  return [...countLine, ...changed, ...removed, ...added];
}

// Plain text for the planning_summary in the Data panel: a headcount, then one line per attendee.
export function summarizeAttendees(attendees: Attendee[]): string[] {
  const clean = cleanAttendees(attendees);
  if (clean.length === 0) return [];
  return [`Attendees (${clean.length}):`, ...clean.map((attendee) => `- ${attendeeLabel(attendee)}`)];
}

// Reads a list pasted by the client, one person per line: "Name", "Name, diet", "Name - diet"
// or "Name<TAB>diet" (a spreadsheet copy). The separators are tried in that order, so a hyphen
// inside a name ("Anne-Marie") is not taken for a separator: " - " needs spaces around it.
export function parsePastedAttendees(text: string): Attendee[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map(splitPastedLine)
    .map(([name, diet]) => ({ name: collapseSpaces(name), diet: collapseSpaces(diet) }))
    .filter((attendee) => attendee.name !== "");
}

// Splits one pasted line at the first separator found, in priority order (tab, comma, " - ").
function splitPastedLine(line: string): [name: string, diet: string] {
  for (const separator of ["\t", ",", " - "]) {
    const position = line.indexOf(separator);
    if (position !== -1) return [line.slice(0, position), line.slice(position + separator.length)];
  }
  return [line, ""];
}

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function attendeeLabel(attendee: Attendee): string {
  return attendee.diet === "" ? attendee.name : `${attendee.name} (${attendee.diet})`;
}
