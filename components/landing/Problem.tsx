// Landing page section 2: where the idea came from, the customer's quote and the original review image.
// Used by app/page.tsx (anchor #why is the target of the hero's secondary link).
import Image from "next/image";

export function Problem() {
  return (
    <section id="why" className="section-landing">
      <div className="container-wide">
        <div className="grid gap-10 md:grid-cols-2 items-start">
          <div>
            <h2>It started with a review</h2>
            <p className="lead mt-4">
              A convention sales manager at a small city-center hotel in Germany gave Proposales full
              marks, and asked for one more thing:
            </p>
            <blockquote className="quote mt-6">
              &quot;What I would like Proposales to offer is a standalone tool for the client. An
              interface where they can enter the agenda, times, seating arrangement, and extras, along
              with a complete list of names and everything else needed for clear, seamless planning.
              Without us having to remind them or follow up on every step.&quot;
            </blockquote>
          </div>
          <figure className="card max-w-md">
            <Image
              src="/review.png"
              alt="The original customer review: five stars for Proposales, from a convention sales manager at a small city-center hotel in Germany, with a request for a standalone planning tool for clients."
              width={875}
              height={1164}
              className="h-auto w-full"
              sizes="(min-width: 768px) 400px, 100vw"
            />
            <figcaption className="text-muted mt-3">The original review (verified, 5.0)</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
