// Demo entry page (/demo): links to the two demo proposals, or explains that none is configured.
import Link from "next/link";
import { getDemoProposalIds } from "@/lib/demo";

export default function DemoPage() {
  const { accepted, pending } = getDemoProposalIds();
  const noDemo = accepted === null && pending === null;

  return (
    <main className="container-wide section">
      <h1>Try the demo</h1>

      {noDemo ? (
        <div className="card mt-6">
          <p>No demo is configured. Set NEXT_PUBLIC_DEMO_ACCEPTED_UUID and NEXT_PUBLIC_DEMO_PENDING_UUID.</p>
        </div>
      ) : (
        <div className="grid-cards mt-6">
          {accepted !== null && (
            <div className="card grid gap-3 content-start">
              <h3>Accepted proposal</h3>
              <p>Acme Sales Kickoff, 2 days, 40 people. The client has accepted, so planning is open.</p>
              <Link className="btn justify-self-start mt-2" href={`/plan/${accepted}`}>
                Plan the event
              </Link>
            </div>
          )}
          {pending !== null && (
            <div className="card grid gap-3 content-start">
              <h3>Not yet accepted</h3>
              <p>
                Nordic Tech Summit, 1 day, 120 people. Planning opens only after acceptance; see what the client
                sees before that.
              </p>
              <Link className="btn-secondary justify-self-start mt-2" href={`/plan/${pending}`}>
                See the locked page
              </Link>
            </div>
          )}
        </div>
      )}

      <p className="text-muted mt-6">
        In the real flow, the hotel sends the client a link to their own planning page after acceptance.
      </p>
      <p className="mt-6">
        <Link href="/">Back to the start</Link>
      </p>
    </main>
  );
}
