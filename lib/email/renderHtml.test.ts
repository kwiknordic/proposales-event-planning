// Tests for renderHtml: section order, omitted empty sections, escaping of client text and the diet line.
import { describe, expect, it } from "vitest";
import type { HotelEmail } from "./buildEmail";
import { renderHtml } from "./renderHtml";

const fullEmail: HotelEmail = {
  subject: "Event plan updated: Acme Sales Kickoff",
  kind: "updated",
  proposal: {
    title: "Acme Sales Kickoff",
    status: "accepted",
    editorUrl: "https://secure.proposales.com/proposals/abc/edit",
  },
  urgentChanges: ["Agenda removed: Lunch 12:00"],
  changes: ["Extras added: Name badges"],
  plan: {
    agenda: [{ time: "09:00", title: "Welcome" }],
    seating: { layout: "classroom", notes: "Stage at the front" },
    extras: ["Projector"],
    requests: [{ label: "AV", details: "Two microphones" }],
    attendees: [
      { name: "Anna", diet: "Vegetarian" },
      { name: "Ben", diet: "" },
    ],
  },
  dietSummary: [
    { diet: "vegetarian", count: 1 },
    { diet: "no restriction", count: 1 },
  ],
  hasAttendees: true,
};

const emptyPlanEmail: HotelEmail = {
  ...fullEmail,
  kind: "submitted",
  urgentChanges: [],
  changes: [],
  plan: { agenda: [], seating: { layout: "", notes: "" }, extras: [], requests: [], attendees: [] },
  dietSummary: [],
  hasAttendees: false,
};

describe("renderHtml sections", () => {
  it("is a complete HTML document", () => {
    const html = renderHtml(fullEmail);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("</html>");
  });

  it("shows the sections in the order of the hotel email", () => {
    const html = renderHtml(fullEmail);
    // Headings are matched with their tags, so list items with the same words do not count.
    const order = [
      ">Acme Sales Kickoff<",
      "Open in Proposales",
      ">Needs attention<",
      ">Changes<",
      ">Agenda<",
      ">Seating<",
      ">Extras<",
      ">Other requests<",
      ">Dietary summary<",
      ">Attendees<",
    ].map((text) => html.indexOf(text));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("links the title block to the editor", () => {
    expect(renderHtml(fullEmail)).toContain('href="https://secure.proposales.com/proposals/abc/edit"');
  });

  it("omits the empty sections", () => {
    const html = renderHtml(emptyPlanEmail);
    expect(html).not.toContain("Needs attention");
    expect(html).not.toContain("Changes");
    expect(html).not.toContain("Agenda");
    expect(html).not.toContain("Attendees");
    expect(html).not.toContain("Dietary summary");
    expect(html).toContain("Open in Proposales");
  });

  it("uses inline styles only, no stylesheet", () => {
    const html = renderHtml(fullEmail);
    expect(html).not.toContain("<link");
    expect(html).not.toMatch(/<style[\s>]/);
    expect(html).toContain('style="');
  });
});

describe("renderHtml dietary summary", () => {
  it("writes the counts as one line", () => {
    expect(renderHtml(fullEmail)).toContain("vegetarian: 1, no restriction: 1");
  });
});

describe("renderHtml escaping", () => {
  it("escapes a script tag in an attendee name", () => {
    const email: HotelEmail = {
      ...fullEmail,
      plan: { ...fullEmail.plan, attendees: [{ name: "<script>alert(1)</script>", diet: "" }] },
    };
    const html = renderHtml(email);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes & quotes and apostrophes in the title and plan text", () => {
    const email: HotelEmail = {
      ...fullEmail,
      proposal: { ...fullEmail.proposal, title: `Tom & Jerry's "party"` },
      plan: { ...fullEmail.plan, extras: ["<b>Bold</b>"] },
    };
    const html = renderHtml(email);
    expect(html).toContain("Tom &amp; Jerry&#39;s &quot;party&quot;");
    expect(html).toContain("&lt;b&gt;Bold&lt;/b&gt;");
    expect(html).not.toContain("<b>Bold</b>");
  });

  it("escapes diet names in the summary", () => {
    const email: HotelEmail = { ...fullEmail, dietSummary: [{ diet: "<i>x</i>", count: 2 }] };
    const html = renderHtml(email);
    expect(html).toContain("&lt;i&gt;x&lt;/i&gt;: 2");
  });
});
