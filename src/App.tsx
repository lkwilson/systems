import { useCallback, useEffect, useState } from "react";
import { getOverview } from "./api";
import type { OverviewRow } from "./types";
import Overview from "./Overview";
import TrackDetail from "./TrackDetail";
import NewTrack from "./NewTrack";
import SettingsView from "./SettingsView";

const POLL_MS = 15000;

// In-component view switching (no router), mirroring mc-ui's App.tsx.
type View =
  | { name: "overview" }
  | { name: "track"; id: string }
  | { name: "new" }
  | { name: "settings" };

export default function App() {
  const [view, setView] = useState<View>({ name: "overview" });
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const list = await getOverview();
      setRows(list);
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Keep the overview fresh while it (or any view derived from it) is shown.
  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 pb-10 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 dark:border-slate-800/60 dark:bg-slate-950/80">
        <button
          onClick={() => setView({ name: "overview" })}
          className="flex items-center gap-3 text-left"
        >
          <img
            src="/favicon.svg"
            alt=""
            className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          />
          <div className="leading-tight">
            <h1 className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Systems
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              maintenance tracker
            </p>
          </div>
        </button>
        <button
          onClick={() => setView({ name: "settings" })}
          className={
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
            (view.name === "settings"
              ? "border-emerald-400/70 bg-emerald-50 text-emerald-700 dark:border-emerald-600/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-slate-300/70 text-slate-600 hover:bg-slate-100 dark:border-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-800")
          }
        >
          Settings
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <main className="flex-1 pt-4">
        {view.name === "overview" && (
          <Overview
            rows={rows}
            onOpen={(id) => setView({ name: "track", id })}
            onNew={() => setView({ name: "new" })}
          />
        )}
        {view.name === "track" && (
          <TrackDetail
            id={view.id}
            onBack={() => {
              poll();
              setView({ name: "overview" });
            }}
            onDeleted={() => {
              poll();
              setView({ name: "overview" });
            }}
          />
        )}
        {view.name === "new" && (
          <NewTrack
            onCreated={(id) => {
              poll();
              setView({ name: "track", id });
            }}
            onCancel={() => setView({ name: "overview" })}
          />
        )}
        {view.name === "settings" && (
          <SettingsView onBack={() => setView({ name: "overview" })} />
        )}
      </main>
    </div>
  );
}
