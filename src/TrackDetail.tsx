import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { deleteTrack, getDashboard, logSkip } from "./api";
import type { Dashboard } from "./types";
import Logger from "./Logger";
import { KIND_BLURB, KIND_LABEL, fmtLoad, todayLocal } from "./util";

const POLL_MS = 15000;

// Shorten an ISO date (YYYY-MM-DD) to "Jul 3" for axis ticks.
function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const tickStyle = { fontSize: 11, fill: "currentColor" };
const gridStroke = "rgba(100,116,139,0.2)";

function Hero({ dash }: { dash: Dashboard }) {
  const over = dash.deficit_load > dash.alert_threshold;
  const tone =
    dash.deficit_sessions <= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : over
        ? "text-rose-600 dark:text-rose-400"
        : "text-amber-600 dark:text-amber-400";
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Deficit
      </span>
      <div className="flex items-end gap-2">
        <span className={"text-5xl font-extrabold tabular-nums " + tone}>
          {dash.deficit_sessions.toFixed(1)}
        </span>
        <span className="pb-1.5 text-sm text-slate-500 dark:text-slate-400">
          sessions
        </span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        deficit load {fmtLoad(dash.deficit_load)} · floor {fmtLoad(dash.floor)}{" "}
        · alert at {fmtLoad(dash.alert_threshold)}
        {over && (
          <span className="ml-1 font-semibold text-rose-600 dark:text-rose-400">
            (over threshold)
          </span>
        )}
      </div>
    </div>
  );
}

function Adherence({ dash }: { dash: Dashboard }) {
  const a = dash.adherence;
  const skipsBad = a.unlogged_skips > 0;
  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <div>
        <div className="text-2xl font-bold tabular-nums">{a.scheduled}</div>
        <div className="text-xs text-slate-400">scheduled (14d)</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
          {a.completed}
        </div>
        <div className="text-xs text-slate-400">completed</div>
      </div>
      <div>
        <div
          className={
            "text-2xl font-bold tabular-nums " +
            (skipsBad
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-700 dark:text-slate-200")
          }
        >
          {a.unlogged_skips}
        </div>
        <div className="text-xs text-slate-400">unlogged skips</div>
      </div>
    </div>
  );
}

function tooltipStyle() {
  return {
    contentStyle: {
      borderRadius: 12,
      border: "1px solid rgba(100,116,139,0.3)",
      background: "rgba(15,23,42,0.92)",
      color: "#e2e8f0",
      fontSize: 12,
    },
    labelStyle: { color: "#94a3b8" },
  } as const;
}

function FitnessChart({ dash }: { dash: Dashboard }) {
  const tt = tooltipStyle();
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <h3 className="mb-3 text-sm font-semibold">Fitness vs floor</h3>
      <div className="h-56 w-full text-slate-400">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dash.fitness}
            margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
          >
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="date"
              tick={tickStyle}
              tickFormatter={shortDate}
              minTickGap={40}
              stroke={gridStroke}
            />
            <YAxis tick={tickStyle} stroke={gridStroke} width={44} />
            <Tooltip
              {...tt}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(v) => [fmtLoad(Number(v)), "fitness"]}
            />
            <ReferenceLine
              y={dash.floor}
              stroke="#f59e0b"
              strokeDasharray="5 4"
              strokeWidth={2}
              label={{
                value: "floor",
                position: "insideTopRight",
                fill: "#f59e0b",
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DailyLoadChart({ dash }: { dash: Dashboard }) {
  const tt = tooltipStyle();
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <h3 className="mb-3 text-sm font-semibold">Daily load</h3>
      <div className="h-56 w-full text-slate-400">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dash.daily_load}
            margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
          >
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="date"
              tick={tickStyle}
              tickFormatter={shortDate}
              minTickGap={40}
              stroke={gridStroke}
            />
            <YAxis tick={tickStyle} stroke={gridStroke} width={44} />
            <Tooltip
              {...tt}
              cursor={{ fill: "rgba(16,185,129,0.12)" }}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(v) => [fmtLoad(Number(v)), "load"]}
            />
            <Bar dataKey="load" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function TrackDetail({
  id,
  onBack,
  onDeleted,
}: {
  id: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipMsg, setSkipMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await getDashboard(id);
      setDash(d);
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function skip() {
    // Empty reason on purpose: an unlogged skip is the real relapse signal.
    setSkipMsg(null);
    try {
      await logSkip(id, { scheduled_date: todayLocal() });
      setSkipMsg("Skip logged for today.");
      load();
    } catch (err) {
      setSkipMsg(String(err));
    }
  }

  async function remove() {
    if (
      !confirm(`Delete track "${dash?.name ?? id}"? This cannot be undone.`)
    ) {
      return;
    }
    try {
      await deleteTrack(id);
      onDeleted();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ‹ Overview
        </button>
        <div className="min-w-0 text-right">
          <h2 className="truncate text-lg font-bold">{dash?.name ?? id}</h2>
          {dash && (
            <p className="text-xs text-slate-400">
              {KIND_LABEL[dash.kind]} · {KIND_BLURB[dash.kind]}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {dash && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Hero dash={dash} />
            <Adherence dash={dash} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FitnessChart dash={dash} />
            <DailyLoadChart dash={dash} />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
            <h3 className="mb-3 text-sm font-semibold">Log a session</h3>
            <Logger id={id} kind={dash.kind} onLogged={load} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-5 py-4 dark:border-slate-800/70 dark:bg-slate-900/40">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Missed a scheduled day? Logging a skip with no reason is the
              relapse signal.
            </div>
            <div className="flex items-center gap-3">
              {skipMsg && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {skipMsg}
                </span>
              )}
              <button
                onClick={skip}
                className="rounded-lg border border-amber-400/70 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70"
              >
                Log a skip
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={remove}
              className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 hover:underline dark:hover:text-rose-400"
            >
              Delete track
            </button>
          </div>
        </>
      )}
    </div>
  );
}
