// The agenda section of the event plan: cleaning, change lines and the hotel summary.
// Used by plan.ts (diffPlan, planSummary) and by the agenda form in components/plan/AgendaSection.tsx.
import type { AgendaItem } from "../schema";
import type { Change } from "../changes";
import { formatTransition } from "../changes";
import { isSameText } from "../normalize";
import { matchByIdentity } from "../matchByIdentity";

// Rows with neither time nor title are blank lines in the form, not agenda items.
export function cleanAgenda(items: AgendaItem[]): AgendaItem[] {
  return items
    .map((item) => ({ time: item.time.trim(), title: item.title.trim() }))
    .filter((item) => item.time !== "" || item.title !== "");
}

// The title is the identity: moving a row or changing its time must not look like a new item.
export function diffAgenda(before: AgendaItem[], after: AgendaItem[]): Change[] {
  const cleanBefore = cleanAgenda(before);
  const cleanAfter = cleanAgenda(after);
  const match = matchByIdentity(cleanBefore, cleanAfter, (item) => item.title);

  const changed: Change[] = match.pairs
    .filter(([old, current]) => !isSameText(old.time, current.time))
    .map(([old, current]): Change => ({
      section: "agenda",
      kind: "changed",
      line: formatTransition(`Agenda: ${current.title}`, old.time, current.time),
    }));

  const removed: Change[] = match.removed.map((item): Change => ({
    section: "agenda",
    kind: "removed",
    line: `Agenda removed: ${agendaLabel(item)}`,
  }));

  const added: Change[] = match.added.map((item): Change => ({
    section: "agenda",
    kind: "added",
    line: `Agenda added: ${agendaLabel(item)}`,
  }));

  return [...changed, ...removed, ...added];
}

// Plain text for the planning_summary in the Data panel: one line per item, in the client's order.
export function summarizeAgenda(items: AgendaItem[]): string[] {
  const clean = cleanAgenda(items);
  if (clean.length === 0) return [];
  return ["Agenda:", ...clean.map((item) => `- ${agendaLabel(item)}`)];
}

// "09:00 Welcome", or just "Welcome" when no time was given.
function agendaLabel(item: AgendaItem): string {
  return [item.time, item.title].filter((part) => part !== "").join(" ");
}
