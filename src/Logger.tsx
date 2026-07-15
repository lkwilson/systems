import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { logSession } from "./api";
import type { Kind, Loe, SessionBody } from "./types";
import { fmtLoad } from "./util";

type Status = "idle" | "saving";

// Shared "just logged N load" flash + error line under any logger.
function Feedback({
  error,
  last,
}: {
  error: string | null;
  last: number | null;
}) {
  if (error) {
    return (
      <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
    );
  }
  if (last != null) {
    return (
      <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
        Logged · load {fmtLoad(last)}
      </p>
    );
  }
  return null;
}

// The draggable-box plane for `box` kind. X = duration (min), Y = intensity
// (1–10); the drawn box's area is proportional to load = duration × intensity.
const MAX_DUR = 120;

function BoxLogger({ id, onLogged }: { id: string; onLogged: () => void }) {
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState(5);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);

  function apply(e: ReactPointerEvent) {
    const el = planeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const yTop = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    const fromBottom = 1 - yTop;
    setDuration(Math.max(1, Math.round(x * MAX_DUR)));
    setIntensity(Math.min(10, Math.max(1, Math.round(fromBottom * 10))));
  }

  function onDown(e: ReactPointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(e);
  }
  function onMove(e: ReactPointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) apply(e);
  }

  async function submit() {
    setStatus("saving");
    setError(null);
    try {
      const { load } = await logSession(id, {
        duration_min: duration,
        intensity,
      });
      setLast(load);
      onLogged();
    } catch (err) {
      setError(String(err));
    } finally {
      setStatus("idle");
    }
  }

  const load = duration * intensity;
  const boxW = (duration / MAX_DUR) * 100;
  const boxH = (intensity / 10) * 100;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Drag on the plane to set duration &amp; intensity
        </div>
        <div className="text-right leading-tight">
          <div className="text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
            {fmtLoad(load)}
          </div>
          <div className="text-xs text-slate-400">load</div>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Y axis label */}
        <div className="flex w-6 flex-col items-center justify-between py-1 text-xs text-slate-400">
          <span>10</span>
          <span className="rotate-180 [writing-mode:vertical-rl]">
            intensity
          </span>
          <span>1</span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            ref={planeRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            className="relative h-56 w-full touch-none overflow-hidden rounded-xl border border-slate-300/70 bg-slate-100/70 select-none dark:border-slate-700/70 dark:bg-slate-950/40"
          >
            {/* grid */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(to_top,rgba(100,116,139,0.12)_1px,transparent_1px)] bg-[size:10%_10%]" />
            {/* drawn box, anchored bottom-left */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 rounded-tr-md border-t-2 border-r-2 border-emerald-500 bg-gradient-to-tr from-emerald-500/30 to-emerald-400/20"
              style={{ width: `${boxW}%`, height: `${boxH}%` }}
            />
            {/* corner handle */}
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 shadow dark:border-slate-900"
              style={{ left: `${boxW}%`, top: `${100 - boxH}%` }}
            />
          </div>
          {/* X axis label */}
          <div className="mt-1 flex justify-between px-1 text-xs text-slate-400">
            <span>0</span>
            <span>duration (min) →</span>
            <span>{MAX_DUR}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="text-sm text-slate-500 tabular-nums dark:text-slate-400">
          {duration} min · intensity {intensity}
        </div>
        <button
          onClick={submit}
          disabled={status === "saving"}
          className="ml-auto rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
        >
          {status === "saving" ? "Logging…" : "Log session"}
        </button>
      </div>
      <Feedback error={error} last={last} />
    </div>
  );
}

// Single big "Did it" button for `check` kind.
function CheckLogger({ id, onLogged }: { id: string; onLogged: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<number | null>(null);

  async function submit() {
    setStatus("saving");
    setError(null);
    try {
      const { load } = await logSession(id, {});
      setLast(load);
      onLogged();
    } catch (err) {
      setError(String(err));
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div>
      <button
        onClick={submit}
        disabled={status === "saving"}
        className="w-full rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 px-6 py-8 text-lg font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
      >
        {status === "saving" ? "Logging…" : "Did it ✓"}
      </button>
      <Feedback error={error} last={last} />
    </div>
  );
}

// Low / Med / High buttons for `loe` kind.
function LoeLogger({ id, onLogged }: { id: string; onLogged: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<number | null>(null);

  async function submit(loe: Loe) {
    setStatus("saving");
    setError(null);
    try {
      const body: SessionBody = { loe };
      const { load } = await logSession(id, body);
      setLast(load);
      onLogged();
    } catch (err) {
      setError(String(err));
    } finally {
      setStatus("idle");
    }
  }

  const levels: { loe: Loe; label: string }[] = [
    { loe: "low", label: "Low" },
    { loe: "med", label: "Med" },
    { loe: "high", label: "High" },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {levels.map((l) => (
          <button
            key={l.loe}
            onClick={() => submit(l.loe)}
            disabled={status === "saving"}
            className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-6 text-base font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
          >
            {l.label}
          </button>
        ))}
      </div>
      <Feedback error={error} last={last} />
    </div>
  );
}

// Dispatches to the right logger for a track's kind.
export default function Logger({
  id,
  kind,
  onLogged,
}: {
  id: string;
  kind: Kind;
  onLogged: () => void;
}) {
  if (kind === "box") return <BoxLogger id={id} onLogged={onLogged} />;
  if (kind === "check") return <CheckLogger id={id} onLogged={onLogged} />;
  return <LoeLogger id={id} onLogged={onLogged} />;
}
