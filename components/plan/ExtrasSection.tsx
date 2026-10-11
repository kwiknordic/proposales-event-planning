"use client";
type Props = {
  extras: string[];
  onChange: (extras: string[]) => void;
};

export function ExtrasSection({ extras, onChange }: Props) {
  function updateExtra(index: number, text: string) {
    onChange(extras.map((extra, position) => (position === index ? text : extra)));
  }

  function removeExtra(index: number) {
    onChange(extras.filter((_, position) => position !== index));
  }

  function addExtra() {
    onChange([...extras, ""]);
  }

  return (
    <section className="card grid gap-4">
      <h2>Extras</h2>
      <p className="text-muted">Equipment and services you need, one per row.</p>

      {extras.map((extra, index) => {
        const row = index + 1;
        return (
          <div key={index} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <input
              className="input"
              type="text"
              aria-label={`Extra, row ${row}`}
              value={extra}
              onChange={(event) => updateExtra(index, event.target.value)}
            />
            <button type="button" className="btn-secondary btn-sm" onClick={() => removeExtra(index)}>
              Remove
            </button>
          </div>
        );
      })}

      <button type="button" className="btn-secondary btn-sm justify-self-start" onClick={addExtra}>
        Add extra
      </button>
    </section>
  );
}
