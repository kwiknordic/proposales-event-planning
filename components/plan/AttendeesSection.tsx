"use client";
// The attendees card of the event plan form (name + diet rows, and a paste box). Used by the plan page; the list state lives in the parent.
import { useState } from "react";
import type { Attendee } from "@/lib/planning/schema";
import { cleanAttendees, parsePastedAttendees } from "@/lib/planning/sections/attendees";

type Props = {
  attendees: Attendee[];
  onChange: (attendees: Attendee[]) => void;
};

const emptyAttendee: Attendee = { name: "", diet: "" };

export function AttendeesSection({ attendees, onChange }: Props) {
  // Only the paste box is local: its text and the note about the last paste. The list itself is the parent's.
  const [pasteText, setPasteText] = useState("");
  const [pasteNote, setPasteNote] = useState("");

  const count = cleanAttendees(attendees).length;

  function updateAttendee(index: number, changes: Partial<Attendee>) {
    onChange(attendees.map((attendee, position) => (position === index ? { ...attendee, ...changes } : attendee)));
  }

  function removeAttendee(index: number) {
    onChange(attendees.filter((_, position) => position !== index));
  }

  function addAttendee() {
    onChange([...attendees, emptyAttendee]);
  }

  // Appends instead of replacing, so a paste never throws away rows the client already typed.
  function addFromList() {
    const added = parsePastedAttendees(pasteText);
    onChange([...attendees, ...added]);
    setPasteText("");
    setPasteNote(`Added ${added.length} ${added.length === 1 ? "attendee" : "attendees"}. Check them, then save.`);
  }

  return (
    <section className="card grid gap-4">
      <h2>Attendees</h2>
      <p className="text-muted">{count} {count === 1 ? "attendee" : "attendees"}</p>

      {attendees.map((attendee, index) => {
        const row = index + 1;
        return (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
            <input
              className="input"
              type="text"
              aria-label={`Attendee name, row ${row}`}
              value={attendee.name}
              onChange={(event) => updateAttendee(index, { name: event.target.value })}
            />
            <input
              className="input"
              type="text"
              placeholder="e.g. vegetarian"
              aria-label={`Attendee diet, row ${row}`}
              value={attendee.diet}
              onChange={(event) => updateAttendee(index, { diet: event.target.value })}
            />
            <button type="button" className="btn-secondary btn-sm" onClick={() => removeAttendee(index)}>
              Remove
            </button>
          </div>
        );
      })}

      <button type="button" className="btn-secondary btn-sm justify-self-start" onClick={addAttendee}>
        Add attendee
      </button>

      <div className="field">
        <label className="label" htmlFor="attendees-paste">
          Paste a list
        </label>
        <textarea
          id="attendees-paste"
          className="textarea"
          rows={4}
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
        />
        <p className="text-muted">
          One person per line: Name, or Name, diet. Pasting from a spreadsheet works too.
        </p>
      </div>
      <button
        type="button"
        className="btn-secondary btn-sm justify-self-start"
        disabled={pasteText.trim() === ""}
        onClick={addFromList}
      >
        Add from list
      </button>
      {pasteNote !== "" && <p className="text-muted">{pasteNote}</p>}
    </section>
  );
}
