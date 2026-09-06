import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useReadingProgress } from "@/hooks/useReadingProgress";

/** زر صعود دائري 56×56 مع حلقة تقدّم داخل الحدود تمامًا. */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const progress = useReadingProgress();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const SIZE = 56;
  const STROKE = 2.5;
  const PAD = 3;
  const R = SIZE / 2 - PAD - STROKE / 2;
  const C = 2 * Math.PI * R;
  const offset = C - (progress / 100) * C;
  const CX = SIZE / 2;

  return (
    <button
      type="button"
      className="scroll-to-top"
      aria-label={`العودة إلى الأعلى — ${progress}%`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      {progress > 3 ? (
        <svg className="stt-ring" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle
            cx={CX}
            cy={CX}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={STROKE}
          />
          <circle
            cx={CX}
            cy={CX}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${CX} ${CX})`}
          />
        </svg>
      ) : null}
      <ChevronUp size={20} strokeWidth={2.4} aria-hidden="true" className="stt-icon" />
    </button>
  );
}
