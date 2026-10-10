"use client";
// The planning form on /plan/[uuid]: holds the plan being edited, composes the section cards
// and saves through POST /api/plan. The baseline is the plan as last read from or saved to the server.
import { useRef, useState } from "react";
import type { Plan } from "@/lib/planning/schema";
import { AgendaSection } from "./AgendaSection";
import { SeatingSection } from "./SeatingSection";

type Props = {
  uuid: string;
  initialPlan: Plan;
};

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "stale" }
  | { kind: "error"; message: string };

export function PlanningForm({ uuid, initialPlan }: Props) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  // A ref, not state: it is only read when saving, never rendered
  const baseline = useRef<Plan>(initialPlan);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  async function savePlan() {
    setSaveState({ kind: "saving" });
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, action: "save", baseline: baseline.current, plan }),
      });
      const result = await response.json();

      if (response.status === 409) {
        // The hotel edited the plan meanwhile: show their version, the client re-applies their change
        baseline.current = result.plan;
        setPlan(result.plan);
        setSaveState({ kind: "stale" });
        return;
      }
      if (!response.ok) {
        setSaveState({ kind: "error", message: saveErrorMessage(response.status) });
        return;
      }

      // Otherwise the client's own save would look like a hotel edit next time
      baseline.current = result.plan;
      setPlan(result.plan);
      setSaveState({ kind: "saved" });
    } catch {
      setSaveState({ kind: "error", message: "We could not reach the server. Check your connection and try again." });
    }
  }

  return (
    <div className="grid gap-6 mt-6">
      <AgendaSection agenda={plan.agenda} onChange={(agenda) => setPlan({ ...plan, agenda })} />
      <SeatingSection seating={plan.seating} onChange={(seating) => setPlan({ ...plan, seating })} />

      {saveState.kind === "stale" && (
        <p className="alert-error" role="alert">
          The hotel updated your plan. We reloaded it; please re-apply your change.
        </p>
      )}
      {saveState.kind === "error" && (
        <p className="alert-error" role="alert">
          {saveState.message}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="button" className="btn-secondary" onClick={savePlan} disabled={saveState.kind === "saving"}>
          {saveState.kind === "saving" ? "Saving..." : "Save"}
        </button>
        {saveState.kind === "saved" && <span className="alert-success">Saved</span>}
      </div>
    </div>
  );
}

function saveErrorMessage(status: number): string {
  if (status === 400) return "Some fields are too long or there are too many rows. Please shorten them and try again.";
  if (status === 403) return "This proposal is not accepted, so the plan cannot be saved.";
  if (status === 404) return "We could not find this proposal.";
  return "Saving failed. Please try again in a moment.";
}
