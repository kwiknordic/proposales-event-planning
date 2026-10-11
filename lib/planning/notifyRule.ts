// Decides which hotel email to send and what planning_status to store after a save or submit.
// Used by app/api/plan/route.ts. Deterministic: no AI involved.
import type { Change } from "./changes";

// The client's two buttons: "save" keeps the plan, "submit" also sends it to the hotel the first time.
export type PlanAction = "save" | "submit";
// Which hotel email goes out: the first full plan, or an update listing the changes.
export type EmailKind = "submitted" | "updated";
// The planning_status the app stores; null means not sent to the hotel yet.
export type PlanningStatus = "submitted" | null;

export type NotificationDecision = {
  email: EmailKind | null;
  status: PlanningStatus;
};

export type NotifyInput = {
  status: string | null | undefined;
  action: PlanAction;
  changes: Change[];
};

// Only the exact stored value "submitted" counts; anything else is treated as not submitted.
// The first submit always emails, even with no changes, because the hotel has not seen the plan yet.
export function decideNotification(input: NotifyInput): NotificationDecision {
  const isSubmitted = input.status === "submitted";

  if (!isSubmitted) {
    if (input.action === "save") return { email: null, status: null };
    return { email: "submitted", status: "submitted" };
  }

  // After submit the UI has no "submit again", so submit behaves exactly like save.
  // Retyping or reordering produces no changes, so the hotel is not bothered.
  const email = input.changes.length > 0 ? "updated" : null;
  return { email, status: "submitted" };
}
