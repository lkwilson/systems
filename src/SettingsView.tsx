import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getSettings, putSettings } from "./api";
import type { Settings } from "./types";

export default function SettingsView({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    getSettings()
      .then((s) => live && setSettings(s))
      .catch((err) => live && setError(String(err)));
    return () => {
      live = false;
    };
  }, []);

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: val } : s));
    setSaved(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await putSettings(settings);
      setSaved(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ‹ Overview
        </button>
        <h2 className="text-lg font-bold">Settings</h2>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {settings && (
        <>
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                ntfy URL
              </span>
              <input
                value={settings.ntfy_url}
                onChange={(e) => set("ntfy_url", e.target.value)}
                placeholder="https://ntfy.sh/your-topic (empty disables paging)"
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700/70 dark:bg-slate-900"
              />
              <span className="text-xs text-slate-400">
                Empty string disables all paging.
              </span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Dashboard URL
              </span>
              <input
                value={settings.dashboard_url}
                onChange={(e) => set("dashboard_url", e.target.value)}
                placeholder="Click target on the notification"
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700/70 dark:bg-slate-900"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Alert hour
                </span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.alert_hour}
                  onChange={(e) => set("alert_hour", Number(e.target.value))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700/70 dark:bg-slate-900"
                />
                <span className="text-xs text-slate-400">
                  Local hour [0–23]; page only after this hour.
                </span>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Warmup days
                </span>
                <input
                  type="number"
                  min={1}
                  value={settings.warmup_days}
                  onChange={(e) => set("warmup_days", Number(e.target.value))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700/70 dark:bg-slate-900"
                />
                <span className="text-xs text-slate-400">
                  Recompute window length.
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                Saved.
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
