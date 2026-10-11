"use client";
import type { OtherRequest } from "@/lib/planning/schema";

type Props = {
  requests: OtherRequest[];
  onChange: (requests: OtherRequest[]) => void;
};

const emptyRequest: OtherRequest = { label: "", details: "" };

export function RequestsSection({ requests, onChange }: Props) {
  function updateRequest(index: number, changes: Partial<OtherRequest>) {
    onChange(requests.map((request, position) => (position === index ? { ...request, ...changes } : request)));
  }

  function removeRequest(index: number) {
    onChange(requests.filter((_, position) => position !== index));
  }

  function addRequest() {
    onChange([...requests, emptyRequest]);
  }

  return (
    <section className="card grid gap-4">
      <h2>Other requests</h2>
      <p className="text-muted">Anything else the hotel should arrange, like AV or signage.</p>

      {requests.map((request, index) => {
        const row = index + 1;
        return (
          <div key={index} className="grid grid-cols-[10rem_1fr_auto] items-center gap-3">
            <input
              className="input"
              type="text"
              placeholder="AV"
              aria-label={`Request label, row ${row}`}
              value={request.label}
              onChange={(event) => updateRequest(index, { label: event.target.value })}
            />
            <input
              className="input"
              type="text"
              aria-label={`Request details, row ${row}`}
              value={request.details}
              onChange={(event) => updateRequest(index, { details: event.target.value })}
            />
            <button type="button" className="btn-secondary btn-sm" onClick={() => removeRequest(index)}>
              Remove
            </button>
          </div>
        );
      })}

      <button type="button" className="btn-secondary btn-sm justify-self-start" onClick={addRequest}>
        Add request
      </button>
    </section>
  );
}
