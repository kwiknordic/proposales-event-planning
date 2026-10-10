// Landing section "See it in action": the closing call to open the demo at /demo.
// Used in app/page.tsx. Copy is final (docs/LANDING.md section 6).

import Link from "next/link";

export function CallToAction() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <div className="card text-center py-12">
          <h2>See it in action</h2>
          <p className="lead mt-4">
            Open a demo proposal, fill it with a sample plan in one click, and submit it to the
            &quot;hotel&quot;.
          </p>
          <Link className="btn mt-8" href="/demo">
            Open the demo
          </Link>
          <p className="text-muted mt-6">
            Built as a prototype on the Proposales API. Demo data is shared, so you may see other
            visitors&apos; changes.
          </p>
        </div>
      </div>
    </section>
  );
}
