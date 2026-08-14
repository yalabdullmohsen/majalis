/**
 * مؤشر تقدّم صفحة المصحف — شريط جانبي خفيف يظهر عند تغيير الصفحة ثم يختفي.
 * لا يغطي النص: على الحافة الداخلية (inline-start في RTL = يمين الشاشة بصريًا للظهر؟)
 * في RTL: inline-end = يسار الشاشة — نضعه على inline-end بعيدًا عن عمود النص المركزي قليلًا.
 */
import { useEffect, useState } from "react";
import { toArabicDigits } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  /** يُحدَّث عند التقليب لإعادة إظهار المؤشر */
  pulseKey?: number | string;
  visible?: boolean;
  onJump?: () => void;
};

export function MushafPageProgressRail({
  page,
  totalPages,
  pulseKey,
  visible = true,
  onJump,
}: Props) {
  const [shown, setShown] = useState(true);
  const pct = Math.max(0, Math.min(1, page / Math.max(1, totalPages)));

  useEffect(() => {
    setShown(true);
    const t = window.setTimeout(() => setShown(false), 1800);
    return () => window.clearTimeout(t);
  }, [page, pulseKey]);

  if (!visible) return null;

  return (
    <div
      className={`mpv-page-rail${shown ? " mpv-page-rail--shown" : ""}`}
      data-page-rail="1"
      aria-hidden={shown ? undefined : true}
    >
      <button
        type="button"
        className="mpv-page-rail__track"
        onClick={onJump}
        aria-label={`الصفحة ${toArabicDigits(page)} من ${toArabicDigits(totalPages)} — انتقال`}
      >
        <span className="mpv-page-rail__fill" style={{ height: `${pct * 100}%` }} />
        <span className="mpv-page-rail__thumb" style={{ bottom: `${pct * 100}%` }} />
      </button>
      <span className="mpv-page-rail__label">
        {toArabicDigits(page)}
      </span>
    </div>
  );
}

export default MushafPageProgressRail;
