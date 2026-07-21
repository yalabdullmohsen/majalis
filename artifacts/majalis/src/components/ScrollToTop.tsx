import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useReadingProgress } from "@/hooks/useReadingProgress";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const progress = useReadingProgress();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const R = 18;
  const C = 2 * Math.PI * R;
  const offset = C - (progress / 100) * C;

  return (
    <button
      type="button"
      className="scroll-to-top"
      aria-label={`العودة إلى الأعلى — ${progress}%`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      {progress > 3 && (
        <svg className="stt-ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle
            cx="22" cy="22" r={R}
            fill="none"
            stroke="rgba(255,255,255,0.80)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90 22 22)"
          />
        </svg>
      )}
      <ChevronUp size={17} strokeWidth={2.4} aria-hidden="true" className="stt-icon" />
    </button>
  );
}
