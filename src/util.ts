import type { Kind } from "./types";

// Human labels for the three task kinds.
export const KIND_LABEL: Record<Kind, string> = {
  box: "Box",
  check: "Check",
  loe: "Effort",
};

// One-line description of each kind's logging modality.
export const KIND_BLURB: Record<Kind, string> = {
  box: "duration × intensity",
  check: 'binary "did it"',
  loe: "low / med / high",
};

// 0=Sun … 6=Sat, matching the contract's weekday encoding.
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Compact relative recency, e.g. "3h ago", "2d ago", or "never".
export function ago(ms: number | null): string {
  if (ms == null) return "never";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

// Today's local date as YYYY-MM-DD (the skip endpoint's scheduled_date form).
export function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Round a load number for display without a trailing ".0".
export function fmtLoad(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(0);
}
