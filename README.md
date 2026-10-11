# From "yes" to a ready event plan.

After a client accepts a proposal, hotels still chase them for the agenda, seating, extras and the guest list. This tool lets the client hand it all over in one place, right on the proposal.

Built by Mervin Bratic as a prototype on the [Proposales](https://proposales.com) API with the help of Claude.

**Live:** [`Event planning`](https://proposales-event-planning.vercel.app/)

## It started with a review

A convention sales manager at a small city-center hotel in Germany gave Proposales full marks, and asked for one more thing:

> "What I would like Proposales to offer is a standalone tool for the client. An interface where they can enter the agenda, times, seating arrangement, and extras, along with a complete list of names and everything else needed for clear, seamless planning. Without us having to remind them or follow up on every step."

The original review (verified, 5.0) is in [`public/review.png`](public/review.png).

## What I built

1. **The client plans.** Once the proposal is accepted, the client opens one page and fills in the agenda, seating, extras, special requests and attendees with dietary needs. A guest list can be pasted straight from a spreadsheet.
2. **It lives on the proposal.** The plan is saved on the proposal itself in Proposales. No new system, no extra database; the hotel sees it in the proposal's Data panel.
3. **The hotel gets a clear email.** On submit, and again whenever something really changes: the full plan, what changed, a dietary summary for the kitchen and the guest list as a spreadsheet.

Retyping, reordering or fixing capitalization does not send an email. Only real changes do.

## What the hotel receives

An email with the proposal title and a link to open it in Proposales, then: urgent changes in a "Needs attention" box, the list of changes, the full plan, a dietary summary (for example `vegetarian: 2, vegan: 1, no restriction: 4`) and the attendee table, with `attendees.csv` attached. The landing page shows a sample, rendered by the same code that sends the real ones.

## Demo's use of AI

The demo uses AI for one narrow judgment: is this change urgent? Everything else follows simple rules that anyone can read and test.

- **What it does.** When the client changes their plan, the [Jev model](https://docs.typesafe.ai) answers one yes/no question per change: does it need the hotel's prompt attention? Urgent changes, like a new nut allergy, go in a "Needs attention" box at the top of the email, and the subject starts with `[Action needed]`.
- **Why Jev.** A busy hotel should not miss an allergy between reworded extras. Jev does not write text; it returns a probability, so the code stays in control.
- **Where it stops.** It only decides what goes on top of the email, never whether the hotel is emailed or what is saved. It only sees the change lines and the event title, never the guest list. If it is slow or unavailable, the email still goes out with every change listed.

Not built: my second idea was to turn unstructured input, like a forwarded email, a PDF or a spreadsheet, into a structured plan. That needs a general-purpose LLM, and I had no LLM credits for this prototype. The Jev API credits are valid until October 19, 2026; after that, emails go out without urgency flags.

## What I would add with more access

Some of the best parts of this are not possible today, through the Proposales API or without LLM credits. These are my suggestions:

- **A "Plan your event" button on the accepted proposal.** Today the hotel has to send the planning link separately, because the client's proposal page cannot show a link from the API.
- **An event when a proposal is accepted.** Then the planning link could be emailed to the client automatically, the moment they say yes.
- **Safe concurrent edits.** A version check on proposal data, so two saves can never cross.
- **Cleaning up data.** A way to remove a stored value, not only to blank it.
- **Import a plan from any file.** With LLM credits, the client could drop in an email, a PDF or a spreadsheet, and get a draft plan to review before saving.

## See it in action

Open a demo proposal, fill it with a sample plan in one click, and submit it to the "hotel".

1. Open `/demo` and click **Plan the event**.
2. Click **Fill with sample plan**, then **Submit to hotel**. Click **See the email the hotel got** to open the exact email in a new tab.
3. Change something real, for example give an attendee a nut allergy, and click **Save and update hotel**. The update email lists the change and flags it as urgent.
4. Reorder rows or retype text with different capitals and save again: no email, because nothing really changed.
5. **See the locked page** on `/demo` shows what a client sees before accepting: planning stays closed.
6. **Reset demo** puts the demo back to "nothing planned, not sent", so you can try the first submit again.

Demo data is shared, so you may see other visitors' changes. The demo emails go to one "hotel" inbox (`HOTEL_NOTIFY_EMAIL`).

## Run it yourself

Requires Node 22 and npm.

```bash
npm install
cp .env.example .env    # then fill in the values below
npm run dev             # http://localhost:3000
```

| Variable                                                          | Needed for                           | Without it                             |
| ----------------------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| `PROPOSALES_API_KEY`                                              | Reading and saving proposals         | Nothing works                          |
| `NEXT_PUBLIC_DEMO_ACCEPTED_UUID`, `NEXT_PUBLIC_DEMO_PENDING_UUID` | The `/demo` page and the demo banner | `/demo` says no demo is configured     |
| `RESEND_API_KEY`, `HOTEL_NOTIFY_EMAIL`                            | Sending the hotel email              | The email is printed to the server log |
| `JEV_API_KEY`                                                     | Flagging urgent changes              | Emails go out without flags            |

Checks: `npm test`, `npx tsc --noEmit`, `npm run build`.

Stack: Next.js 16, TypeScript, Tailwind CSS v4, zod and Vitest. Resend and Jev are called with plain `fetch`, no SDKs.

## Known limitations

- **The planning link is the access control.** Anyone with `/plan/<proposal-uuid>` can edit the plan. Real use needs a signed token.
- **The hotel sends the link itself.** The Proposales API cannot put a link on the client's proposal page.
- **The hotel cannot edit the plan in Proposales.** The Data panel is read-only on accepted proposals; changes come from the client's page only.
- **A save is two API writes.** The API merges arrays by index, so a shorter list would keep old entries. Each save first clears the plan, then writes it. If the second write fails, the stored plan stays empty until the client saves again.
- **A narrow overwrite window.** The API has no conditional write, so a save landing between the server's read and write (milliseconds) can still be overwritten.

## Where things are

| Path              | What it is                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `app/`            | Routes: landing page, `/demo`, `/plan/[uuid]`, `POST /api/plan`, `POST /api/demo/reset`     |
| `components/`     | UI: landing sections and the planning form, one component per plan section                  |
| `lib/planning/`   | Plan logic without I/O: schema, normalization, per-section changes and summary, notify rule |
| `lib/email/`      | Building, rendering and sending the hotel email, and the attendees CSV                      |
| `lib/proposales/` | The Proposales API client                                                                   |
| `lib/jev/`        | The urgency flag                                                                            |
