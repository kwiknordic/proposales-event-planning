// Pairs the entries of two lists by an identity key (e.g. attendee name), never by position.
// Used by the list section diffs (agenda, requests, attendees) so reordering is not a change.
import { normalizeText } from "./normalize";

export type IdentityMatch<Entry> = {
  pairs: [before: Entry, after: Entry][];
  removed: Entry[];
  added: Entry[];
};

// Duplicate identities are paired in order: the first "Sam" before with the first "Sam" after.
export function matchByIdentity<Entry>(
  before: Entry[],
  after: Entry[],
  identity: (entry: Entry) => string,
): IdentityMatch<Entry> {
  const unmatchedAfter = [...after];
  const pairs: [Entry, Entry][] = [];
  const removed: Entry[] = [];

  for (const entry of before) {
    const key = normalizeText(identity(entry));
    const index = unmatchedAfter.findIndex((candidate) => normalizeText(identity(candidate)) === key);
    if (index === -1) {
      removed.push(entry);
    } else {
      pairs.push([entry, unmatchedAfter[index]]);
      unmatchedAfter.splice(index, 1);
    }
  }

  return { pairs, removed, added: unmatchedAfter };
}
