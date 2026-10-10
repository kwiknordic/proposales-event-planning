# Product

## The problem

A hotel sends a client a proposal through Proposales. The client accepts it. Then the hotel still needs the agenda, times, seating, extras and the list of attendees with dietary needs, and has to chase the client for them over many emails. A convention sales manager asked for exactly this in a review (`public/review.png`):

> "What I would like Proposales to offer is a standalone tool for the client. An interface where they can enter the agenda, times, seating arrangement, and extras, along with a complete list of names and everything else needed for clear, seamless planning. Without us having to remind them or follow up on every step."

## What we build

A web app with three parts:

1. **Landing page (`/`)**: why we built this, what it does, what we would add with more API access, and a call to action to the demo. Content in `docs/LANDING.md`.
2. **Demo page (`/demo`)**: two buttons that open real demo proposals, one accepted and one not yet accepted.
3. **Planning page (`/plan/[uuid]`)**: where the client enters and updates the plan. The hotel gets an email when the client submits, and again on every real change after that.

Phase covered: **after the proposal is accepted, before the event.** Not a hotel search, not an on-site tool.

## Users

- **Client** (event organizer): fills in the planning page. Reaches it through a link the hotel sends after acceptance (`https://<app>/plan/<proposal-uuid>`).
- **Hotel** (sales or events staff): receives emails, and can read the stored plan in the Proposales editor's **Data** panel. The panel is **read-only** on accepted proposals (verified 2026-10-10), so the hotel never edits the plan or its status.

## Planning page

### Access (the gate)

The page loads the proposal from the Proposales API by UUID.

| Proposal | Page shows |
|---|---|
| status `accepted` | The planning form |
| any other status (draft, sent/`active`, rejected, ...) | "Event planning opens after you accept the proposal" with the proposal title. No form, no plan data |
| not found / API error | A friendly "We could not find this proposal" message |

The API route enforces the same rule (403 for non-accepted), so hiding the form is not the only protection.

The UUID in the URL is the only access control (a capability link). Acceptable for this prototype; note it as a known limitation.

### Sections of the plan

| Section | Fields | Identity (how an entry is recognized across edits) |
|---|---|---|
| Agenda | list of `{ time, title }` | title |
| Seating | `{ layout, notes }`, layout one of: theatre, classroom, banquet, u-shape, boardroom, cabaret | (single object) |
| Extras | list of text (e.g. "Projector and screen") | the text |
| Other requests | list of `{ label, details }` (e.g. AV: two wireless mics) | label |
| Attendees | list of `{ name, diet }` | name |

- Rows can be added and removed. Empty rows are ignored when saving.
- **Paste import for attendees:** a text box where the client pastes a list, one person per line, as `Name`, `Name, diet`, `Name - diet` or `Name<TAB>diet` (pasting from a spreadsheet gives tabs). Parsed lines are appended to the attendee list; the client reviews them before saving. Blank lines are skipped.
- Limits (server-validated): at most 1000 attendees, 100 rows in other lists, 500 characters per text field.

### Save and Submit

- **Before the first submit:** two buttons, **Save** (stores the plan, emails nobody) and **Submit to hotel** (stores the plan and emails the hotel).
- **After the first submit:** one button, **Save and update hotel**, with the hint "The hotel is notified only when something actually changes." There is no "submit again".
- A status badge near the top: "Not sent to hotel yet" / "Sent to hotel" / "Hotel notified of changes" with the date and time of the last update email (`planning_notified_at`).

### Notify rule (deterministic, no AI involved)

| Situation | Email? | `planning_status` afterwards |
|---|---|---|
| Save before the first submit | No | unchanged (absent) |
| First submit | Yes, always ("New plan submitted"), even if nothing changed since the last save | `submitted` |
| Save after submit, with at least one **real change** | Yes ("Plan updated", lists the changes) | unchanged (`submitted`); `planning_notified_at` set to now |
| Save after submit, no real change | No | unchanged |

A **real change** is a difference after normalization (below). Retyping the same text, changing only case or whitespace, or reordering entries is **not** a change.

The status never depends on the hotel: it cannot edit custom data on an accepted proposal. The update emails are how the hotel learns what changed.

### Normalization and change detection

- Compare values after: trim, collapse inner whitespace, lowercase. `null`, `undefined` and `""` are the same (empty).
- Display always uses the client's original text.
- Entries are matched by **identity** (table above), never by position, so reordering is not a change. Duplicate identities are paired in order.
- Change kinds: **added**, **removed**, **changed** (same identity, other field differs, e.g. an attendee's diet). Renaming an identity (e.g. an attendee's name) shows as removed + added.
- When the number of attendees changes, the attendee diff also adds one line `Attendees: 25 -> 40` (so a headcount jump is visible at a glance, and can be flagged urgent).
- Readable change lines, e.g. `Attendee added: Hugo Berg (vegan)`, `Hugo Berg: diet (empty) -> vegan`, `Agenda: Lunch 12:00 -> 12:30`, `Seating layout: theatre -> classroom`.

### Staleness check (no lost edits)

The stored plan can change while the page is open: the client in another tab, or a colleague with the same link. To never overwrite such a save silently:

1. The form remembers the plan it started from (the **baseline**).
2. On save, the server reads the stored plan and compares it with the baseline (normalized).
3. Equal: save. Different: respond **409**; the form shows "Your plan was changed somewhere else (another tab or a colleague). We reloaded it; please re-apply your change." and reloads the fresh plan.
4. After every successful save, the form's baseline becomes the plan that was just saved. (Otherwise the client's own previous save would look like someone else's edit.)

Trade-off, accepted on purpose: a save is refused even if it touched a different field than the other save. Concurrent edits are rare, and the rule is simple and safe.

## Stored data (on the proposal's `data` field)

| Key | Written by | Content |
|---|---|---|
| `planning` | app | `{ agenda, seating, extras, requests, attendees }` as above |
| `planning_summary` | app | Plain-text rendering of the whole plan, so hotel staff can read it in the Data panel without expanding nested nodes |
| `planning_status` | app | absent, `submitted` |
| `planning_submitted_at` | app | ISO timestamp of the first submit |
| `planning_notified_at` | app | ISO timestamp of the last "Plan updated" email (absent until the first one) |

The app never writes other keys. Proposales adds its own keys starting with `_`; ignore them.

## The hotel email

Sent with Resend. Without email configuration, the same content is printed to the server log.

- **Subject:** `New event plan: <proposal title>` (first submit) or `Event plan updated: <proposal title>`. Prefixed with `[Action needed] ` when at least one change is flagged urgent (see `docs/JEV.md`).
- **Body (HTML, with a plain-text version from the same content):**
  1. Proposal title, status, link "Open in Proposales" -> `https://secure.proposales.com/proposals/<uuid>/edit`.
  2. **Needs attention** box: urgent changes (only if any).
  3. **Changes** list (only for updates).
  4. The full plan: agenda table, seating, extras, other requests.
  5. **Dietary summary**: count of attendees per diet, normalized; empty or "none" counts as "no restriction", listed last. E.g. `vegetarian: 2, vegan: 1, nut allergy: 1, no restriction: 4`.
  6. Attendee table (name, diet).
- **Attachment:** `attendees.csv` (columns `name,diet`), only when there are attendees.
- Every client-provided value is HTML-escaped. CSV values are quoted when needed, and values starting with `=`, `+`, `-` or `@` get a leading `'` (prevents formula injection in Excel). CSV uses CRLF line endings and starts with a UTF-8 BOM so Excel shows accented names correctly.
- Email HTML uses inline styles (email clients ignore stylesheets), with the colors from `DESIGN.md`.

Resend without a verified domain sends from `onboarding@resend.dev` and delivers **only to the Resend account owner's address**. That is fine for the demo: the "hotel inbox" is the owner's inbox.

## Demo mode

For reviewers, two real proposals exist on the demo account (IDs in `.env.example`):

- **Accepted:** "Acme Sales Kickoff - 2 days, 40 people". Opens the form.
- **Pending:** "Nordic Tech Summit - 1 day, 120 people". Shows the locked page.

When `NEXT_PUBLIC_DEMO_ACCEPTED_UUID` / `NEXT_PUBLIC_DEMO_PENDING_UUID` are set:

- `/demo` shows a button for each.
- The planning page for a demo proposal shows a banner: "Demo proposal. Fill the form with a sample plan, then save or submit. Others may use this demo too." with a **Fill with sample plan** button. It fills the form from `fixtures/sample-plan.json` without saving.
- The same banner has a **Reset demo** button (no confirmation step): it stores an empty plan and sets `planning_summary` to `""` and `planning_status`, `planning_submitted_at`, `planning_notified_at` to `null` (the API cannot delete keys; `null` reads as absent). The page then shows an empty form and "Not sent to hotel yet", so the first submit email can be tried again. No email is sent. `POST /api/demo/reset` refuses (403) any proposal that is not a demo proposal.

When unset, `/demo` explains that no demo is configured, and no banner appears.

## Out of scope

Hotel-side app or dashboard, login, sending or accepting proposals (the API cannot), payments, multi-language, AI text generation, a database.

## Known limitations (state them honestly in the README)

- The planning link is a capability URL (the proposal UUID). A signed token would be needed for real use.
- The hotel has to send the planning link to the client itself; Proposales cannot show it on the client's proposal page (see `docs/PROPOSALES_API.md`).
- A second save landing between the server's read and write can still be overwritten (the API has no conditional write). The window is milliseconds.
- One email per real change after submit; no batching.
- A save is two API writes (clear `planning`, then write it), because the API merges arrays by index. If the second write fails, the stored plan stays empty until the client saves again.
