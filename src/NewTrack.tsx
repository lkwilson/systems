import { useState } from "react";
import type { FormEvent } from "react";
import { createTrack } from "./api";
import type { Kind, NewTrack as NewTrackBody } from "./types";
import { KIND_BLURB, KIND_LABEL, WEEKDAYS } from "./util";

const KINDS: Kind[] = ["box", "check", "loe"];

// Contract defaults: tau 7, mean_load 240, period 2, alert_mult 1.75,
// unit_load 60, weekdays Mon/Wed/Fri/Sun.
const DEFAULTS: NewTrackBody = {
  name: "",
  kind: "box",
  tau_days: 7,
  mean_load: 240,
  period_days: 2,
  alert_mult: 1.75,
  weekdays: [1, 3, 5, 0],
  unit_load: 60,
};

function NumberField({
  label,
  value,
  step,
  min,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700/70 dark:bg-slate-900"
      />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export default function NewTrack({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NewTrackBody>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof NewTrackBody>(key: K, val: NewTrackBody[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(d)
        ? f.weekdays.filter((x) => x !== d)
        : [...f.weekdays, d].sort((a, b) => a - b),
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.name.trim() === "") {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const track = await createTrack({ ...form, name: form.name.trim() });
      onCreated(track.id);
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ‹ Overview
        </button>
        <h2 className="text-lg font-bold">New task</h2>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Name
          </span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Exercise"
            className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700/70 dark:bg-slate-900"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Kind
          </span>
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((k) => {
              const active = form.kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("kind", k)}
                  className={
                    "flex flex-col rounded-xl border px-3 py-2 text-left transition " +
                    (active
                      ? "border-emerald-400/70 bg-emerald-50 dark:border-emerald-600/60 dark:bg-emerald-950/40"
                      : "border-slate-200/70 bg-white/60 hover:border-slate-300 dark:border-slate-800/70 dark:bg-slate-900/40 dark:hover:border-slate-700")
                  }
                >
                  <span className="text-sm font-semibold">{KIND_LABEL[k]}</span>
                  <span className="text-xs text-slate-400">
                    {KIND_BLURB[k]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField
            label="tau (days)"
            value={form.tau_days}
            min={1}
            onChange={(n) => set("tau_days", n)}
            hint="EMA half-life"
          />
          <NumberField
            label="mean load"
            value={form.mean_load}
            min={1}
            onChange={(n) => set("mean_load", n)}
            hint="per occurrence"
          />
          <NumberField
            label="period (days)"
            value={form.period_days}
            min={1}
            onChange={(n) => set("period_days", n)}
            hint="target cadence"
          />
          <NumberField
            label="alert mult"
            value={form.alert_mult}
            step={0.05}
            min={0}
            onChange={(n) => set("alert_mult", n)}
            hint="× mean load"
          />
          <NumberField
            label="unit load"
            value={form.unit_load}
            min={1}
            onChange={(n) => set("unit_load", n)}
            hint="check / effort only"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Scheduled weekdays
          </span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((label, d) => {
              const active = form.weekdays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition " +
                    (active
                      ? "border-emerald-400/70 bg-emerald-500 text-white dark:border-emerald-600/60"
                      : "border-slate-200/70 bg-white/60 text-slate-600 hover:border-slate-300 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-slate-700")
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create task"}
        </button>
      </div>
    </form>
  );
}
