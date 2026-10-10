// Demo proposal ids from public env vars, and the sample plan that fills the demo form. Used by app/demo/page.tsx, the planning page demo banner and the demo reset route.
// Read via literal process.env.NEXT_PUBLIC_* access so Next inlines them into the client bundle.
// The sample plan goes through planSchema so an invalid fixture fails loudly at import, not in the browser.
import samplePlanJson from "@/fixtures/sample-plan.json";
import { planSchema, type Plan } from "@/lib/planning/schema";

export function getDemoProposalIds(): { accepted: string | null; pending: string | null } {
  return {
    accepted: process.env.NEXT_PUBLIC_DEMO_ACCEPTED_UUID || null,
    pending: process.env.NEXT_PUBLIC_DEMO_PENDING_UUID || null,
  };
}

// Empty strings are filtered out so an unset demo can never match an empty uuid.
export function isDemoProposal(uuid: string): boolean {
  const { accepted, pending } = getDemoProposalIds();
  return [accepted, pending].some((id) => id !== null && id === uuid);
}

export const samplePlan: Plan = planSchema.parse(samplePlanJson);
