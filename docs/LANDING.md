# Landing page (`/`)

One page, styled per `DESIGN.md` (`.container-wide`, `.section`, `--text-display` for the hero heading). Calm, monochrome, generous spacing. Copy below is final unless it reads badly in the layout; keep the meaning.

Each section is its own component in `components/landing/`.

## 1. Hero (`Hero.tsx`)

- Heading: **From "yes" to a ready event plan.**
- Lead: After a client accepts a proposal, hotels still chase them for the agenda, seating, extras and the guest list. This tool lets the client hand it all over in one place, right on the proposal.
- Button (`.btn`): **Try the demo** -> `/demo`.
- Secondary link: **Why I built this** -> scrolls to section 2.

## 2. The problem (`Problem.tsx`)

- Heading: **It started with a review**
- Text: A convention sales manager at a small city-center hotel in Germany gave Proposales full marks, and asked for one more thing:
- Quote (styled as a blockquote, large, `--text-lead`):
  > "What I would like Proposales to offer is a standalone tool for the client. An interface where they can enter the agenda, times, seating arrangement, and extras, along with a complete list of names and everything else needed for clear, seamless planning. Without us having to remind them or follow up on every step."
- The full review image `public/review.png` (use `next/image`), in a `.card`, with the caption "The original review (verified, 5.0)". On small screens it may be collapsed behind a "Show the full review" toggle.

## 3. What I built (`WhatIBuilt.tsx`)

- Heading: **What I built**
- Three steps, as three `.card`s in a row (stacked on mobile):
  1. **The client plans.** Once the proposal is accepted, the client opens one page and fills in the agenda, seating, extras, special requests and attendees with dietary needs. A guest list can be pasted straight from a spreadsheet.
  2. **It lives on the proposal.** The plan is saved on the proposal itself in Proposales. No new system, no extra database; the hotel sees it in the proposal's Data panel.
  3. **The hotel gets a clear email.** On submit, and again whenever something really changes: the full plan, what changed, a dietary summary for the kitchen and the guest list as a spreadsheet. Changes that need prompt attention, like a new allergy, are flagged at the top.
- Small line under the cards: "Retyping, reordering or fixing capitalization does not send an email. Only real changes do."

## 4. What I wish I could add (`Wishlist.tsx`)

- Heading: **What I would add with more access**
- Intro: Some of the best parts of this are not possible through the Proposales API today. These are my suggestions:
- List (each item: bold title + one sentence):
  - **A "Plan your event" button on the accepted proposal.** Today the hotel has to send the planning link separately, because the client's proposal page cannot show a link from the API.
  - **An event when a proposal is accepted.** Then the planning link could be emailed to the client automatically, the moment they say yes.
  - **Safe concurrent edits.** A version check on proposal data, so two saves can never cross.
  - **Cleaning up data.** A way to remove a stored value, not only to blank it.

## 5. Call to action (`CallToAction.tsx`)

- Heading: **See it in action**
- Text: Open a demo proposal, fill it with a sample plan in one click, and submit it to the "hotel".
- Button (`.btn`): **Open the demo** -> `/demo`.
- Small print (`.text-muted`): Built by Mervin Bratic as a prototype on the Proposales API. Demo data is shared, so you may see other visitors' changes.

## The demo page (`/demo`)

- Heading: **Try the demo**
- Two `.card`s side by side:
  - **Accepted proposal**: "Acme Sales Kickoff, 2 days, 40 people. The client has accepted, so planning is open." Button: **Plan the event**.
  - **Not yet accepted**: "Nordic Tech Summit, 1 day, 120 people. Planning opens only after acceptance; see what the client sees before that." Button: **See the locked page** (`.btn-secondary`).
- Note (`.text-muted`): In the real flow, the hotel sends the client a link to their own planning page after acceptance.
- Link back to `/`.
