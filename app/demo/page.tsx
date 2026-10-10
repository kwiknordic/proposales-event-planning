// Demo entry page (/demo): links to the two demo proposals, or explains that none is configured.
import Link from "next/link";
import { getDemoProposalIds } from "@/lib/demo";

export default function DemoPage() {
  const { accepted, pending } = getDemoProposalIds();
  const noDemo = accepted === null && pending === null;

  return (
    <main className="container section">
      <h1>Demo</h1>
      <p className="lead mt-4">Two real proposals on the demo account. Open one to see the planning form or the locked page.</p>

      {noDemo ? (
        <div className="card mt-6">
          <p>No demo is configured. Set NEXT_PUBLIC_DEMO_ACCEPTED_UUID and NEXT_PUBLIC_DEMO_PENDING_UUID.</p>
        </div>
      ) : (
        <div className="grid-cards mt-6">
          {accepted !== null && (
            <div className="card">
              <h3>Acme Sales Kickoff - 2 days, 40 people</h3>
              <p className="text-muted mt-2">Accepted: opens the planning form.</p>
              <div className="mt-4">
                <Link className="btn" href={`/plan/${accepted}`}>Open planning form</Link>
              </div>
            </div>
          )}
          {pending !== null && (
            <div className="card">
              <h3>Nordic Tech Summit - 1 day, 120 people</h3>
              <p className="text-muted mt-2">Not accepted yet: shows the locked page.</p>
              <div className="mt-4">
                <Link className="btn-secondary" href={`/plan/${pending}`}>Open locked page</Link>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-6">
        <Link className="btn-link" href="/">Back to home</Link>
      </p>
    </main>
  );
}
