"use client";
// Shows where the plan stands with the hotel: not sent yet, sent, or notified of changes (with when).
// Used by PlanningForm.
import { useSyncExternalStore } from "react";

type Props = {
  status: "submitted" | null;
  notifiedAt: string | null;
};

export function StatusBadge({ status, notifiedAt }: Props) {
  if (status !== "submitted") return <span className="badge">Not sent to hotel yet</span>;
  if (!notifiedAt) return <span className="badge">Sent to hotel</span>;
  return (
    <span className="badge">
      Hotel notified of changes <LocalTime iso={notifiedAt} />
    </span>
  );
}

// Formatted only in the browser: the server runs in another timezone (UTC on Vercel), so it
// renders nothing and the browser fills in the local time after hydration.
function LocalTime({ iso }: { iso: string }) {
  const formatted = useSyncExternalStore(
    subscribeToNothing,
    () => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    () => "",
  );
  return <time dateTime={iso}>{formatted && `· ${formatted}`}</time>;
}

// The time never changes while the page is open, so there is nothing to subscribe to
function subscribeToNothing() {
  return () => {};
}
