// Landing section: what the hotel receives, shown with the real email renderer and a small sample.
// Used by app/page.tsx, after "What I built".
import { renderEmailContent } from "@/lib/email/renderHtml";
import { sampleEmail } from "@/lib/email/sampleEmail";

export function EmailPreview() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <h2>What the hotel receives</h2>
        <p className="lead mt-4 max-w-3xl">
          A sample update email, with one entry in each section. It comes from the same code that sends the real
          ones, so this is exactly what lands in the hotel&apos;s inbox.
        </p>

        <div className="card mt-8 grid gap-3 max-w-3xl">
          <p className="text-muted">From: Event planning</p>
          <p className="font-medium">{sampleEmail.subject}</p>
          <span className="badge justify-self-start">attendees.csv</span>
          {/* Our own email HTML, built from fixed sample data with every value escaped by renderHtml */}
          <div className="mt-3" dangerouslySetInnerHTML={{ __html: renderEmailContent(sampleEmail) }} />
        </div>
      </div>
    </section>
  );
}
