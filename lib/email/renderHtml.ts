// Renders the hotel email as one HTML document (sent via Resend), and its content alone for the landing page.
// Email clients ignore stylesheets, so every style is inline, with the hex colors from DESIGN.md.
import type { AgendaItem, Attendee, OtherRequest, Plan } from "@/lib/planning/schema";
import type { DietCount } from "@/lib/planning/dietSummary";
import type { HotelEmail } from "./buildEmail";

const style = {
  page: "margin:0;padding:24px;background:#f9f9f9;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#353535;",
  card: "max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;",
  title: "margin:0 0 8px;font-size:32px;font-weight:400;line-height:1.2;color:#292929;",
  status: "margin:0 0 16px;font-size:14px;color:#474747;",
  link: "color:#000000;text-decoration:underline;",
  heading: "margin:32px 0 12px;font-size:19px;font-weight:400;color:#292929;",
  highlight: "margin:24px 0;padding:16px 20px;background:#fff6d6;border:1px solid #e0e0e0;border-radius:6px;",
  highlightHeading: "margin:0 0 8px;font-size:19px;font-weight:400;color:#292929;",
  // Bullets set inline: some email clients and page CSS resets remove them otherwise
  list: "margin:0;padding-left:20px;list-style:disc;",
  listItem: "margin:0 0 6px;",
  table: "width:100%;border-collapse:collapse;font-size:16px;",
  th: "padding:12px 16px;background:#eeeeee;border-bottom:1px solid #e0e0e0;font-size:14px;font-weight:500;text-align:left;",
  td: "padding:12px 16px;border-bottom:1px solid #e0e0e0;vertical-align:top;",
  muted: "margin:0;color:#474747;",
};

// Client text ends up in element text and attributes, so it must never break out of them.
// Only the characters that can do that are escaped; everything else stays readable.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderHtml(email: HotelEmail): string {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeHtml(email.subject)}</title>`,
    "</head>",
    `<body style="${style.page}">`,
    renderEmailContent(email),
    "</body>",
    "</html>",
  ].join("\n");
}

// The email card on its own, also used by the landing page preview, so the page shows exactly what is sent
export function renderEmailContent(email: HotelEmail): string {
  const sections = [
    renderHeader(email),
    renderUrgent(email.urgentChanges),
    renderChanges(email.changes),
    renderPlan(email.plan),
    renderDietSummary(email.dietSummary),
    renderAttendees(email.plan.attendees, email.hasAttendees),
  ];
  return [`<div style="${style.card}">`, ...sections.filter((section) => section !== ""), "</div>"].join("\n");
}

function renderHeader(email: HotelEmail): string {
  return [
    `<h1 style="${style.title}">${escapeHtml(email.proposal.title)}</h1>`,
    `<p style="${style.status}">Status: ${escapeHtml(email.proposal.status)}</p>`,
    `<p style="margin:0;"><a href="${escapeHtml(email.proposal.editorUrl)}" style="${style.link}">Open in Proposales</a></p>`,
  ].join("\n");
}

// The box is highlighted so the hotel sees urgent changes before anything else.
function renderUrgent(urgentChanges: string[]): string {
  if (urgentChanges.length === 0) return "";
  return [
    `<div style="${style.highlight}">`,
    `<h2 style="${style.highlightHeading}">Needs attention</h2>`,
    renderList(urgentChanges),
    "</div>",
  ].join("\n");
}

function renderChanges(changes: string[]): string {
  if (changes.length === 0) return "";
  return [`<h2 style="${style.heading}">Changes</h2>`, renderList(changes)].join("\n");
}

// Each part of the plan is its own section, so an empty part never leaves a bare heading behind.
function renderPlan(plan: Plan): string {
  return [
    renderAgenda(plan.agenda),
    renderSeating(plan.seating),
    renderExtras(plan.extras),
    renderOtherRequests(plan.requests),
  ].join("\n");
}

function renderAgenda(items: AgendaItem[]): string {
  if (items.length === 0) return "";
  const rows = items.map(
    (item) =>
      `<tr><td style="${style.td}">${escapeHtml(item.time)}</td><td style="${style.td}">${escapeHtml(item.title)}</td></tr>`,
  );
  return [
    `<h2 style="${style.heading}">Agenda</h2>`,
    `<table role="presentation" style="${style.table}">`,
    `<tr><th style="${style.th}">Time</th><th style="${style.th}">Item</th></tr>`,
    ...rows,
    "</table>",
  ].join("\n");
}

function renderSeating(seating: Plan["seating"]): string {
  if (seating.layout === "" && seating.notes === "") return "";
  const lines = [];
  if (seating.layout !== "") lines.push(`<p style="${style.muted}">Layout: ${escapeHtml(seating.layout)}</p>`);
  if (seating.notes !== "") lines.push(`<p style="${style.muted}">${escapeHtml(seating.notes)}</p>`);
  return [`<h2 style="${style.heading}">Seating</h2>`, ...lines].join("\n");
}

function renderExtras(extras: string[]): string {
  if (extras.length === 0) return "";
  return [`<h2 style="${style.heading}">Extras</h2>`, renderList(extras)].join("\n");
}

function renderOtherRequests(requests: OtherRequest[]): string {
  if (requests.length === 0) return "";
  const items = requests.map((request) => labelled(request.label, request.details));
  return [`<h2 style="${style.heading}">Other requests</h2>`, renderList(items)].join("\n");
}

// The counts are the summary the hotel reads first; "no restriction" is already last from summarizeDiets.
function renderDietSummary(dietSummary: DietCount[]): string {
  if (dietSummary.length === 0) return "";
  const line = dietSummary.map((entry) => `${entry.diet}: ${entry.count}`).join(", ");
  return [`<h2 style="${style.heading}">Dietary summary</h2>`, `<p style="${style.muted}">${escapeHtml(line)}</p>`].join("\n");
}

function renderAttendees(attendees: Attendee[], hasAttendees: boolean): string {
  if (!hasAttendees) return "";
  const rows = attendees.map(
    (attendee) =>
      `<tr><td style="${style.td}">${escapeHtml(attendee.name)}</td><td style="${style.td}">${escapeHtml(attendee.diet)}</td></tr>`,
  );
  return [
    `<h2 style="${style.heading}">Attendees</h2>`,
    `<table role="presentation" style="${style.table}">`,
    `<tr><th style="${style.th}">Name</th><th style="${style.th}">Diet</th></tr>`,
    ...rows,
    "</table>",
  ].join("\n");
}

function renderList(items: string[]): string {
  const listItems = items.map((item) => `<li style="${style.listItem}">${escapeHtml(item)}</li>`);
  return [`<ul style="${style.list}">`, ...listItems, "</ul>"].join("\n");
}

// "AV: Two microphones"; without a label the details stand alone.
function labelled(label: string, details: string): string {
  return label === "" ? details : `${label}: ${details}`;
}
