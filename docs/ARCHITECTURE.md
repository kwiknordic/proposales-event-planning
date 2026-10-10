# Architecture

One Next.js 16 app (App Router, TypeScript strict) at the repo root, deployed on Vercel. No database: the plan lives on the proposal in Proposales. No monorepo: `lib/` and `components/` are the internal libraries, organized so a folder could later become a package.

## Folder structure

```
app/                         routes only, thin
  layout.tsx                 font, globals.css
  globals.css                design tokens + component classes (DESIGN.md)
  page.tsx                   landing page
  demo/page.tsx              demo buttons
  plan/[uuid]/page.tsx       loads proposal, applies the gate, renders the form
  api/plan/route.ts          POST: validate, staleness check, save, notify

components/
  landing/                   landing page sections
  plan/
    PlanningForm.tsx         composes the sections, Save/Submit, status, errors
    AgendaSection.tsx        one component per plan section
    SeatingSection.tsx
    ExtrasSection.tsx
    RequestsSection.tsx
    AttendeesSection.tsx     includes the paste import
    DemoBanner.tsx
    StatusBadge.tsx

lib/
  planning/                  pure, no I/O
    schema.ts                zod schema for the plan; types are derived from it
    normalize.ts             text normalization (trim, collapse spaces, lowercase, empty)
    matchByIdentity.ts       pairs entries of two lists by an identity key
    sections/
      agenda.ts              per section: clean, diff, summarize
      seating.ts
      extras.ts
      requests.ts
      attendees.ts           also: parsePastedAttendees
    plan.ts                  composes the sections: cleanPlan, diffPlan, summarizePlan, isStale
    changes.ts               Change type and formatChange (readable line)
    notifyRule.ts            decideNotification (the notify rule table)
    dietSummary.ts           counts attendees per normalized diet
  email/                     pure, except sendEmail.ts
    buildEmail.ts            plan + changes + urgency -> one email model
    renderHtml.ts            email model -> HTML (escaped, inline styles)
    renderText.ts            email model -> plain text
    attendeesCsv.ts          attendees -> CSV string (escaping, formula guard)
    sendEmail.ts             I/O: Resend, or console when not configured
  proposales/
    parseProposal.ts         pure: raw API JSON -> { uuid, title, status, data }
    client.ts                I/O: getProposal, savePlanningData
  jev/
    urgency.ts               pure: build the request, read the answers
    flagUrgent.ts            I/O: calls Jev with timeout, never throws
  demo.ts                    demo ids from env, isDemoProposal

fixtures/                    sample-plan.json, proposal-response.json (test data)
public/                      review.png
```

Rules: `lib/` never imports from `app/` or `components/`. Pure modules never import I/O modules. Each file has one job and a header comment.

## The section contract

Every plan section in `lib/planning/sections/` exports the same three plain functions, so sections can be built in parallel and composed explicitly (no registry, no classes):

```ts
// agenda.ts
export function cleanAgenda(items: AgendaItem[]): AgendaItem[]          // drop empty rows, trim
export function diffAgenda(before: AgendaItem[], after: AgendaItem[]): Change[]
export function summarizeAgenda(items: AgendaItem[]): string[]           // lines for planning_summary
```

`plan.ts` calls them one by one:

```ts
export function diffPlan(before: Plan, after: Plan): Change[] {
  return [
    ...diffAgenda(before.agenda, after.agenda),
    ...diffSeating(before.seating, after.seating),
    ...diffExtras(before.extras, after.extras),
    ...diffRequests(before.requests, after.requests),
    ...diffAttendees(before.attendees, after.attendees),
  ];
}

export function isStale(baseline: Plan, stored: Plan): boolean {
  return diffPlan(baseline, stored).length > 0;
}
```

The staleness check reuses the diff, so "changed" means the same thing everywhere.

## Data flow: saving the plan

`POST /api/plan` with `{ uuid, baseline, plan, action: "save" | "submit" }`. The route is a short, readable sequence; each step is a `lib/` function:

1. Validate the body with the zod schema (400 on failure).
2. `getProposal(uuid)` (404 if missing). Gate: status must be `accepted` (403).
3. `stored = cleanPlan(proposal.data.planning ?? emptyPlan)`.
4. `isStale(cleanPlan(baseline), stored)` -> 409 with the stored plan.
5. `next = cleanPlan(plan)`; `changes = diffPlan(stored, next)`.
6. `decision = decideNotification({ status: proposal.data.planning_status, action, changes })`.
7. `savePlanningData(uuid, { planning: next, planning_summary: summarizePlan(next), planning_status, planning_submitted_at?, planning_notified_at? })`.
8. If `decision.sendEmail`: `urgent = await flagUrgent(changes)` (empty on any failure), then `sendEmail(buildEmail(...))`. An email failure is logged and does not fail the save.
9. Respond `{ plan: next, status }`. The form sets its baseline to `plan`.

## Data flow: loading the page

`app/plan/[uuid]/page.tsx` is a server component, rendered fresh on every request (no caching: the hotel may have edited the plan). It calls `getProposal`, applies the gate, and passes `{ uuid, title, plan, status, isDemo }` to `PlanningForm` (client component). The API key never reaches the browser.

## Form state

`PlanningForm` keeps one `plan` state object and one `baseline` (a ref). Each section component receives its slice of the plan and an `onChange`. No form library. Empty rows are allowed while editing and dropped by `cleanPlan` on save.

## Tests (Vitest)

- Unit tests next to the code: `lib/**/x.test.ts`.
- Test-first for every `lib/planning`, `lib/email`, `lib/jev/urgency.ts` and `lib/proposales/parseProposal.ts` function.
- `parseProposal` is tested against `fixtures/proposal-response.json` (the real response shape).
- I/O modules (`client.ts`, `sendEmail.ts`, `flagUrgent.ts`) get small tests with `fetch` mocked: success, HTTP error, timeout.
- The API route is tested by calling its handler with mocked `lib/proposales/client` and `lib/email/sendEmail`, covering: 400, 403, 404, 409, save without email, first submit, update with change, update without change.
- Scripts: `npm test` (vitest run), `npm run test:watch`.

## Dependencies

Next.js 16, React, TypeScript, Tailwind CSS v4, zod, Vitest. Nothing else without asking. Call Resend and Jev with `fetch` (no SDKs): fewer dependencies, and the request is visible in the code.
