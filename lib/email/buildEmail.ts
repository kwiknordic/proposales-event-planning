// The hotel email as plain data: everything renderHtml and renderText need, built once from the
// plan, the changes and the urgency flags. Used by the API route after a submit or a real change.
import type { Change } from "@/lib/planning/changes";
import { summarizeDiets, type DietCount } from "@/lib/planning/dietSummary";
import { cleanPlan } from "@/lib/planning/plan";
import type { EmailKind } from "@/lib/planning/notifyRule";
import type { Plan } from "@/lib/planning/schema";

export type HotelEmail = {
  subject: string;
  kind: EmailKind;
  proposal: { title: string; status: string; editorUrl: string };
  urgentChanges: string[];
  changes: string[];
  plan: Plan;
  dietSummary: DietCount[];
  hasAttendees: boolean;
};

// The subject prefix is what the hotel sees first in the inbox, so urgent changes must show there.
// A first submit has no earlier plan to compare with, so it lists no changes.
export function buildEmail(input: {
  kind: EmailKind;
  proposal: { uuid: string; title: string; status: string };
  plan: Plan;
  changes: Change[];
  urgentChanges: string[];
}): HotelEmail {
  const plan = cleanPlan(input.plan);
  const prefix = input.urgentChanges.length > 0 ? "[Action needed] " : "";
  const subject =
    input.kind === "submitted"
      ? `${prefix}New event plan: ${input.proposal.title}`
      : `${prefix}Event plan updated: ${input.proposal.title}`;

  return {
    subject,
    kind: input.kind,
    proposal: {
      title: input.proposal.title,
      status: input.proposal.status,
      editorUrl: `https://secure.proposales.com/proposals/${input.proposal.uuid}/edit`,
    },
    urgentChanges: input.urgentChanges,
    changes: input.kind === "updated" ? input.changes.map((change) => change.line) : [],
    plan,
    dietSummary: summarizeDiets(plan.attendees),
    hasAttendees: plan.attendees.length > 0,
  };
}
