/**
 * زخارف مصحف بسيطة — بلا أرابيسك.
 * دقة QPC: رقم الآية من مجسم الخط. هذا الملف لمسار Unicode فقط + رقم الصفحة.
 */
import { useId } from "react";

/** @deprecated الشارة الحية: SurahBanner — يُبقى للتوافق مع اختبارات قديمة. */
export function MushafSurahBadgeFrame({ className }: { className?: string }) {
  return (
    <div
      className={className ? `mf2-surah-badge ${className}` : "mf2-surah-badge"}
      aria-hidden="true"
    >
      <div className="mf2-surah-badge__bar" />
    </div>
  );
}

/**
 * ميدالية آية بسيطة: دائرة رفيعة 1px ذهبية باهتة + رقم عربي في المركز.
 * ممنوع ميدالية بلا رقم — الرقم يُمرَّر من المكوّن الأب.
 */
export function MushafAyahMarkerSvg({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-ayah-medal="minimal"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke={`color-mix(in srgb, var(--color-mushaf-gold-strong, #A67C3D) 55%, transparent)`}
        strokeWidth="1"
        id={`${uid}-ring`}
      />
    </svg>
  );
}

/** رقم صفحة بسيط — بلا خرطوش مزخرف (يُعرض النص بجانبه من الأب). */
export function MushafPageCartoucheSvg({ className }: { className?: string }) {
  return (
    <span
      className={className}
      aria-hidden="true"
      data-page-chrome="minimal"
      style={{ display: "none" }}
    />
  );
}
