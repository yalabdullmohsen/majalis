import { useTasbeehCounter } from "@/hooks/useTasbeehCounter";

type Props = {
  storageId: string;
  target: number;
};

const RING_SIZE = 44;
const STROKE = 3;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AdhkarMinimalCounter({ storageId, target }: Props) {
  const {
    count,
    target: activeTarget,
    progress,
    goalReached,
    pulse,
    increment,
    undo,
    canUndo,
  } = useTasbeehCounter({ storageId, initialTarget: target });

  const safeTarget = activeTarget > 0 ? activeTarget : 1;
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div
      className={`adhkar-min-counter${pulse ? " adhkar-min-counter--pulse" : ""}${goalReached ? " adhkar-min-counter--done" : ""}`}
      role="group"
      aria-label="عداد الذكر"
    >
      <button
        type="button"
        className="adhkar-min-counter__btn adhkar-min-counter__btn--minus"
        onClick={undo}
        disabled={!canUndo}
        aria-label="تقليل العداد"
      >
        −
      </button>

      <div className="adhkar-min-counter__ring-wrap" aria-live="polite">
        <svg
          className="adhkar-min-counter__ring"
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          aria-hidden="true"
        >
          <circle
            className="adhkar-min-counter__ring-track"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
          />
          <circle
            className="adhkar-min-counter__ring-progress"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </svg>
        <span className="adhkar-min-counter__value">
          {count}
          {activeTarget > 0 && (
            <small className="adhkar-min-counter__target">/{safeTarget}</small>
          )}
        </span>
      </div>

      <button
        type="button"
        className="adhkar-min-counter__btn adhkar-min-counter__btn--plus"
        onClick={() => increment(1)}
        aria-label="زيادة العداد"
      >
        +
      </button>

      {goalReached && (
        <span className="adhkar-min-counter__badge" aria-hidden="true">
          ✓
        </span>
      )}
    </div>
  );
}

export default AdhkarMinimalCounter;
