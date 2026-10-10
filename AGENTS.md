# AGENTS.md

You are building **Event planning for Proposales**: after a client accepts a hotel's proposal, the client enters the event plan (agenda, seating, extras, requests, attendees) on one page. The plan is stored on the proposal itself, and the hotel gets a clear email. The hotel no longer has to chase the client for these details.

Read in this order before writing code: `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/SLICES.md`, `DESIGN.md`. Use `docs/PROPOSALES_API.md`, `docs/JEV.md` and `docs/LANDING.md` when a slice needs them.

## Tech mission (this decides every trade-off)

- Write scalable, maintainable, and testable code with a quality first mindset.
- Continuously iterate and optimize for performance and user experience.
- Serverless first, hosted on Vercel, Next.js and TypeScript.
- Long-term maintainability over short-term speed, while keeping things simple and test driven.
- Functional programming over OOP. Minimal abstractions. No ORMs.
- Modular code with shared logic and UI in internal libraries (here: `lib/` and `components/` inside one Next.js app).
- AI only where it clearly helps. Reliability, safe handling of data, and the right balance between automation and human judgment.

## The code will be explained live to other people

Optimize for someone reading along on a shared screen:

- Small files with one job each. A file name says what it does (`diffAttendees.ts`, `renderEmail.ts`).
- Every file starts with a 1-3 line comment: what it is for and where it is used.
- Plain functions and plain data. No classes, no dependency injection containers, no generic helpers "for later", no clever type gymnastics.
- Data flows one way and is easy to trace: page -> API route -> `lib/` functions -> Proposales API / email.
- Pure logic (no I/O) is separate from I/O, so it can be shown and tested on its own.
- Name things after the domain: `plan`, `attendee`, `agendaItem`, `hotel`, `submit`. Avoid vague names (`data`, `item`, `handle`, `util`).
- Comments explain **why**, not what. No commented-out code.

## Hard rules

- **Never read `.env` or `.env.local`.** Variable names are in `.env.example`. The human places the filled `.env`. Scripts may load it with `node --env-file=.env script.mjs`, but must print only non-secret results (statuses, counts, probabilities), never values from it.
- **Secrets stay server-side.** Only `NEXT_PUBLIC_DEMO_*` may reach the browser.
- **Next.js 16 has breaking changes** compared with older versions. Before writing Next-specific code (routing, params, `next/font`, route handlers, config), read the relevant guide in `node_modules/next/dist/docs/`. `next dev` appends its own block to this file; leave it.
- **npm only.** One lockfile (`package-lock.json`).
- **Tests first** for everything in `lib/` (Vitest). A slice is not done until `npm test`, `npx tsc --noEmit` and `npm run build` all pass.
- **Styling per `DESIGN.md`:** classes in `app/globals.css` first, Tailwind only for one-off layout, no inline `style={{}}` (email HTML is the only exception).
- **Commit locally, never push.** One commit per slice (see Workflow).
- Do not add features, dependencies or abstractions that `docs/SLICES.md` does not ask for. If something seems missing, ask the human.

## Workflow: slices, sub-agents, verification, commits

You (Opus) are the **lead**. You plan, delegate, verify and commit. Haiku sub-agents write most of the code.

1. **Per slice**, read its section in `docs/SLICES.md` (goal, files, tests, acceptance criteria, what can run in parallel).
2. **Delegate** each independent part to a sub-agent with the Agent tool, `model: "haiku"` (Haiku 5.5). Give each sub-agent:
   - the slice goal and acceptance criteria, copied from `docs/SLICES.md`;
   - the exact files it **owns** (it may only create or edit those) and the files it may read;
   - the relevant rules from this file (tests first, file header comment, no inline styles, never read `.env`);
   - "Do not commit. Report: files changed, test output, open questions."
   Parallel sub-agents must own **disjoint files**. Shared files (types, wiring, `globals.css`) are edited by you, before or after the parallel work.
3. **Answer questions and steer.** If a sub-agent asks something or goes off track, reply with SendMessage to the same agent instead of starting over.
4. **Verify every report yourself** before accepting it. Never trust a report on its own:
   - read the diff (`git diff`), check it against the acceptance criteria and the rules above;
   - run `npm test`, `npx tsc --noEmit`, `npm run build`;
   - for UI slices, run the app and check the page (or fetch it) in the states listed in the slice;
   - for slices that touch the Proposales API, run one real call against a demo proposal (the API shape has surprised us before; see `docs/PROPOSALES_API.md`).
   If something is wrong, send it back to the sub-agent with the concrete problem. Fix small things yourself.
5. **Commit the slice** once it is verified: stage only that slice's files, message `slice N: <short summary>` plus a 2-4 line body (what and why). One commit per slice, so each slice can be reverted on its own. Do not mix slices in a commit.
6. **Stop for the human** where `docs/SLICES.md` says "Checkpoint". Summarize what was built, what was verified, and anything uncertain.

## Definition of done (every slice)

- Acceptance criteria in `docs/SLICES.md` met and checked by you.
- Tests written first for new `lib/` logic, all green. Typecheck and build green.
- File header comments present; names are domain names; no dead code.
- One commit for the slice.
