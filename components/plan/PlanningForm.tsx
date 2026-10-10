"use client";
// The planning form on /plan/[uuid]: holds the plan being edited, composes the section cards
// and saves through POST /api/plan. The baseline is the plan as last read from or saved to the server.
import { useRef, useState } from "react";
import { samplePlan } from "@/lib/demo";
import { emptyPlan, type Plan } from "@/lib/planning/schema";
import { AgendaSection } from "./AgendaSection";
import { AttendeesSection } from "./AttendeesSection";
import { DemoBanner } from "./DemoBanner";
import { ExtrasSection } from "./ExtrasSection";
import { RequestsSection } from "./RequestsSection";
import { SeatingSection } from "./SeatingSection";
import { StatusBadge } from "./StatusBadge";

type Props = {
  uuid: string;
  initialPlan: Plan;
  initialStatus: "submitted" | null;
  initialNotifiedAt: string | null;
  isDemo: boolean;
};

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "resetting" }
  | { kind: "saved"; message: string }
  | { kind: "stale" }
  | { kind: "error"; message: string };

export function PlanningForm({ uuid, initialPlan, initialStatus, initialNotifiedAt, isDemo }: Props) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [status, setStatus] = useState(initialStatus);
  const [notifiedAt, setNotifiedAt] = useState(initialNotifiedAt);
  // Demo only: a browser-local link to the email the hotel just got, so reviewers can see behind the curtain
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);

  function showEmailPreview(html: string | undefined) {
    if (emailPreviewUrl) URL.revokeObjectURL(emailPreviewUrl);
    setEmailPreviewUrl(html ? URL.createObjectURL(new Blob([html], { type: "text/html" })) : null);
  }
  // A ref, not state: it is only read when saving, never rendered
  const baseline = useRef<Plan>(initialPlan);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  async function savePlan(action: "save" | "submit") {
    setSaveState({ kind: "saving" });
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, action, baseline: baseline.current, plan }),
      });
      const result = await response.json();

      if (response.status === 409) {
        // Someone saved meanwhile (another tab, a colleague): show the stored version, the client re-applies
        baseline.current = result.plan;
        setPlan(result.plan);
        setSaveState({ kind: "stale" });
        return;
      }
      if (!response.ok) {
        setSaveState({ kind: "error", message: saveErrorMessage(response.status) });
        return;
      }

      // Otherwise the client's own save would look like someone else's edit next time
      baseline.current = result.plan;
      setPlan(result.plan);
      setSaveState({ kind: "saved", message: savedMessage(action, status, result.notifiedAt !== notifiedAt) });
      setStatus(result.status);
      setNotifiedAt(result.notifiedAt);
      showEmailPreview(result.emailPreview);
    } catch {
      setSaveState({ kind: "error", message: "We could not reach the server. Check your connection and try again." });
    }
  }

  // One request at a time: a save during a reset (or the other way round) would race
  const isBusy = saveState.kind === "saving" || saveState.kind === "resetting";

  // Demo only: the stored plan and status go back to empty, so the first submit can be tried again
  async function resetDemo() {
    setSaveState({ kind: "resetting" });
    try {
      const response = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });
      if (!response.ok) {
        setSaveState({ kind: "error", message: "Resetting the demo failed. Please try again." });
        return;
      }
      baseline.current = emptyPlan;
      setPlan(emptyPlan);
      setStatus(null);
      setNotifiedAt(null);
      showEmailPreview(undefined);
      setSaveState({ kind: "saved", message: "Demo reset" });
    } catch {
      setSaveState({ kind: "error", message: "We could not reach the server. Check your connection and try again." });
    }
  }

  return (
    <div className="grid gap-6 mt-6">
      {isDemo && (
        <DemoBanner
          // Fills the form only; the baseline stays, so saving compares against what is stored
          onFill={() => setPlan(samplePlan)}
          onReset={resetDemo}
          isResetting={saveState.kind === "resetting"}
        />
      )}
      <div>
        <StatusBadge status={status} notifiedAt={notifiedAt} />
      </div>
      <AgendaSection agenda={plan.agenda} onChange={(agenda) => setPlan({ ...plan, agenda })} />
      <SeatingSection seating={plan.seating} onChange={(seating) => setPlan({ ...plan, seating })} />
      <ExtrasSection extras={plan.extras} onChange={(extras) => setPlan({ ...plan, extras })} />
      <RequestsSection requests={plan.requests} onChange={(requests) => setPlan({ ...plan, requests })} />
      <AttendeesSection attendees={plan.attendees} onChange={(attendees) => setPlan({ ...plan, attendees })} />

      {saveState.kind === "stale" && (
        <p className="alert-error" role="alert">
          Your plan was changed somewhere else (another tab or a colleague). We reloaded it; please re-apply your change.
        </p>
      )}
      {saveState.kind === "error" && (
        <p className="alert-error" role="alert">
          {saveState.message}
        </p>
      )}

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-4">
          {status === "submitted" ? (
            <button type="button" className="btn" onClick={() => savePlan("save")} disabled={isBusy}>
              {saveState.kind === "saving" ? "Saving..." : "Save and update hotel"}
            </button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={() => savePlan("save")} disabled={isBusy}>
                Save
              </button>
              <button type="button" className="btn" onClick={() => savePlan("submit")} disabled={isBusy}>
                Submit to hotel
              </button>
            </>
          )}
          {saveState.kind === "saving" && status !== "submitted" && <span className="text-muted">Saving...</span>}
          {saveState.kind === "saved" && <span className="alert-success">{saveState.message}</span>}
          {emailPreviewUrl && (
            <a href={emailPreviewUrl} target="_blank" rel="noopener noreferrer">
              See the email the hotel got
            </a>
          )}
        </div>
        {status === "submitted" && (
          <p className="text-muted">The hotel is notified only when something actually changes.</p>
        )}
      </div>
    </div>
  );
}

// Tells the client whether the hotel heard about this save, so "Saved" never hides a missing email
function savedMessage(action: "save" | "submit", statusBefore: "submitted" | null, hotelNotified: boolean): string {
  if (statusBefore !== "submitted") return action === "submit" ? "Sent to the hotel" : "Saved";
  return hotelNotified ? "Saved, the hotel was notified" : "Saved, nothing changed for the hotel";
}

function saveErrorMessage(status: number): string {
  if (status === 400) return "Some fields are too long or there are too many rows. Please shorten them and try again.";
  if (status === 403) return "This proposal is not accepted, so the plan cannot be saved.";
  if (status === 404) return "We could not find this proposal.";
  return "Saving failed. Please try again in a moment.";
}
