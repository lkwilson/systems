import type { OverviewRow } from "./types";
import { KIND_LABEL, ago, fmtLoad } from "./util";

// A single track's summary card. The deficit is the headline; a red flag means
// the track is over its alert threshold or has unlogged skips (the relapse
// signal, which must be 0).
function Card({ row, onOpen }: { row: OverviewRow; onOpen: () => void }) {
  const flagged = row.over_threshold || row.unlogged_skips > 0;
  const deficitTone =
    row.deficit_sessions <= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : flagged
        ? "text-rose-600 dark:text-rose-400"
        : "text-amber-600 dark:text-amber-400";

  return (
    <button
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow dark:border-slate-800/70 dark:bg-slate-900/50 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{row.name}</h3>
          <p className="text-xs text-slate-400">{KIND_LABEL[row.kind]}</p>
        </div>
        {flagged && (
          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {row.over_threshold ? "over threshold" : "unlogged skip"}
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className={"text-4xl font-extrabold tabular-nums " + deficitTone}>
          {row.deficit_sessions.toFixed(1)}
        </span>
        <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">
          sessions behind
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span>deficit load {fmtLoad(row.deficit_load)}</span>
        <span>
          unlogged skips{" "}
          <span
            className={
              row.unlogged_skips > 0
                ? "font-semibold text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400"
            }
          >
            {row.unlogged_skips}
          </span>
        </span>
        <span className="ml-auto">logged {ago(row.last_session_ms)}</span>
      </div>
    </button>
  );
}

export default function Overview({
  rows,
  onOpen,
  onNew,
}: {
  rows: OverviewRow[];
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
          Tracks
        </h2>
        <button
          onClick={onNew}
          className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          + New task
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/60 text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-400">
          No tracks yet — create one to start.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.id} row={r} onOpen={() => onOpen(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
