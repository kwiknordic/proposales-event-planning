"use client";
// The demo banner on the planning page of a demo proposal: fill the form with the sample plan, or reset the demo. Used by the plan page; the parent does the work.
type Props = {
  onFill: () => void;
  onReset: () => void;
  isResetting: boolean;
};

export function DemoBanner({ onFill, onReset, isResetting }: Props) {
  return (
    <div className="banner flex-wrap">
      <p>
        Demo proposal. Fill the form with a sample plan, then save or submit. Others may use this demo too.
      </p>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary btn-sm" onClick={onFill}>
          Fill with sample plan
        </button>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={onReset}
          disabled={isResetting}
        >
          {isResetting ? "Resetting..." : "Reset demo"}
        </button>
      </div>
    </div>
  );
}
