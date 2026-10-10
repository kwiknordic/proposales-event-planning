# Proposales API: what we rely on

All points below were verified against the real API. Where the official docs (https://docs.proposales.com, machine-readable index at `/llms.txt`, spec at `/openapi.json`) say something different, **this file wins**.

Base URL `https://api.proposales.com`, header `Authorization: Bearer <PROPOSALES_API_KEY>`. Server-side only.

## Read a proposal

`GET /v3/proposals/{uuid}`

- Response: `{ "data": { ...proposal fields, "data": { ...custom data } } }`. The proposal is under `data`, and **its custom data is one level deeper, at `data.data`**. See `fixtures/proposal-response.json` (real shape, trimmed, personal data replaced).
- Fields we use: `uuid`, `title`, `status`, `data`.
- `status` values: `draft`, `active` (sent, waiting for the client), `accepted`, `rejected`, `withdrawn`, `expired`. Only `accepted` opens planning. Do not rely on `accepted_at` (it can be empty); use `status`.
- An unknown or malformed id can return 404 **or** 500. Validate the UUID format before calling, and treat any non-200 as "not found" (log the status).
- `parseProposal` turns the raw JSON into `{ uuid, title, status, data }` so the rest of the code never deals with the nesting. Test it against the fixture.

## Write custom data

`PATCH /v3/proposals/{uuid}/data` with body `{ "data": { key: value, ... } }`. Response: `{ "data": { ...all custom data } }`.

- Works on `draft`, `active` and `accepted` proposals.
- Only the keys you send are touched; other keys stay.
- Nested **objects are deep-merged**, and **arrays are merged by index**: a shorter array overwrites the first elements and the old tail stays (verified 2026-10-10: sending `extras: []` over 3 extras keeps all 3). So `savePlanningData` first writes `planning: null`, then the full plan; that stores the plan exactly as sent. If the second write fails, `planning` stays `null` until the next save.
- Sending `null` stores a literal `null`; it does **not** delete the key. There is no way to delete a key through the API. Treat `null` as empty when reading.
- No size problem observed with 1000 attendees.
- Proposales adds its own keys starting with `_` (e.g. `_is_agreement`). Ignore them; never write keys starting with `_`.
- There is no conditional write (no version check). Read-then-write has a small race window; accepted as a known limitation.

## The hotel's view

In the Proposales editor (`https://secure.proposales.com/proposals/{uuid}/edit`) the hotel has a **Data** panel showing all custom data as an editable tree. Nested lists show as collapsed nodes, which is why we also store `planning_summary` as plain text.

## What the API cannot do

- **Send, accept, reject or sign** a proposal. These happen in the Proposales app and on the client's e-sign page.
- **Delete** a proposal or a custom data key.
- **Put a clickable link on the client's proposal page.** The client's page (`https://esign.proposales.com/v/<view-id>`) uses a separate view id that the API does not expose and that cannot be mapped to the proposal UUID. Template variables and markdown links are not clickable on that page, and a proposal's text can only be edited while it is a draft. So the hotel must send the planning link to the client itself (e.g. in its confirmation email).

## Creating test proposals (only if needed)

`POST /v3/proposals` with `{ company_id, language: "en", title_md, description_md }` creates a **draft** and returns `{ proposal: { uuid, url } }`, where `url` is the hotel's editor URL. To get an accepted proposal, a human must send it in the Proposales app and accept it from the client email. The demo proposals already exist (see `.env.example`); do not create more without asking.
