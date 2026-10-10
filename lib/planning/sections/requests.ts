// The other requests section of the event plan (label + details, e.g. "AV": "Two wireless microphones"):
// cleaning, change lines and the hotel summary. Used by plan.ts and the RequestsSection form.
import type { OtherRequest } from "../schema";
import type { Change } from "../changes";
import { formatTransition } from "../changes";
import { isSameText } from "../normalize";
import { matchByIdentity } from "../matchByIdentity";

// Rows with neither label nor details are blank lines in the form, not requests.
export function cleanRequests(requests: OtherRequest[]): OtherRequest[] {
  return requests
    .map((request) => ({ label: request.label.trim(), details: request.details.trim() }))
    .filter((request) => request.label !== "" || request.details !== "");
}

// The label is the identity: reordering must not look like a change, but a renamed label
// is a different request for the hotel, so it shows as removed + added.
export function diffRequests(before: OtherRequest[], after: OtherRequest[]): Change[] {
  const cleanBefore = cleanRequests(before);
  const cleanAfter = cleanRequests(after);
  const match = matchByIdentity(cleanBefore, cleanAfter, (request) => request.label);

  const changed: Change[] = match.pairs
    .filter(([old, current]) => !isSameText(old.details, current.details))
    .map(([old, current]): Change => ({
      section: "requests",
      kind: "changed",
      line: formatTransition(`Request ${current.label}:`, old.details, current.details),
    }));

  const removed: Change[] = match.removed.map((request): Change => ({
    section: "requests",
    kind: "removed",
    line: `Request removed: ${requestLabel(request)}`,
  }));

  const added: Change[] = match.added.map((request): Change => ({
    section: "requests",
    kind: "added",
    line: `Request added: ${requestLabel(request)}`,
  }));

  return [...changed, ...removed, ...added];
}

// Plain text for the planning_summary in the Data panel: one line per request, in the client's order.
export function summarizeRequests(requests: OtherRequest[]): string[] {
  const clean = cleanRequests(requests);
  if (clean.length === 0) return [];
  return ["Other requests:", ...clean.map((request) => `- ${requestLabel(request)}`)];
}

// "AV: Two wireless microphones", or just "AV" when no details were given.
function requestLabel(request: OtherRequest): string {
  return [request.label, request.details].filter((part) => part !== "").join(": ");
}
