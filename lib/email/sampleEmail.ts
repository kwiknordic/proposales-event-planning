// A small, made-up update email (one entry per section) shown on the landing page, built with
// the same buildEmail as the real thing. Used by components/landing/EmailPreview.tsx.
import type { Change } from "@/lib/planning/changes";
import type { Plan } from "@/lib/planning/schema";
import { buildEmail } from "./buildEmail";

const plan: Plan = {
  agenda: [{ time: "09:00", title: "Welcome and kickoff keynote" }],
  seating: { layout: "classroom", notes: "Stage at the front" },
  extras: ["Projector and screen"],
  requests: [{ label: "AV", details: "Two wireless microphones" }],
  attendees: [{ name: "Grace Kim", diet: "Severe nut allergy" }],
};

const allergyChange: Change = {
  section: "attendees",
  kind: "changed",
  line: "Grace Kim: diet (empty) -> Severe nut allergy",
};
const extraChange: Change = { section: "extras", kind: "added", line: "Extra added: Projector and screen" };

export const sampleEmail = buildEmail({
  kind: "updated",
  // A placeholder uuid: the "Open in Proposales" link is only for show here
  proposal: { uuid: "00000000-0000-4000-8000-000000000000", title: "Acme Sales Kickoff – 2 days, 40 people", status: "accepted" },
  plan,
  changes: [allergyChange, extraChange],
  // Fixed rather than asking Jev: a nut allergy scored 0.97 when the threshold was tuned
  urgentChanges: [allergyChange.line],
});
