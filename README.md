# systems

The **maintenance/chore tracker** frontend — a React + Tailwind SPA that turns
non-terminating "keep doing X" goals into an accruing **deficit** that pages you
via ntfy. Each track's deficit/fitness is never stored; the backend recomputes it
from the raw session log on every read.

It is the frontend half of a pair, sharing the `red` backend with `mc-ui`:

```
systems (this repo, nginx static SPA)
  └─ proxies /api/  ──▶  app-red-service.home  (red, the backend)
                              └─ /api/systems/*
                                   ├─ GET/PUT /settings
                                   ├─ GET      /overview
                                   ├─ CRUD     /tracks[/:id]
                                   ├─ POST     /tracks/:id/session   (per-kind body)
                                   ├─ POST     /tracks/:id/skip
                                   └─ GET      /tracks/:id/dashboard
```

## Task kinds

Every track has a `kind` that sets its logging modality and how `load` is
computed server-side:

- **box** — `{ duration_min, intensity }`; `load = duration_min * intensity`.
  Logged by dragging a box on a 2-D duration × intensity plane.
- **check** — `{}`; `load = unit_load`. A single "Did it" button.
- **loe** — `{ loe }`; `load = unit_load * {low:1, med:2, high:3}`. Low/Med/High.

## Frontend structure

- `src/App.tsx` — view switching (no router): overview / track detail / new task /
  settings. Polls `GET /api/systems/overview` every 15s.
- `src/Overview.tsx` — one card per track; deficit as the headline, red flag when
  over threshold or any unlogged skip (the relapse signal).
- `src/TrackDetail.tsx` — fitness-vs-floor LineChart (floor as a ReferenceLine),
  daily-load BarChart (recharts), hero deficit, adherence, the per-kind logger,
  and a "log a skip" affordance.
- `src/Logger.tsx` — the three per-kind loggers.
- `src/NewTrack.tsx` — create-track form with tunables + weekday multi-select.
- `src/SettingsView.tsx` — ntfy_url / dashboard_url / alert_hour / warmup_days.
- `src/api.ts` / `src/types.ts` — wrappers + shapes for the `/api/systems` scope.

No `localStorage`/`sessionStorage` — redis via the API is the only state.

## Dev

Node comes from the nix flake. red is internal-only, so point the Vite dev proxy
at a port-forwarded red:

```
kubectl -n home port-forward svc/app-red-service 8080:80   # in another terminal
nix develop
npm install
npm run dev            # proxies /api -> http://localhost:8080 (override RED_TARGET)
```

## Checks

```
npm ci && npm run build     # tsc -b + vite build (scripts/check.sh)
npm run ff                  # prettier --write (tailwind class sorting)
```

## CI / release

Standard home-infra frontend pipeline: `.gitea/workflows` build on `brew7`, no
sccache. A merged PR **must carry a `patch`/`minor`/`major` label** or
`release.yml` cuts no tag and no image is built. Images publish to
`harbor.endsy.me/library/systems`.
