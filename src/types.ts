// Mirrors red's /api/systems shapes (see the contract). A maintenance/chore
// tracker: each track's deficit is recomputed from its raw session log.

// Logging modality of a track. Drives both the logger UI and how `load` is
// computed server-side.
export type Kind = "box" | "check" | "loe";

// Level of effort for a `loe` session.
export type Loe = "low" | "med" | "high";

// A track's tunables + identity. `id`/`created_ms` are server-assigned.
export type Track = {
  id: string;
  name: string;
  kind: Kind;
  tau_days: number;
  mean_load: number;
  period_days: number;
  alert_mult: number;
  weekdays: number[]; // scheduled-obligation days; 0=Sun … 6=Sat
  unit_load: number; // used by check/loe; ignored for box
  created_ms: number;
};

// Global settings. EMPTY ntfy_url disables paging.
export type Settings = {
  ntfy_url: string;
  dashboard_url: string;
  alert_hour: number; // local hour [0-23]
  warmup_days: number;
};

// One point in a dashboard fitness series (warmup_days long, chronological).
export type FitnessPoint = { date: string; value: number };

// One local-day's bucketed load (same range as fitness).
export type DailyLoadPoint = { date: string; load: number };

// Scheduled-vs-completed adherence over the last 14 local days.
export type Adherence = {
  scheduled: number;
  completed: number;
  unlogged_skips: number;
};

// GET /api/systems/tracks/:id/dashboard
export type Dashboard = {
  id: string;
  name: string;
  kind: Kind;
  floor: number;
  deficit_load: number;
  deficit_sessions: number;
  alert_threshold: number;
  fitness: FitnessPoint[];
  daily_load: DailyLoadPoint[];
  adherence: Adherence;
};

// One row of GET /api/systems/overview.
export type OverviewRow = {
  id: string;
  name: string;
  kind: Kind;
  deficit_load: number;
  deficit_sessions: number;
  alert_threshold: number;
  over_threshold: boolean;
  unlogged_skips: number;
  last_session_ms: number | null;
};

// Fields accepted when creating a track (POST /api/systems/tracks). The server
// assigns id/created_ms.
export type NewTrack = {
  name: string;
  kind: Kind;
  tau_days: number;
  mean_load: number;
  period_days: number;
  alert_mult: number;
  weekdays: number[];
  unit_load: number;
};

// Per-kind session bodies (POST /api/systems/tracks/:id/session). All also
// accept an optional ts_ms (defaults to now server-side).
export type BoxSession = {
  duration_min: number;
  intensity: number;
  ts_ms?: number;
};
export type CheckSession = { ts_ms?: number };
export type LoeSession = { loe: Loe; ts_ms?: number };
export type SessionBody = BoxSession | CheckSession | LoeSession;

// Server's response to a logged session.
export type SessionResult = { load: number };

// POST /api/systems/tracks/:id/skip. Null/empty reason = unlogged skip = the
// relapse signal.
export type SkipBody = { scheduled_date: string; reason?: string };
