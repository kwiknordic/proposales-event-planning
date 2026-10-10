// Server-side I/O for reading one Proposales proposal (GET /v3/proposals/{uuid}).
// Used by the /plan/[uuid] page and its API routes; never import this from client components.
import { parseProposal, type Proposal } from "./parseProposal";

const BASE_URL = "https://api.proposales.com";

// The real API answers 500 (not 400) for malformed ids, so we check the format
// ourselves and skip the call entirely.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProposal(uuid: string): Promise<Proposal | null> {
  if (!UUID_PATTERN.test(uuid)) {
    return null;
  }

  const response = await fetch(`${BASE_URL}/v3/proposals/${uuid}`, {
    headers: { Authorization: `Bearer ${process.env.PROPOSALES_API_KEY}` },
    // Planning data changes on every save, so a cached proposal would show stale plans.
    cache: "no-store",
  });

  // 404 and 500 both mean "not found" for unknown ids. Log only the status, never the key.
  if (response.status !== 200) {
    console.warn(`Proposales getProposal failed with status ${response.status}`);
    return null;
  }

  return parseProposal(await response.json());
}
