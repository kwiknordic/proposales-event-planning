"use client";
// The agenda card of the event plan form (time + title rows). Used by the plan page; state lives in the parent.
import type { AgendaItem } from "@/lib/planning/schema";

type Props = {
  agenda: AgendaItem[];
  onChange: (agenda: AgendaItem[]) => void;
};

const emptyItem: AgendaItem = { time: "", title: "" };

export function AgendaSection({ agenda, onChange }: Props) {
  function updateItem(index: number, changes: Partial<AgendaItem>) {
    onChange(agenda.map((item, position) => (position === index ? { ...item, ...changes } : item)));
  }

  function removeItem(index: number) {
    onChange(agenda.filter((_, position) => position !== index));
  }

  function addItem() {
    onChange([...agenda, emptyItem]);
  }

  return (
    <section className="card grid gap-4">
      <h2>Agenda</h2>
      <p className="text-muted">Add the times and titles of your event, in the order they happen.</p>

      {agenda.map((item, index) => {
        const row = index + 1;
        return (
          <div key={index} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3">
            <input
              className="input"
              type="text"
              placeholder="09:00"
              aria-label={`Agenda time, row ${row}`}
              value={item.time}
              onChange={(event) => updateItem(index, { time: event.target.value })}
            />
            <input
              className="input"
              type="text"
              aria-label={`Agenda title, row ${row}`}
              value={item.title}
              onChange={(event) => updateItem(index, { title: event.target.value })}
            />
            <button type="button" className="btn-secondary btn-sm" onClick={() => removeItem(index)}>
              Remove
            </button>
          </div>
        );
      })}

      <button type="button" className="btn-secondary btn-sm justify-self-start" onClick={addItem}>
        Add agenda item
      </button>
    </section>
  );
}
