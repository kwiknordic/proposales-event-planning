# Build plan: vertical slices

Each slice delivers one domain end to end (logic, UI, API, tests) and ends in **one commit** that can be reverted on its own. Follow the workflow in `AGENTS.md`: the lead (Opus) delegates parts to Haiku sub-agents, verifies, then commits.

"Owns" lists the files a sub-agent may create or edit. Parallel parts never share files. Files marked **lead** are written by the lead before or after the parallel work.

Order: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 8. Slices 6 and 7 are independent and can run in the background alongside 2-5, as long as they keep to their own files. Commit each slice separately.

---

## Slice 0: Foundation

**Goal:** an empty, styled app that builds, with the test runner working.

**Lead does this alone** (setup decisions affect everything):

- Scaffold Next.js 16 (TypeScript, App Router, ESLint, Tailwind, npm, no `src/` dir) into a temporary folder and move it into the repo root **without overwriting** `AGENTS.md`, `CLAUDE.md`, `README.md`, `DESIGN.md`, `docs/`, `public/review.png`, `fixtures/`. Then `git init`.
- `.gitignore`: `.env*` except `.env.example`, `node_modules`, `.next`, `*.tsbuildinfo`, `.vercel`.
- Tailwind v4 + `app/globals.css` with all tokens and component classes from `DESIGN.md`.
- Switzer font per `DESIGN.md`.
- Vitest (`npm test`) with one trivial passing test; `zod` installed.
- `app/layout.tsx`, placeholder `app/page.tsx` showing a `.container` with a heading, a `.btn` and a `.card` (visual check of the design system).

**Accept:** `npm test`, `npx tsc --noEmit`, `npm run build` pass; the placeholder page looks like `DESIGN.md` (black pill button, Switzer, light gray background).

**Commit:** `slice 0: foundation (Next 16, design system, Vitest)`

---

## Slice 1: Proposal access (domain: proposales + gate + demo entry)

**Goal:** `/plan/[uuid]` loads a real proposal and shows the right state; `/demo` links to the demo proposals.

Parallel parts:

| Part | Owns | Tests first |
|---|---|---|
| A: API client | `lib/proposales/parseProposal.ts`, `lib/proposales/client.ts` (+ tests) | `parseProposal` against `fixtures/proposal-response.json`: reads title, status and the custom data at the nested level; missing `data` gives `{}`. `client.getProposal`: 200, 404 -> `null`, other errors throw (fetch mocked) |
| B: Demo entry | `lib/demo.ts`, `app/demo/page.tsx` (+ tests for `isDemoProposal`) | `isDemoProposal` true for both ids, false for others and when env is unset |

**Lead:** `app/plan/[uuid]/page.tsx` with the three states from `docs/PRODUCT.md` (accepted -> placeholder "form comes in slice 2" card; not accepted -> locked message; not found -> friendly error). No caching.

**Accept:** the accepted demo id shows the placeholder; the pending demo id shows the locked page; a random UUID shows "not found"; `/demo` shows two buttons (or the "no demo configured" note without env). Verified against the real API.

**Commit:** `slice 1: proposal access, gate and demo entry`

---

## Slice 2: Plan core, agenda and seating (domain: planning)

**Goal:** the client can edit the agenda and seating and **save** them to the proposal, with the staleness check. No email yet.

**Lead first** (shared foundations, small):
- `lib/planning/schema.ts`: zod schema for the **whole** plan (all five sections, limits from `docs/PRODUCT.md`), exported types, `emptyPlan`.
- `lib/planning/normalize.ts`, `lib/planning/matchByIdentity.ts`, `lib/planning/changes.ts` (+ tests).

Then parallel:

| Part | Owns | Tests first |
|---|---|---|
| A: Agenda | `lib/planning/sections/agenda.ts`, `components/plan/AgendaSection.tsx` (+ tests) | clean drops empty rows; reorder = no change; retype with case/whitespace = no change; time change for same title = changed; add/remove; summary lines |
| B: Seating | `lib/planning/sections/seating.ts`, `components/plan/SeatingSection.tsx` (+ tests) | layout change; notes change; empty vs missing = no change; summary lines |

**Lead after:**
- `lib/planning/plan.ts` (`cleanPlan`, `diffPlan`, `summarizePlan`, `isStale`) wiring agenda and seating (other sections added in slice 3), with tests.
- `lib/proposales/client.ts`: add `savePlanningData` (+ test).
- `app/api/plan/route.ts` for `action: "save"`: validate, gate, staleness (409), save `planning` + `planning_summary`. Route tests for 400, 403, 404, 409, 200.
- `components/plan/PlanningForm.tsx` with the two sections, **Save**, error and 409 messages, baseline updated after each successful save.

**Accept:**
- Save on the accepted demo proposal persists; a page reload shows the saved plan; the Data panel shows `planning` and a readable `planning_summary`.
- Two saves in a row from the same open page both succeed (baseline is updated).
- A save with an outdated baseline (another tab saved in between) gives the 409 message and reloads the stored version. (The Data panel is read-only on accepted proposals, so this is tested through the API.)

**Commit:** `slice 2: plan core with agenda, seating and staleness check`

**Checkpoint:** stop and show the human the save loop working against the real API.

---

## Slice 3: Extras, requests and attendees (domain: planning)

**Goal:** all five sections editable and saved.

Parallel (three sub-agents):

| Part | Owns | Tests first |
|---|---|---|
| A: Extras | `sections/extras.ts`, `ExtrasSection.tsx` (+ tests) | set semantics: reorder/case = no change; add/remove |
| B: Requests | `sections/requests.ts`, `RequestsSection.tsx` (+ tests) | match by label; details change = changed; label rename = removed + added |
| C: Attendees | `sections/attendees.ts` (incl. `parsePastedAttendees`), `AttendeesSection.tsx` (+ tests) | match by name; diet change = changed; duplicate names paired in order; a count line `Attendees: a -> b` when the number changes (none when only diets change); paste formats `Name`, `Name, diet`, `Name - diet`, `Name<TAB>diet`, blank lines skipped, extra spaces trimmed |

**Lead after:** add the three sections to `plan.ts` and `PlanningForm.tsx`; extend plan tests (full-plan diff, summary order: agenda, seating, extras, requests, attendees).

**Accept:** all sections save and reload; pasting 5 lines from a spreadsheet adds 5 attendees; reordering attendees and saving shows no change in the server diff.

**Commit:** `slice 3: extras, requests and attendees with paste import`

---

## Slice 4: Submit and hotel email (domain: notification)

**Goal:** Submit, status, notify rule and the hotel email with CSV.

**Lead first:** the email model type in `lib/email/buildEmail.ts` (type only): `{ subject, kind: "submitted" | "updated", proposal: { title, status, editorUrl }, urgentChanges: string[], changes: string[], plan, dietSummary, hasAttendees }`.

Parallel:

| Part | Owns | Tests first |
|---|---|---|
| A: Notify rule + diet summary | `lib/planning/notifyRule.ts`, `lib/planning/dietSummary.ts` (+ tests) | every row of the notify rule table in `docs/PRODUCT.md`; diet summary normalization, "none"/empty -> "no restriction" listed last, nameless rows ignored |
| B: CSV | `lib/email/attendeesCsv.ts` (+ tests) | header; quoting of commas, quotes, newlines; formula guard for `= + - @`; CRLF; the BOM is added by the sender, not here |
| C: Rendering | `lib/email/buildEmail.ts` (function), `renderHtml.ts`, `renderText.ts` (+ tests) | sections in the order from `docs/PRODUCT.md`; empty sections omitted; `<script>` in a name is escaped; the subject for submitted vs updated |
| D: Sending | `lib/email/sendEmail.ts` (+ tests) | Resend request shape (html, text, base64 CSV attachment with BOM); no config -> console output; HTTP error -> logged, does not throw |

**Lead after:** route handles `submit` and the notify rule, writes `planning_status`, `planning_submitted_at` and `planning_notified_at`, sends the email (a failure never fails the save); `components/plan/StatusBadge.tsx`; Submit button and "Save and update hotel" in the form. Route tests for: first submit, update with change, update without change, save before submit.

**Accept (real run, Resend configured):** first submit -> one email with the full plan, diet summary and `attendees.csv`; change one diet and save -> a second email listing that change; save without change -> no email; status badge correct in each state.

**Commit:** `slice 4: submit, notify rule and hotel email`

**Checkpoint:** the human checks the emails in their inbox.

---

## Slice 5: Urgency flag with Jev (domain: jev)

**Goal:** urgent changes are highlighted in the email. See `docs/JEV.md`.

**One sub-agent** owns `lib/jev/urgency.ts`, `lib/jev/flagUrgent.ts` (+ tests): request building (one noul per change, batched), reading answers, threshold, timeout, no key -> no flags, HTTP error -> no flags.

**Lead after:** pass flags into `buildEmail` (Needs attention box, `[Action needed]` subject); tune the threshold with the real examples in `docs/JEV.md` (a small script run with `node --env-file=.env`, printing only probabilities) and record the chosen value and the observed probabilities in a comment.

**Accept:** a new nut allergy produces `[Action needed]` and the box; a reworded extra does not; without `JEV_API_KEY` emails still go out unchanged.

**Commit:** `slice 5: urgency flag with Jev`

---

## Slice 6: Demo banner and sample plan (domain: demo) - can run alongside 2-5

**One sub-agent** owns `components/plan/DemoBanner.tsx` and `lib/demo.ts` additions (loading `fixtures/sample-plan.json`). **Lead** adds the banner to `PlanningForm.tsx` once slice 3 is in (the fill needs all sections), and adds the demo reset: `resetPlanningData` in `lib/proposales/client.ts` and `app/api/demo/reset/route.ts` (+ tests: 403 for non-demo, 404, 200 writes the reset keys).

**Accept:** the banner appears only on demo proposals; "Fill with sample plan" fills every section without saving; "Reset demo" empties the stored plan and status on the real demo proposal (no email, no confirmation), and the next submit sends the "New event plan" email again.

**Commit:** `slice 6: demo banner with sample plan and reset`

---

## Slice 7: Landing page (domain: landing) - can run alongside 1-5

**Goal:** `/` per `docs/LANDING.md`, styled per `DESIGN.md`, responsive.

Parallel: one sub-agent per section component in `components/landing/` (Hero, Problem, WhatWeBuilt, Wishlist, Lessons, CallToAction). **Lead** composes `app/page.tsx` and checks the whole page on a narrow and a wide screen.

**Accept:** all sections present with the copy from `docs/LANDING.md`; the review image shows; the CTA goes to `/demo`; no inline styles.

**Commit:** `slice 7: landing page`

---

## Slice 8: README and code walkthrough (lead)

- `README.md` for reviewers: what it is, the live link placeholder, how to try the demo, how to run locally, known limitations from `docs/PRODUCT.md`.
- `docs/WALKTHROUGH.md`: a 10-minute code tour for presenting live: the request flow of a save (route -> `isStale` -> `diffPlan` -> `decideNotification` -> email), one section module as the example of the contract, how tests document the rules. Link file paths.
- Final pass: dead code, header comments, names, `npm test`, typecheck, build.

**Commit:** `slice 8: README and code walkthrough`

**Checkpoint:** final summary to the human (what was built, what was verified, remaining limitations, deploy steps: push, import in Vercel, env vars from `.env.example`).
