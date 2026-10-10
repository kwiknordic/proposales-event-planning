// Placeholder home page (slice 0): a visual check of the design system until the landing page (slice 7).
export default function HomePage() {
  return (
    <main className="container section">
      <h1>Event planning for Proposales</h1>
      <p className="lead mt-4">Design system check: heading, buttons and a card.</p>
      <div className="flex gap-4 mt-6">
        <button className="btn">Primary action</button>
        <button className="btn-secondary">Secondary</button>
      </div>
      <div className="card mt-6">
        <h3>A card</h3>
        <p className="text-muted mt-2">White surface, thin border, no shadow.</p>
      </div>
    </main>
  );
}
