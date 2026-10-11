// Pure Jev urgency logic: builds the batched noul request and reads which changes are urgent.
// Used by lib/jev/flagUrgent.ts; no I/O here so it can be tested and shown on its own.

// Tuned against the real API (2026-10-10, noul per change, stable over two runs):
//   urgent:     severe nut allergy added 0.97, headcount 25 -> 40 0.95-0.96,
//               diet (empty) -> gluten free 0.93, vegan -> vegan, nut allergy 0.93,
//               attendee added (halal) 0.88, lunch 12:00 -> 13:30 0.83
//   not urgent: headcount 8 -> 9 0.24, agenda item added 0.28, attendee removed 0.18,
//               seating layout change 0.13, extras and wording edits 0.04-0.09
// 0.7 sits well inside the gap; when in doubt we prefer missing a flag (the change is still listed).
export const THRESHOLD = 0.7;

// Jev judges one question per change, and a long email would make the batch slow.
// Changes past this cap are not flagged; they are still listed in the email.
export const MAX_CHANGES = 20;

// Ids are positional (c0, c1, ...) so the answers map back to the original change lines.
export function changeId(index: number): string {
  return `c${index}`;
}

// One fixed wording for every change; only the id differs per question.
function urgencyInstructions(id: string): string {
  return `Consider only the change with id "${id}". Does it need the hotel's prompt attention, for example a new or changed allergy or dietary need, a large change in the number of attendees, or a change of date or time?`;
}

// The batched request body: every change is its own noul question, all sharing one state.
export type UrgencyRequest = {
  model: string;
  state: { event: string; changes: { id: string; text: string }[] };
  questions: Record<string, { type: "noul"; instructions: string }>;
};

export function buildUrgencyRequest(eventTitle: string, changeLines: string[]): UrgencyRequest {
  const changes = changeLines.slice(0, MAX_CHANGES).map((text, index) => ({ id: changeId(index), text }));

  const questions = Object.fromEntries(
    changes.map(({ id }) => [id, { type: "noul" as const, instructions: urgencyInstructions(id) }]),
  );

  return {
    model: "jev-latest",
    state: { event: eventTitle, changes },
    questions,
  };
}

// Anything that does not look like a noul answer is skipped, so a partial or odd response
// flags fewer changes instead of failing the email.
export function readUrgentIds(response: unknown, threshold: number): string[] {
  const answers = readAnswers(response);
  if (answers === null) {
    return [];
  }

  return Object.entries(answers)
    .filter(([, answer]) => isUrgentNoul(answer, threshold))
    .map(([id]) => id);
}

function readAnswers(response: unknown): Record<string, unknown> | null {
  if (typeof response !== "object" || response === null || !("answers" in response)) {
    return null;
  }
  const answers = response.answers;
  if (typeof answers !== "object" || answers === null) {
    return null;
  }
  // Safe: answers is a non-null object, and every value is read as unknown and checked by isUrgentNoul.
  return answers as Record<string, unknown>;
}

function isUrgentNoul(answer: unknown, threshold: number): boolean {
  if (typeof answer !== "object" || answer === null || !("noul" in answer)) {
    return false;
  }
  const noul = answer.noul;
  return typeof noul === "number" && noul >= threshold;
}
