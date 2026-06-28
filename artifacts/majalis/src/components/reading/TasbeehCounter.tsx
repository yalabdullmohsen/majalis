import { useTasbeehCounter } from "@/hooks/useTasbeehCounter";
import { TASBEEH_PRESETS, type TasbeehWird } from "@/lib/tasbeeh-storage";

type Props = {
  storageId: string;
  target: number;
  label?: string;
  compact?: boolean;
  wird?: TasbeehWird;
  onWirdChange?: (next: TasbeehWird) => void;
};

export function TasbeehCounter({ storageId, target, label = "عداد التسبيح", compact = false, wird, onWirdChange }: Props) {
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

  if (compact) {
    return (
      <div className={`tasbeeh-counter tasbeeh-counter--compact${pulse ? " tasbeeh-counter--pulse" : ""}`}>
        <div className="tasbeeh-counter__head">
          <span>{label}</span>
          <strong>{count}{activeTarget > 0 ? ` / ${activeTarget}` : ""}</strong>
        </div>
        {activeTarget > 0 && (
          <div className="tasbeeh-counter__bar" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="tasbeeh-counter__actions">
          <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--primary" onClick={() => increment(1)}>
            +1
          </button>
          <button type="button" className="tasbeeh-counter__btn" disabled={!canUndo} onClick={undo}>تراجع</button>
          <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--ghost" onClick={reset}>تصفير</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`tasbeeh-counter tasbeeh-counter--pro${pulse ? " tasbeeh-counter--pulse" : ""}`}>
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

      <button
        type="button"
        className="tasbeeh-counter__tap"
        onClick={() => increment(1)}
        aria-label={`زيادة ${label}`}
      >
        <span className="tasbeeh-counter__tap-count">{count}</span>
        <small>{goalReached ? "تجاوزت الهدف — استمر" : "اضغط للتسبيح"}</small>
      </button>

      {activeTarget > 0 && (
        <div className="tasbeeh-counter__bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="tasbeeh-counter__actions">
        <button type="button" className="tasbeeh-counter__btn" disabled={!canUndo} onClick={undo}>تراجع</button>
        <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--ghost" onClick={reset}>تصفير</button>
      </div>

      {goalReached && (
        <p className="tasbeeh-counter__done">تم الوصول للهدف — بارك الله فيك. يمكنك الاستمرار.</p>
      )}
    </div>
  );
}

export default TasbeehCounter;
