# Code walkthrough (10 minutes)

A tour for presenting the code live. It follows one save from the button to the hotel's inbox, then shows the pattern every plan section follows and how the tests document the rules.

## 1. The shape of the app (1 min)

Data flows one way: **page -> API route -> `lib/` functions -> Proposales API / email**.

- [`app/plan/[uuid]/page.tsx`](../app/plan/[uuid]/page.tsx): loads the proposal fresh on every request and applies the gate (accepted -> form, otherwise locked or not found).
- [`components/plan/PlanningForm.tsx`](../components/plan/PlanningForm.tsx): holds the plan being edited and a **baseline** (the plan as last read or saved).
- [`app/api/plan/route.ts`](../app/api/plan/route.ts): one short function; every step is a `lib/` call.
- `lib/` is split into **pure** modules (no I/O, easy to test and show) and a few **I/O** modules (`client.ts`, `sendEmail.ts`, `flagUrgent.ts`) that never contain business rules.

## 2. One save, step by step (4 min)

Open [`app/api/plan/route.ts`](../app/api/plan/route.ts) and read `POST` top to bottom:

1. **Validate** (line 25): the zod schema in [`lib/planning/schema.ts`](../lib/planning/schema.ts) checks the shape and the limits (1000 attendees, 100 rows, 500 characters). Bad input -> 400.
2. **Load and gate** (lines 31-38): [`getProposal`](../lib/proposales/client.ts) reads the proposal; not found -> 404, not accepted -> 403. Same gate as the page, so hiding the form is not the only protection.
3. **Staleness check** (lines 41-44): [`isStale`](../lib/planning/plan.ts) compares the form's baseline with what is stored now. If someone else saved in between -> 409, and the form reloads the stored plan. `isStale` simply reuses `diffPlan`, so "changed" means the same thing everywhere.
4. **What really changed** (line 47): [`diffPlan`](../lib/planning/plan.ts) returns a list of readable change lines, like `Hugo Berg: diet (empty) -> vegan`.
5. **Should the hotel hear about it?** (line 48): [`decideNotification`](../lib/planning/notifyRule.ts) is the whole notify rule in about ten lines: first submit -> "submitted" email; after that, only when the change list is not empty. No AI here.
6. **Save** (line 58): [`savePlanningData`](../lib/proposales/client.ts) writes the plan and a plain-text summary. Note the comment there: the API merges arrays by index, so it clears `planning` first. I found that by calling the real API, not from the docs.
7. **Email** (line 65, `emailHotel`): only for updates, [`flagUrgent`](../lib/jev/flagUrgent.ts) asks Jev which change lines need prompt attention. Then [`buildEmail`](../lib/email/buildEmail.ts) makes one plain data object, [`renderHtml`](../lib/email/renderHtml.ts) and [`renderText`](../lib/email/renderText.ts) turn it into the two bodies, and [`sendEmail`](../lib/email/sendEmail.ts) posts it to Resend. Any failure here is logged; the save has already succeeded.

## 3. The section contract (2 min)

Every plan section exports the same three plain functions. Open [`lib/planning/sections/attendees.ts`](../lib/planning/sections/attendees.ts) as the example:

- `cleanAttendees` (line 10): trims, drops rows without a name.
- `diffAttendees` (line 18): matches people by name with [`matchByIdentity`](../lib/planning/matchByIdentity.ts), so reordering is not a change. It adds a headcount line (`Attendees: 25 -> 40`) when the number changes, so a jump is visible at a glance and can be flagged as urgent.
- `summarizeAttendees` (line 58): the lines for the plain-text summary.
- Plus `parsePastedAttendees` (line 67): turns a pasted list (`Name`, `Name, diet`, `Name - diet`, or a spreadsheet row with a tab) into rows.

[`lib/planning/plan.ts`](../lib/planning/plan.ts) composes the five sections by calling them one by one. No registry, no classes: adding a section means adding one line to each function.

## 4. Tests document the rules (2 min)

Tests sit next to the code and read like the product spec:

- [`lib/planning/notifyRule.test.ts`](../lib/planning/notifyRule.test.ts): one test per row of the notify rule table.
- [`lib/planning/sections/attendees.test.ts`](../lib/planning/sections/attendees.test.ts): "reorder is no change", "diet change is a change", the paste formats.
- [`app/api/plan/route.test.ts`](../app/api/plan/route.test.ts): the route end to end with the API client, the email sender and Jev mocked: 400, 403, 404, 409, first submit, update with and without a real change, urgent flag.
- [`lib/proposales/parseProposal.test.ts`](../lib/proposales/parseProposal.test.ts): runs against a real (trimmed) API response in `fixtures/`.

Run them with `npm test`.

## 5. Where AI is, and is not (1 min)

[`lib/jev/urgency.ts`](../lib/jev/urgency.ts) builds one batched yes/no question per change line and reads the probabilities. The threshold comment records the probabilities observed against the real API. Jev only decides what goes at the top of an email. It never decides whether an email is sent, what is stored, or the status. With no key, a timeout or an error, the email still goes out, just without flags.
