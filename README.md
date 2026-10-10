# Event planning for Proposales

A prototype by Mervin Bratic. After a client accepts a hotel's proposal in [Proposales](https://proposales.com), they open one page and hand over the whole event plan: agenda, seating, extras, other requests and the attendee list with dietary needs. The plan is stored on the proposal itself, and the hotel gets a clear email. The hotel no longer has to chase the client for these details.

It started with a customer review asking for exactly this (`public/review.png`).

**Live:** `<add the Vercel URL here>`

## Try the demo

1. Open `/demo`.
2. **Plan the event** opens an accepted demo proposal. Click **Fill with sample plan**, then **Submit to hotel**. The hotel gets a "New event plan" email with the full plan, a dietary summary and `attendees.csv`. Click **See the email the hotel got** to open that exact email in a new tab.
3. Change something real, for example give an attendee a nut allergy, and click **Save and update hotel**. The hotel gets an "Event plan updated" email listing the change. Urgent changes like allergies are flagged with `[Action needed]` and a "Needs attention" box.
4. Reorder rows or retype text with different capitals and save again: no email, because nothing really changed.
5. **See the locked page** opens a proposal that is not accepted yet: planning stays closed.
6. **Reset demo** in the banner puts the demo back to "nothing planned, not sent", so you can try the first submit again.

The demo emails go to the "hotel" inbox configured by the owner (`HOTEL_NOTIFY_EMAIL`). Demo data is shared, so you may see other visitors' changes.

## How it works

- **No database.** The plan lives in the proposal's custom data (`planning`, plus a plain-text `planning_summary` the hotel can read in the Proposales Data panel).
- **Real changes only.** Text is compared after trimming, collapsing spaces and lowercasing, and list entries are matched by identity (agenda title, attendee name), never by position.
- **A fixed notify rule** decides whether the hotel is emailed: always on the first submit, afterwards only when something really changed. No AI is involved in that decision.
- **AI for one narrow judgment.** The [Jev](https://docs.typesafe.ai) model only decides which changes go at the top of an update email. Without it, every email still goes out with all changes listed.
- **No lost edits.** If the stored plan changed while the page was open (another tab, a colleague), the save is refused and the form reloads the stored version.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, zod, Vitest. Emails via Resend, Jev via plain `fetch` (no SDKs, API-credits for Jev valid until Oct 19 2026). See [`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md) for a 10-minute code tour.

## Run locally

Requires Node 22 and npm.

```bash
npm install
cp .env.example .env    # then fill in the values (see below)
npm run dev             # http://localhost:3000
```

| Variable | Needed for | Without it |
|---|---|---|
| `PROPOSALES_API_KEY` | Reading and saving proposals | Nothing works |
| `NEXT_PUBLIC_DEMO_ACCEPTED_UUID`, `NEXT_PUBLIC_DEMO_PENDING_UUID` | The `/demo` page and the demo banner | `/demo` says no demo is configured |
| `RESEND_API_KEY`, `HOTEL_NOTIFY_EMAIL` | Sending the hotel email | The email is printed to the server log |
| `JEV_API_KEY` | Flagging urgent changes | Emails go out without flags |

Checks: `npm test` (Vitest), `npx tsc --noEmit`, `npm run build`.

## Deploy

Push to GitHub, import the repo in Vercel (root directory = repo root), and set the variables above in the Vercel project. Never commit `.env`.

## Known limitations

- **The planning link is the access control.** Anyone with `/plan/<proposal-uuid>` can edit the plan. Real use needs a signed token.
- **The hotel sends the link itself.** The Proposales API cannot put a link on the client's proposal page.
- **The hotel cannot edit the plan in Proposales.** The Data panel is read-only on accepted proposals; changes come from the client's page only.
- **A save is two API writes.** The API merges arrays by index, so a shorter list would keep old entries. Each save first clears `planning`, then writes it. If the second write fails, the stored plan stays empty until the client saves again.
- **A narrow overwrite window.** The API has no conditional write, so a save landing between the server's read and write (milliseconds) can still be overwritten.
- **One email per real change** after the first submit; no batching.
- **Demo emails reach one inbox.** Without a verified domain, Resend only sends from `onboarding@resend.dev` to the account owner.

## Repository guide

| Path | What it is |
|---|---|
| `app/` | Routes only: landing page, `/demo`, `/plan/[uuid]`, `POST /api/plan`, `POST /api/demo/reset` |
| `components/` | UI: landing sections and the planning form (one component per plan section) |
| `lib/planning/` | Pure plan logic: schema, normalization, per-section diff and summary, notify rule |
| `lib/email/` | Building, rendering and sending the hotel email, and the attendees CSV |
| `lib/proposales/` | The Proposales API client |
| `lib/jev/` | The urgency flag |
| `docs/` | Product, architecture, build plan, API notes, walkthrough |
