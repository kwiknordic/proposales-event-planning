// The event plan: zod schema (all five sections, limits from docs/PRODUCT.md) and the types
// derived from it. Used to validate API requests and to read the plan stored on a proposal.
import { z } from "zod";

export const SEATING_LAYOUTS = ["theatre", "classroom", "banquet", "u-shape", "boardroom", "cabaret"] as const;

const MAX_TEXT = 500;
const MAX_ROWS = 100;
const MAX_ATTENDEES = 1000;

// The hotel can edit the stored plan in the Data panel, where null is a common value; read it as "".
const text = z.string().max(MAX_TEXT).nullish().transform((value) => value ?? "");

const agendaItem = z.object({ time: text, title: text });
// Layout stays a free string (not an enum) so a hotel edit in the Data panel never makes
// the stored plan unreadable; the form only offers SEATING_LAYOUTS.
const seating = z.object({ layout: text, notes: text });
const request = z.object({ label: text, details: text });
const attendee = z.object({ name: text, diet: text });

export const planSchema = z.object({
  agenda: z.array(agendaItem).max(MAX_ROWS).default([]),
  seating: seating.default({ layout: "", notes: "" }),
  extras: z.array(text).max(MAX_ROWS).default([]),
  requests: z.array(request).max(MAX_ROWS).default([]),
  attendees: z.array(attendee).max(MAX_ATTENDEES).default([]),
});

export type Plan = z.output<typeof planSchema>;
export type AgendaItem = Plan["agenda"][number];
export type Seating = Plan["seating"];
export type OtherRequest = Plan["requests"][number];
export type Attendee = Plan["attendees"][number];

export const emptyPlan: Plan = {
  agenda: [],
  seating: { layout: "", notes: "" },
  extras: [],
  requests: [],
  attendees: [],
};
