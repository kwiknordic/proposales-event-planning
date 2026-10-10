// Landing page section 3: the three steps of the flow (client plans, plan lives on the proposal, hotel gets an email).
// Used by app/page.tsx.

const steps = [
  {
    title: "The client plans",
    text: "Once the proposal is accepted, the client opens one page and fills in the agenda, seating, extras, special requests and attendees with dietary needs. A guest list can be pasted straight from a spreadsheet.",
  },
  {
    title: "It lives on the proposal",
    text: "The plan is saved on the proposal itself in Proposales. No new system, no extra database; the hotel sees it in the proposal's Data panel.",
  },
  {
    title: "The hotel gets a clear email",
    text: "On submit, and again whenever something really changes: the full plan, what changed, a dietary summary for the kitchen and the guest list as a spreadsheet. Changes that need prompt attention, like a new allergy, are flagged at the top.",
  },
];

export function WhatWeBuilt() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <h2>What we built</h2>
        <div className="grid-cards mt-8">
          {steps.map((step, index) => (
            <div className="card" key={step.title}>
              <p className="text-muted">Step {index + 1}</p>
              <h3>{step.title}</h3>
              <p className="mt-3">{step.text}</p>
            </div>
          ))}
        </div>
        <p className="text-muted mt-6">
          Retyping, reordering or fixing capitalization does not send an email. Only real changes do.
        </p>
      </div>
    </section>
  );
}
