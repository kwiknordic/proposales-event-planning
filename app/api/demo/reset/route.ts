// POST /api/demo/reset: puts a demo proposal back to "nothing planned, not sent" so the demo
// can be tried again. Used by the demo banner; real proposals are refused on the server.
import { z } from "zod";
import { isDemoProposal } from "@/lib/demo";
import { emptyPlan } from "@/lib/planning/schema";
import { getProposal, resetPlanningData } from "@/lib/proposales/client";

const resetRequestSchema = z.object({ uuid: z.string() });

export async function POST(request: Request) {
  const body = resetRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const { uuid } = body.data;

  // Checked first, so this route can never wipe the plan of a real client
  if (!isDemoProposal(uuid)) {
    return Response.json({ error: "not_a_demo" }, { status: 403 });
  }
  if (!(await getProposal(uuid))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  try {
    await resetPlanningData(uuid);
  } catch (error) {
    console.error("Resetting the demo failed", error);
    return Response.json({ error: "reset_failed" }, { status: 502 });
  }

  return Response.json({ plan: emptyPlan, status: null, notifiedAt: null });
}
