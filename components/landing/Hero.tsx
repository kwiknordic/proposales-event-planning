// Landing page hero: headline, pitch, and the two entry points (demo, why I built it).
// Used by app/page.tsx.
import Link from "next/link";

export function Hero() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <h1 className="text-display max-w-3xl">From &quot;yes&quot; to a ready event plan.</h1>
        <p className="lead max-w-3xl mt-6">
          After a client accepts a proposal, hotels still chase them for the agenda, seating, extras
          and the guest list. This tool lets the client hand it all over in one place, right on the
          proposal.
        </p>
        <div className="flex flex-wrap items-center gap-6 mt-8">
          <Link className="btn" href="/demo">
            Try the demo
          </Link>
          <a className="btn-link" href="#why">
            Why I built this
          </a>
        </div>
      </div>
    </section>
  );
}
