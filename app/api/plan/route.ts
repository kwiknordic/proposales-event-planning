// POST /api/plan: the client saves the event plan. Validate, gate, staleness check, save.
// Each step is a lib/ function; see docs/ARCHITECTURE.md "Data flow: saving the plan".
import { z } from "zod";
import { cleanPlan, isStale, readStoredPlan, summarizePlan } from "@/lib/planning/plan";
import { planSchema } from "@/lib/planning/schema";
import { getProposal, savePlanningData } from "@/lib/proposales/client";

const planRequestSchema = z.object({
  uuid: z.string(),
  action: z.enum(["save"]),
  baseline: planSchema,
  plan: planSchema,
});

export async function POST(request: Request) {
  const body = planRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "invalid_plan" }, { status: 400 });
  }
  const { uuid, baseline, plan } = body.data;

  const proposal = await getProposal(uuid);
  if (!proposal) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  // Same gate as the page: hiding the form is not the only protection
  if (proposal.status !== "accepted") {
    return Response.json({ error: "not_accepted" }, { status: 403 });
  }

  // Never silently overwrite a save made elsewhere (another tab, a colleague) while the page was open
  const stored = readStoredPlan(proposal.data.planning);
  if (isStale(cleanPlan(baseline), stored)) {
    return Response.json({ error: "stale", plan: stored }, { status: 409 });
  }

  const next = cleanPlan(plan);
  try {
    await savePlanningData(uuid, { planning: next, planning_summary: summarizePlan(next) });
  } catch (error) {
    console.error("Saving the plan failed", error);
    return Response.json({ error: "save_failed" }, { status: 502 });
  }

  return Response.json({ plan: next, status: proposal.data.planning_status ?? null });
}
