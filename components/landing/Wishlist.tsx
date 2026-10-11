// Landing page section: what I would add with more access (to the Proposales API, or to an LLM).
// Used by app/page.tsx.

const wishes = [
  {
    title: 'A "Plan your event" button on the accepted proposal.',
    text: "Today the hotel has to send the planning link separately, because the client's proposal page cannot show a link from the API.",
  },
  {
    title: "An event when a proposal is accepted.",
    text: "Then the planning link could be emailed to the client automatically, the moment they say yes.",
  },
  {
    title: "Safe concurrent edits.",
    text: "A version check on proposal data, so two saves can never cross.",
  },
  {
    title: "Cleaning up data.",
    text: "A way to remove a stored value, not only to blank it.",
  },
  {
    title: "Import a plan from any file.",
    text: "With LLM credits, the client could drop in an email, a PDF or a spreadsheet, and get a draft plan to review before saving.",
  },
];

export function Wishlist() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <h2>What I would add with more access</h2>
        <p className="lead mt-4 max-w-3xl">
          Some of the best parts of this are not possible today, through the Proposales API or without LLM credits. These are my suggestions:
        </p>
        <ul className="mt-8 grid gap-5 max-w-3xl">
          {wishes.map((wish) => (
            <li key={wish.title}>
              <strong className="font-medium">{wish.title}</strong> {wish.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
