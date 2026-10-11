// POST /api/plan: the client saves or submits the event plan. Validate, gate, staleness check,
// save, then email the hotel when the notify rule says so. Each step is one lib/ function.
import { z } from "zod";
import { isDemoProposal } from "@/lib/demo";
import { attendeesCsv } from "@/lib/email/attendeesCsv";
import { buildEmail } from "@/lib/email/buildEmail";
import { renderHtml } from "@/lib/email/renderHtml";
import { renderText } from "@/lib/email/renderText";
import { sendEmail } from "@/lib/email/sendEmail";
import { flagUrgent } from "@/lib/jev/flagUrgent";
import type { Change } from "@/lib/planning/changes";
import { decideNotification, type EmailKind } from "@/lib/planning/notifyRule";
import { cleanPlan, diffPlan, isStale, readStoredPlan, summarizePlan } from "@/lib/planning/plan";
import { planSchema, type Plan } from "@/lib/planning/schema";
import { getProposal, savePlanningData, type PlanningData } from "@/lib/proposales/client";
import { readNotifiedAt, readPlanningStatus, type Proposal } from "@/lib/proposales/parseProposal";

const planRequestSchema = z.object({
  uuid: z.string(),
  action: z.enum(["save", "submit"]),
  baseline: planSchema,
  plan: planSchema,
});

export async function POST(request: Request) {
  const body = planRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "invalid_plan" }, { status: 400 });
  }
  const { uuid, action, baseline, plan } = body.data;

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
  const changes = diffPlan(stored, next);
  const decision = decideNotification({ status: readPlanningStatus(proposal), action, changes });
  const now = new Date().toISOString();

  // Only the keys that change are sent; the API leaves the others (e.g. planning_submitted_at) alone
  const planningData: PlanningData = { planning: next, planning_summary: summarizePlan(next) };
  if (decision.status) planningData.planning_status = decision.status;
  if (decision.email === "submitted") planningData.planning_submitted_at = now;
  if (decision.email === "updated") planningData.planning_notified_at = now;

  try {
    await savePlanningData(uuid, planningData);
  } catch (error) {
    console.error("Saving the plan failed", error);
    return Response.json({ error: "save_failed" }, { status: 502 });
  }

  const sentEmailHtml = decision.email ? await emailHotel(decision.email, proposal, next, changes) : null;

  return Response.json({
    plan: next,
    status: decision.status,
    notifiedAt: planningData.planning_notified_at ?? readNotifiedAt(proposal),
    // Demo only: lets a reviewer open the exact email the hotel just got. Real clients never see it.
    // undefined leaves the key out of the JSON, so real clients get no emailPreview field at all
    emailPreview: sentEmailHtml && isDemoProposal(uuid) ? sentEmailHtml : undefined,
  });
}

// The plan is already saved at this point, so an email problem is logged, never returned as an error.
// Returns the email's HTML, or null when building it failed.
async function emailHotel(kind: EmailKind, proposal: Proposal, plan: Plan, changes: Change[]): Promise<string | null> {
  try {
    // Jev only highlights; it never decides whether the email goes out. A first submit has no changes to judge.
    const urgentChanges =
      kind === "updated"
        ? await flagUrgent(
            proposal.title,
            changes.map((change) => change.line),
          )
        : [];
    const email = buildEmail({ kind, proposal, plan, changes, urgentChanges });
    const html = renderHtml(email);
    await sendEmail({
      subject: email.subject,
      html,
      text: renderText(email),
      attendeesCsv: email.hasAttendees ? attendeesCsv(email.plan.attendees) : null,
    });
    return html;
  } catch (error) {
    console.error("Emailing the hotel failed", error);
    return null;
  }
}
