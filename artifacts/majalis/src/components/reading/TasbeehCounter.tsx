import { useState } from "react";
import { useTasbeehCounter } from "@/hooks/useTasbeehCounter";
import { TASBEEH_PRESETS, readTasbeehHistory, clearTasbeehHistory, type TasbeehWird } from "@/lib/tasbeeh-storage";

type Props = {
  storageId: string;
  target: number;
  label?: string;
  compact?: boolean;
  wird?: TasbeehWird;
  onWirdChange?: (next: TasbeehWird) => void;
};

export function TasbeehCounter({ storageId, target, label = "عداد التسبيح", compact = false, wird, onWirdChange }: Props) {
  const [history, setHistory] = useState(() => readTasbeehHistory());
  const refreshHistory = () => setHistory(readTasbeehHistory());

  const {
    count,
    target: activeTarget,
    progress,
    goalReached,
    isOpenMode,
    pulse,
    increment,
    decrement,
    undo,
    reset,
    setTarget,
    canUndo,
  } = useTasbeehCounter({
    storageId,
    initialTarget: target,
    phrase: label,
    wird,
    onWirdChange,
    onHistory: refreshHistory,
  });

  if (compact) {
    return (
      <div className={`tasbeeh-counter tasbeeh-counter--compact${pulse ? " tasbeeh-counter--pulse" : ""}`}>
        <div className="tasbeeh-counter__head">
          <span>{label}</span>
          <strong>{count}{!isOpenMode && activeTarget > 0 ? ` / ${activeTarget}` : ""}</strong>
        </div>
        {!isOpenMode && activeTarget > 0 && (
          <div className="tasbeeh-counter__progress-wrap">
            <div className="tasbeeh-counter__bar" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <small className="tasbeeh-counter__progress-label">{progress}%</small>
          </div>
        )}
        <div className="tasbeeh-counter__actions">
          <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--minus" onClick={decrement} disabled={count <= 0} aria-label="نقص">−</button>
          <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--primary" onClick={() => increment(1)} aria-label="زيادة">+</button>
          <button type="button" className="tasbeeh-counter__btn" disabled={!canUndo} onClick={undo}>تراجع</button>
          <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--ghost" onClick={reset}>تصفير</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`tasbeeh-counter tasbeeh-counter--pro${pulse ? " tasbeeh-counter--pulse" : ""}`}>
      <div className="tasbeeh-counter__presets" role="group" aria-label="اختيار الهدف">
        {TASBEEH_PRESETS.filter((p) => p.value !== "custom").map((p) => {
          const isActive = p.value === "open" ? isOpenMode : activeTarget === p.value;
          return (
            <button
              key={String(p.value)}
              type="button"
              className={`tasbeeh-counter__preset${isActive ? " is-active" : ""}`}
              onClick={() => setTarget(p.value === "open" ? "open" : Number(p.value))}
            >
              {p.label}
            </button>
          );
        })}
        <label className="tasbeeh-counter__custom-target">
          <span>مخصص</span>
          <input
            type="number"
            min={1}
            value={isOpenMode ? "" : activeTarget}
            placeholder="—"
            onChange={(e) => setTarget(Number(e.target.value))}
            aria-label="هدف مخصص"
          />
        </label>
      </div>

      <div className="tasbeeh-counter__display">
        <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--minus tasbeeh-counter__btn--round" onClick={decrement} disabled={count <= 0} aria-label="نقص واحد">−</button>
        <button
          type="button"
          className="tasbeeh-counter__tap"
          onClick={() => increment(1)}
          aria-label={`زيادة ${label}`}
        >
          <span className="tasbeeh-counter__tap-count">{count}</span>
          <small>
            {isOpenMode
              ? "عداد مفتوح — بدون حد"
              : goalReached
                ? "تجاوزت الهدف — استمر"
                : `الهدف: ${activeTarget}`}
          </small>
        </button>
        <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--plus tasbeeh-counter__btn--round" onClick={() => increment(1)} aria-label="زيادة واحد">+</button>
      </div>

      {!isOpenMode && activeTarget > 0 && (
        <div className="tasbeeh-counter__progress-wrap">
          <div className="tasbeeh-counter__bar" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <small className="tasbeeh-counter__progress-label">نسبة الإنجاز: {progress}%</small>
        </div>
      )}

      <div className="tasbeeh-counter__actions">
        <button type="button" className="tasbeeh-counter__btn" disabled={!canUndo} onClick={undo}>تراجع</button>
        <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--ghost" onClick={reset}>تصفير</button>
      </div>

      {goalReached && (
        <p className="tasbeeh-counter__done">تم الوصول للهدف — بارك الله فيك. يمكنك الاستمرار.</p>
      )}

      {history.length > 0 && (
        <div className="tasbeeh-counter__history">
          <div className="tasbeeh-counter__history-head">
            <strong>آخر الأذكار</strong>
            <button type="button" className="tasbeeh-counter__history-clear" onClick={() => { clearTasbeehHistory(); refreshHistory(); }}>
              مسح
            </button>
          </div>
          <ul>
            {history.slice(0, 5).map((h) => (
              <li key={h.completedAt}>
                <span>{h.phrase}</span>
                <small>{h.count}{h.target > 0 ? ` / ${h.target}` : ""}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TasbeehCounter;
