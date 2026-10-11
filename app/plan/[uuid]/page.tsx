// Planning page for one proposal: loads it fresh on every request and applies the gate
// (accepted -> form, other status -> locked, missing -> not found).
import { Suspense } from "react";
import { connection } from "next/server";
import { PlanningForm } from "@/components/plan/PlanningForm";
import { isDemoProposal } from "@/lib/demo";
import { readStoredPlan } from "@/lib/planning/plan";
import { getProposal } from "@/lib/proposales/client";

export default function PlanPage({ params }: { params: Promise<{ uuid: string }> }) {
  return (
    <main className="container section">
      {/* The proposal is read at request time (the hotel may have edited it), so it streams in */}
      <Suspense fallback={<p className="text-muted">Loading your proposal...</p>}>
        <ProposalGate params={params} />
      </Suspense>
    </main>
  );
}

async function ProposalGate({ params }: { params: Promise<{ uuid: string }> }) {
  await connection(); // always read at request time, never prerendered
  const { uuid } = await params;
  // A network failure gets the same friendly message as a missing proposal
  const proposal = await getProposal(uuid).catch((error) => {
    console.error("Loading proposal failed", error);
    return null;
  });

  if (!proposal) {
    return (
      <div className="card">
        <h1>We could not find this proposal</h1>
        <p className="text-muted mt-2">Check the link the hotel sent you, or ask the hotel for a new one.</p>
      </div>
    );
  }

  if (proposal.status !== "accepted") {
    return (
      <div className="card">
        <p className="text-muted">{proposal.title}</p>
        <h1 className="mt-2">Event planning opens <em className="underline">after</em> you accept the proposal</h1>
      </div>
    );
  }

  return (
    <PlanningForm
      uuid={proposal.uuid}
      title={proposal.title}
      initialPlan={readStoredPlan(proposal.data.planning)}
      initialStatus={proposal.data.planning_status === "submitted" ? "submitted" : null}
      initialNotifiedAt={typeof proposal.data.planning_notified_at === "string" ? proposal.data.planning_notified_at : null}
      isDemo={isDemoProposal(proposal.uuid)}
    />
  );
}
