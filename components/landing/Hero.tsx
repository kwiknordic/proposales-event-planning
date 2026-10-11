import Link from "next/link";

export function Hero() {
  return (
    <section className="section-landing">
      <div className="container-wide text-center">
        {/* Dark first line, faded second line: the proposales.com headline style */}
        <h1 className="text-display text-balance">
          From &quot;yes&quot;
          <br />
          <span className="heading-muted">to a ready event plan.</span>
        </h1>
        <p className="lead max-w-2xl mx-auto mt-6">
          After a client accepts a proposal, hotels still chase them for the agenda, seating, extras and the guest list.
          This tool lets the client hand it all over in one place, right on the proposal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link className="btn" href="/demo">
            Try the demo
          </Link>
          <a className="btn-secondary" href="#why">
            Why I built this
          </a>
        </div>
      </div>
    </section>
  );
}
