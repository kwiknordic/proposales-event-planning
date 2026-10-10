# Jev: urgency flag

Jev is a model by TypeSafe AI (official docs: https://docs.typesafe.ai, index at `/llms.txt`; ignore unrelated third-party sites with a similar name). It does **not** generate text. It answers typed questions about a given state:

- **Noul**: a yes/no question, answered with the probability of "yes" (0..1).
- **Choice**: pick one option from a set.
- **Score**: rate on ordered levels.

The intended pattern: code stays in control, Jev makes narrow decisions.

## What we use it for

When an email to the hotel is about to be sent with a list of changes, Jev flags which changes need the hotel's prompt attention. Flagged changes go into a **Needs attention** box at the top of the email, and the subject gets the prefix `[Action needed] `.

It affects **presentation only**. It never decides whether an email is sent, what is stored, or the status. Those follow the deterministic notify rule in `docs/PRODUCT.md`.

## The call

`POST https://api.typesafe.ai/v1/systemone`, header `Authorization: Bearer <JEV_API_KEY>`, JSON body:

```json
{
  "model": "jev-latest",
  "state": {
    "event": "Acme Sales Kickoff – 2 days, 40 people",
    "changes": [
      { "id": "c0", "text": "Attendee added: Hugo Berg (severe nut allergy)" },
      { "id": "c1", "text": "Extras: Coffee -> Coffee and tea" }
    ]
  },
  "questions": {
    "c0": { "type": "noul", "instructions": "Consider only the change with id \"c0\". Does it need the hotel's prompt attention, for example a new or changed allergy or dietary need, a large change in the number of attendees, or a change of date or time?" },
    "c1": { "type": "noul", "instructions": "Consider only the change with id \"c1\". Does it ..." }
  }
}
```

Jev judges each change on its own, so it cannot see a trend across many lines. Aggregates are produced by code instead: the attendee diff adds one `Attendees: <before> -> <after>` line whenever the number of attendees changes, and Jev judges that line like any other.

Response: `{ "answers": { "c0": { "type": "noul", "noul": 0.97 }, "c1": { "type": "noul", "noul": 0.04 } } }`.

- **One batched call** for all changes of one email (at most 20; the rest are not flagged).
- On a first submit there is no change list: do not call Jev.
- Changes with `noul >= THRESHOLD` are urgent. Start with `0.7` and tune (below).
- Timeout 4 s (`AbortSignal.timeout`). No key, a timeout, an HTTP error or a malformed answer -> no flags. The email still goes out. Log the failure, never throw.
- Use `fetch` directly (no SDK). Never send attendee lists or anything beyond the change lines and the event title.

## Code split

- `lib/jev/urgency.ts` (pure): `buildUrgencyRequest(title, changes)` and `readUrgentIds(response, threshold)`. Fully unit tested.
- `lib/jev/flagUrgent.ts` (I/O): does the call with timeout and error handling, returns the urgent change lines. Tested with `fetch` mocked: success, no key, HTTP 500, timeout, malformed JSON.

## Tuning the threshold

Run a small script against the real API (with `node --env-file=.env`, printing only the probabilities) on these changes, and pick a threshold that separates them. Record the chosen value and the observed probabilities in a comment next to `THRESHOLD`.

| Change | Expected |
|---|---|
| `Attendee added: Hugo Berg (severe nut allergy)` | urgent |
| `Ben Carter: diet (empty) -> gluten free` | urgent |
| `Agenda: Lunch 12:00 -> 13:30` | urgent |
| `Attendees: 25 -> 40` (the count line from the attendee diff) | urgent |
| `Extras: Coffee -> Coffee and tea` | not urgent |
| `Seating notes: stage left -> stage on the left side` | not urgent |
| `Other requests: Signage - welcome sign -> welcome sign at reception` | not urgent |

If Jev's answers do not separate them well, prefer missing an urgent flag over flagging everything: an unflagged change is still listed in the email.
