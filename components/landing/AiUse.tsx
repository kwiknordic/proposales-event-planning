// Landing section "AI use": where the Jev model is used, why, its guardrails, and the AI idea not built.
// Used by app/page.tsx, after "What the hotel receives".

export function AiUse() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <h2>Demo&apos;s use of AI</h2>
        <p className="lead mt-4 max-w-3xl">
          Demo uses AI for one narrow judgment: is this change urgent? Everything else follows simple rules that anyone
          can read and test.
        </p>

        <div className="grid-cards mt-8">
          <div className="card">
            <h3>What it does</h3>
            <p className="mt-3">
              When the client changes their plan, the{" "}
              <a href="https://docs.typesafe.ai">Jev model</a> answers one yes/no question per
              change: does it need the hotel&apos;s prompt attention? Urgent changes, like a new nut allergy, go in a
              &quot;Needs attention&quot; box at the top of the email, and the subject starts with [Action needed].
            </p>
          </div>
          <div className="card">
            <h3>Why Jev</h3>
            <p className="mt-3">
              A busy hotel should not miss an allergy between reworded extras. Jev does not write text; it returns a
              probability, so the code stays in control.
            </p>
          </div>
          <div className="card">
            <h3>Where it stops</h3>
            <p className="mt-3">
              It only decides what goes on top of the email, never whether the hotel is emailed or what is saved. It
              only sees the change lines and the event title, never the guest list. If it is slow or unavailable, the
              email still goes out with every change listed.
            </p>
          </div>
        </div>

        <p className="text-muted mt-6 max-w-3xl">
          Not built: my second idea was to turn unstructured input, like a forwarded email, a PDF or a spreadsheet,
          into a structured plan. That needs a general-purpose LLM, and I had no LLM credits for this prototype.
        </p>
      </div>
    </section>
  );
}
