// Turns the raw Proposales API response into a flat Proposal.
// Used by lib/proposales/client.ts so the rest of the app never sees the nested `data.data` shape.
import type { PlanningStatus } from "@/lib/planning/notifyRule";

export type Proposal = {
  uuid: string;
  title: string;
  status: string;
  data: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The API nests the custom data one level deeper (`data.data`). A missing or null
// custom data block means "nothing saved yet", so it becomes an empty object.
export function parseProposal(raw: unknown): Proposal {
  if (!isRecord(raw) || !isRecord(raw.data)) {
    throw new Error("Unexpected Proposales response: missing proposal");
  }
  const proposal = raw.data;
  const customData = isRecord(proposal.data) ? proposal.data : {};

  if (
    typeof proposal.uuid !== "string" ||
    typeof proposal.title !== "string" ||
    typeof proposal.status !== "string"
  ) {
    throw new Error("Unexpected Proposales response: uuid, title or status is not a string");
  }

  return {
    uuid: proposal.uuid,
    title: proposal.title,
    status: proposal.status,
    data: customData,
  };
}

// The hotel can edit custom data freely, so only the exact value "submitted" counts as submitted.
export function readPlanningStatus(proposal: Proposal): PlanningStatus {
  return proposal.data.planning_status === "submitted" ? "submitted" : null;
}

export function readNotifiedAt(proposal: Proposal): string | null {
  const notifiedAt = proposal.data.planning_notified_at;
  return typeof notifiedAt === "string" ? notifiedAt : null;
}
