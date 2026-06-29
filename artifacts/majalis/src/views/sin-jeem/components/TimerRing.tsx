import { C } from "@/lib/theme";
import { SjIcon } from "@/components/sin-jeem/SjIcon";

interface TimerRingProps {
  total: number;
  remaining: number;
  frozen?: boolean;
}

export function TimerRing({ total, remaining, frozen }: TimerRingProps) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 0;
  const offset = circumference * (1 - progress);
  const urgent = remaining <= 5 && remaining > 0;

  return (
    <div className="sj-timer-wrap">
      <div className="sj-timer-ring">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle className="sj-timer-bg" cx="36" cy="36" r={radius} />
          <circle
            className={`sj-timer-fg ${urgent ? "urgent" : ""}`}
            cx="36"
            cy="36"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="sj-timer-text" style={{ color: urgent ? "#dc2626" : C.emeraldDeep }}>
          {frozen ? <SjIcon name="pause" size={18} /> : remaining}
        </div>
      </div>
    </div>
  );
}
