// Landing page section 4: what I would add to the Proposales API with more access.
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
];

export function Wishlist() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <h2>What I would add with more access</h2>
        <p className="lead mt-4 max-w-3xl">
          Some of the best parts of this are not possible through the Proposales API today. These are my suggestions:
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
