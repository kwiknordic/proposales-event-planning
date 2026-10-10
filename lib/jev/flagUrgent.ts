// Server-side I/O: asks Jev which change lines need the hotel's attention, or none on failure.
// Used by the hotel email step (app/api/plan/route.ts). Never throws: Jev only adds a box to the email.
// Privacy: only the event title and the change lines are sent. Never attendee lists or other plan data.
import { buildUrgencyRequest, changeId, readUrgentIds, THRESHOLD } from "./urgency";

const JEV_URL = "https://api.typesafe.ai/v1/systemone";

// Jev is optional presentation: the email must not wait long for it.
const TIMEOUT_MS = 4000;

export async function flagUrgent(eventTitle: string, changeLines: string[]): Promise<string[]> {
  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey || changeLines.length === 0) {
    return [];
  }

  try {
    const response = await fetch(JEV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildUrgencyRequest(eventTitle, changeLines)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Log only the status: the key and the change text must never reach the server log.
    if (!response.ok) {
      console.error(`Jev urgency: request failed with status ${response.status}`);
      return [];
    }

    const urgentIds = readUrgentIds(await response.json(), THRESHOLD);
    return changeLines.filter((_, index) => urgentIds.includes(changeId(index)));
  } catch (error) {
    console.error("Jev urgency: call failed", error instanceof Error ? error.name : "");
    return [];
  }
}
