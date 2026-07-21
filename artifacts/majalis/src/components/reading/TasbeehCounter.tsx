import { useEffect } from "react";
import { useTasbeehCounter } from "@/hooks/useTasbeehCounter";
import { TASBEEH_PRESETS, type TasbeehWird } from "@/lib/tasbeeh-storage";

// ─── SVG Progress Ring ─────────────────────────────────────────────────────

const RING_R = 66;
const RING_C = 2 * Math.PI * RING_R; // ≈ 414.7

function ProgressRing({
  count,
  target,
  goalReached,
  pulse,
  onClick,
}: {
  count: number;
  target: number;
  goalReached: boolean;
  pulse: boolean;
  onClick: () => void;
}) {
  const rounds   = target > 0 ? Math.floor(count / target) : 0;
  const remainder = target > 0 ? count % target : count;
  const ringPct  = target > 0
    ? (remainder === 0 && count > 0 ? 100 : (remainder / target) * 100)
    : 0;
  const displayCount = target > 0
    ? (remainder === 0 && count > 0 ? target : remainder)
    : count;
  const offset = RING_C * (1 - Math.min(ringPct, 100) / 100);

  return (
    <button
      type="button"
      className={[
        "tc-ring-btn tc-btn-wrap",
        pulse ? "tc-ring-btn--pulse" : "",
        goalReached ? "tc-ring-btn--done" : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      aria-label={`${count} — اضغط للتسبيح`}
    >
      <svg viewBox="0 0 160 160" className="tc-ring-svg" aria-hidden="true">
        <circle cx="80" cy="80" r={RING_R} className="tc-ring-track" />
        <circle
          cx="80" cy="80" r={RING_R}
          className={`tc-ring-fill${goalReached ? " tc-ring-fill--done" : ""}`}
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="tc-ring-inner">
        {rounds > 0 && (
          <span className="tc-ring-rounds">{rounds}×</span>
        )}
        <span className="tc-ring-count">{displayCount}</span>
        {target > 0 && rounds > 0 && (
          <span className="tc-ring-total">مجموع: {count}</span>
        )}
        <span className="tc-ring-hint">
          {goalReached ? "✓ استمر" : "اضغط"}
        </span>
      </div>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

type Props = {
  storageId: string;
  target: number;
  label?: string;
  compact?: boolean;
  wird?: TasbeehWird;
  onWirdChange?: (next: TasbeehWird) => void;
};

export function TasbeehCounter({
  storageId, target, label = "عداد التسبيح", compact = false, wird, onWirdChange,
}: Props) {
  const {
    count,
    target: activeTarget,
    progress,
    goalReached,
    pulse,
    increment,
    undo,
    reset,
    setTarget,
    canUndo,
  } = useTasbeehCounter({ storageId, initialTarget: target, wird, onWirdChange });

  // Keyboard support (Space/Enter = +1, Backspace = undo)
  useEffect(() => {
    if (compact) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as Element)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        increment(1);
      }
      if (e.code === "Backspace" || (e.code === "KeyZ" && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact, increment, undo]);

  // ── Compact mode ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className={`tasbeeh-counter tasbeeh-counter--compact${pulse ? " tasbeeh-counter--pulse" : ""}`}>
        <div className="tasbeeh-counter__head">
          <span>{label}</span>
          <strong>{count}{activeTarget > 0 ? ` / ${activeTarget}` : ""}</strong>
        </div>
        {activeTarget > 0 && (
          <div className="tasbeeh-counter__bar" aria-hidden="true">
            <span style={{ "--tc-pct": `${progress}%` } as React.CSSProperties} />
          </div>
        )}
        <div className="tasbeeh-counter__actions">
          <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--primary" onClick={() => increment(1)} aria-label="إضافة ذكر واحد">
            +1
          </button>
          <button type="button" className="tasbeeh-counter__btn" disabled={!canUndo} onClick={undo}>تراجع</button>
          <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--ghost" onClick={reset}>تصفير</button>
        </div>
      </div>
    );
  }

  // ── Pro mode ──────────────────────────────────────────────────────────────
  return (
    <div className={`tasbeeh-counter tasbeeh-counter--pro${pulse ? " tasbeeh-counter--pulse" : ""}`}>
      {/* Presets */}
      <div className="tasbeeh-counter__presets" role="group" aria-label="اختيار الهدف">
        {TASBEEH_PRESETS.filter((p) => p.value !== "custom").map((p) => (
          <button
            key={String(p.value)}
            type="button"
            className={`tasbeeh-counter__preset${activeTarget === p.value ? " is-active" : ""}`}
            onClick={() => setTarget(Number(p.value))}
          >
            {p.label}
          </button>
        ))}
        <label className="tasbeeh-counter__custom-target">
          <span>مخصص</span>
          <input
            type="number"
            min={1}
            value={activeTarget}
            onChange={(e) => setTarget(Number(e.target.value))}
            aria-label="هدف مخصص"
          />
        </label>
      </div>

      {/* Progress ring — main tap area */}
      <ProgressRing
        count={count}
        target={activeTarget}
        goalReached={goalReached}
        pulse={pulse}
        onClick={() => increment(1)}
      />

      {/* Actions */}
      <div className="tasbeeh-counter__actions">
        <button type="button" className="tasbeeh-counter__btn" disabled={!canUndo} onClick={undo}>
          ↩ تراجع
        </button>
        <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--ghost" onClick={reset}>
          ✕ تصفير
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="tc-keyboard-hint" aria-hidden="true">
        مفتاح المسافة أو Enter للتسبيح · Backspace للتراجع
      </p>
    </div>
  );
}

export default TasbeehCounter;
