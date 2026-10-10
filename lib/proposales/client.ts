// Server-side I/O for the Proposales API: read one proposal, write its planning custom data.
// Used by the /plan/[uuid] page and its API routes; never import this from client components.
import type { Plan } from "@/lib/planning/schema";
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

// The only keys the app ever writes on a proposal (docs/PRODUCT.md "Stored data").
export type PlanningData = {
  planning: Plan;
  planning_summary: string;
  planning_status?: "submitted";
  planning_submitted_at?: string;
  planning_notified_at?: string;
};

// The API merges arrays by index, so a shorter list would keep the old tail (verified:
// sending extras: [] over 3 extras keeps all 3). Clearing planning first makes the second
// write store the plan exactly as sent. Other custom data keys are left alone.
export async function savePlanningData(uuid: string, planningData: PlanningData): Promise<void> {
  await patchCustomData(uuid, { planning: null });
  await patchCustomData(uuid, planningData);
}

async function patchCustomData(uuid: string, customData: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${BASE_URL}/v3/proposals/${uuid}/data`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.PROPOSALES_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: customData }),
  });

  if (!response.ok) {
    throw new Error(`Proposales savePlanningData failed with status ${response.status}`);
  }
}
