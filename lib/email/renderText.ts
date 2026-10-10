// Renders the hotel email as plain text: the same content and section order as renderHtml, for the
// text part of the email and for the server log when no email is configured. Used by the email sender.
import type { AgendaItem, Attendee, OtherRequest, Plan } from "@/lib/planning/schema";
import type { DietCount } from "@/lib/planning/dietSummary";
import type { HotelEmail } from "./buildEmail";

// Sections are separated by a blank line; each section is a list of lines, and empty ones are dropped.
export function renderText(email: HotelEmail): string {
  const sections = [
    [email.proposal.title, `Status: ${email.proposal.status}`, `Open in Proposales: ${email.proposal.editorUrl}`],
    withHeading("Needs attention", bulletList(email.urgentChanges)),
    withHeading("Changes", bulletList(email.changes)),
    ...planSections(email.plan),
    withHeading("Dietary summary", email.dietSummary.length > 0 ? [dietLine(email.dietSummary)] : []),
    withHeading("Attendees", attendeeLines(email.plan.attendees, email.hasAttendees)),
  ];
  return sections
    .filter((lines) => lines.length > 0)
    .map((lines) => lines.join("\n"))
    .join("\n\n");
}

function planSections(plan: Plan): string[][] {
  return [
    withHeading("Agenda", plan.agenda.map(agendaLine)),
    withHeading("Seating", seatingLines(plan.seating)),
    withHeading("Extras", bulletList(plan.extras)),
    withHeading("Other requests", bulletList(plan.requests.map(requestLine))),
  ];
}

// A heading with no body is left out, so an empty section never shows up as a bare title.
function withHeading(heading: string, body: string[]): string[] {
  return body.length === 0 ? [] : [heading, ...body];
}

function bulletList(items: string[]): string[] {
  return items.map((item) => `- ${item}`);
}

// "09:00 Welcome", or just "Welcome" when no time was given.
function agendaLine(item: AgendaItem): string {
  return [item.time, item.title].filter((part) => part !== "").join(" ");
}

function requestLine(request: OtherRequest): string {
  return request.label === "" ? request.details : `${request.label}: ${request.details}`;
}

function seatingLines(seating: Plan["seating"]): string[] {
  const lines = [];
  if (seating.layout !== "") lines.push(`Layout: ${seating.layout}`);
  if (seating.notes !== "") lines.push(seating.notes);
  return lines;
}

function dietLine(dietSummary: DietCount[]): string {
  return dietSummary.map((entry) => `${entry.diet}: ${entry.count}`).join(", ");
}

// "Anna Lindqvist: Vegetarian"; an empty diet is shown as the name alone.
function attendeeLines(attendees: Attendee[], hasAttendees: boolean): string[] {
  if (!hasAttendees) return [];
  return attendees.map((attendee) =>
    attendee.diet === "" ? attendee.name : `${attendee.name}: ${attendee.diet}`,
  );
}
