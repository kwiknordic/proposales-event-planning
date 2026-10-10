"use client";
// The Seating card of the event plan: layout dropdown and notes. Rendered by the plan form page;
// holds no state, so the form stays the single source of truth for the plan.
import { SEATING_LAYOUTS, type Seating } from "@/lib/planning/schema";

const LAYOUT_LABELS: Record<(typeof SEATING_LAYOUTS)[number], string> = {
  theatre: "Theatre",
  classroom: "Classroom",
  banquet: "Banquet",
  "u-shape": "U-shape",
  boardroom: "Boardroom",
  cabaret: "Cabaret",
};

type Props = {
  seating: Seating;
  onChange: (seating: Seating) => void;
};

export function SeatingSection({ seating, onChange }: Props) {
  const isKnownLayout = (SEATING_LAYOUTS as readonly string[]).includes(seating.layout);
  // A layout the hotel typed in the Data panel is not in the list; keep it as an option so it is not lost.
  const hasUnknownLayout = seating.layout !== "" && !isKnownLayout;

  return (
    <section className="card grid gap-4">
      <h2>Seating</h2>
      <div className="field">
        <label className="label" htmlFor="seating-layout">
          Layout
        </label>
        <select
          id="seating-layout"
          className="select"
          value={seating.layout}
          onChange={(event) => onChange({ ...seating, layout: event.target.value })}
        >
          <option value="">Choose a layout</option>
          {hasUnknownLayout && <option value={seating.layout}>{seating.layout}</option>}
          {SEATING_LAYOUTS.map((layout) => (
            <option key={layout} value={layout}>
              {LAYOUT_LABELS[layout]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="label" htmlFor="seating-notes">
          Notes
        </label>
        <textarea
          id="seating-notes"
          className="textarea"
          value={seating.notes}
          onChange={(event) => onChange({ ...seating, notes: event.target.value })}
        />
      </div>
    </section>
  );
}
