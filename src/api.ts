import type {
  Dashboard,
  NewTrack,
  OverviewRow,
  SessionBody,
  SessionResult,
  Settings,
  SkipBody,
  Track,
} from "./types";

// Thin wrapper over red's /api/systems scope. Every call throws on a non-2xx
// so callers can surface the error, mirroring mc-ui's api.ts.
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api/systems${path}`, {
    cache: "no-store",
    ...init,
    headers:
      init?.body !== undefined
        ? { "Content-Type": "application/json", ...init?.headers }
        : init?.headers,
  });
  if (!resp.ok) {
    throw new Error(`${path}: ${resp.status} ${resp.statusText}`);
  }
  // 200s may carry no body (PUT settings / skip); tolerate an empty response.
  const text = await resp.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// --- Settings -------------------------------------------------------------

export function getSettings(): Promise<Settings> {
  return req<Settings>("/settings");
}

export function putSettings(settings: Settings): Promise<void> {
  return req<void>("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// --- Overview / tracks ----------------------------------------------------

export function getOverview(): Promise<OverviewRow[]> {
  return req<OverviewRow[]>("/overview");
}

export function getTracks(): Promise<Track[]> {
  return req<Track[]>("/tracks");
}

export function getTrack(id: string): Promise<Track> {
  return req<Track>(`/tracks/${encodeURIComponent(id)}`);
}

export function createTrack(track: NewTrack): Promise<Track> {
  return req<Track>("/tracks", {
    method: "POST",
    body: JSON.stringify(track),
  });
}

export function updateTrack(id: string, track: Track): Promise<void> {
  return req<void>(`/tracks/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(track),
  });
}

export function deleteTrack(id: string): Promise<void> {
  return req<void>(`/tracks/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getDashboard(id: string): Promise<Dashboard> {
  return req<Dashboard>(`/tracks/${encodeURIComponent(id)}/dashboard`);
}

// --- Logging --------------------------------------------------------------

export function logSession(
  id: string,
  body: SessionBody,
): Promise<SessionResult> {
  return req<SessionResult>(`/tracks/${encodeURIComponent(id)}/session`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function logSkip(id: string, body: SkipBody): Promise<void> {
  return req<void>(`/tracks/${encodeURIComponent(id)}/skip`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
