// Tests for renderText: the same content and section order as the HTML email, as plain text.
import { describe, expect, it } from "vitest";
import type { HotelEmail } from "./buildEmail";
import { renderText } from "./renderText";

const fullEmail: HotelEmail = {
  subject: "[Action needed] Event plan updated: Acme Sales Kickoff",
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

describe("renderText", () => {
  it("shows the sections in the order of the hotel email", () => {
    const text = renderText(fullEmail);
    // Headings are whole lines, so a list item that starts with the same words does not count.
    const order = [
      "\nNeeds attention\n",
      "\nChanges\n",
      "\nAgenda\n",
      "\nSeating\n",
      "\nExtras\n",
      "\nOther requests\n",
      "\nDietary summary\n",
      "\nAttendees\n",
    ].map((heading) => text.indexOf(heading));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("writes the editor URL in full", () => {
    expect(renderText(fullEmail)).toContain("https://secure.proposales.com/proposals/abc/edit");
  });

  it("writes agenda items as time and title", () => {
    expect(renderText(fullEmail)).toContain("09:00 Welcome");
  });

  it("writes lists with a dash", () => {
    const text = renderText(fullEmail);
    expect(text).toContain("- Projector");
    expect(text).toContain("- AV: Two microphones");
  });

  it("writes the dietary summary as one line", () => {
    expect(renderText(fullEmail)).toContain("vegetarian: 1, no restriction: 1");
  });

  it("omits the empty sections", () => {
    const text = renderText(emptyPlanEmail);
    expect(text).not.toContain("Needs attention");
    expect(text).not.toContain("Changes");
    expect(text).not.toContain("Agenda");
    expect(text).not.toContain("Attendees");
    expect(text).not.toContain("Dietary summary");
    expect(text).toContain("Open in Proposales");
  });

  it("does not escape client text", () => {
    const email: HotelEmail = {
      ...fullEmail,
      plan: { ...fullEmail.plan, attendees: [{ name: "Tom & <Jerry>", diet: "" }] },
    };
    expect(renderText(email)).toContain("Tom & <Jerry>");
  });
});
