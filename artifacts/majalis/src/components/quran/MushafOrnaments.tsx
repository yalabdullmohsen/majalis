/**
 * زخارف مصحف أصلية (SVG) — رسم أصلي للمجلس العلمي (لا يُستخرج من تطبيق آخر).
 * شارة السورة المزخرفة: انظر SurahBanner.tsx
 * انظر CREDITS.md و RELEASE_READINESS.md (بند QCF_BSML المؤجّل).
 */
import { useId } from "react";

/**
 * @deprecated استخدم SurahBanner — يُبقى للتوافق مع مسارات الاختبار القديمة.
 * شارة سورة بسيطة: شريط بيج فاتح + إطار ذهبي رفيع.
 */
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

/** ميدالية رقم آية — قرص ذهبي بثماني بتلات + حشو لوحة */
export function MushafAyahMarkerSvg({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const petals: string[] = [];
  const cx = 20;
  const cy = 20;
  const r = 17.2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const c1x = cx + Math.cos(a - 0.28) * (r * 0.62);
    const c1y = cy + Math.sin(a - 0.28) * (r * 0.62);
    const c2x = cx + Math.cos(a + 0.28) * (r * 0.62);
    const c2y = cy + Math.sin(a + 0.28) * (r * 0.62);
    petals.push(
      `M${cx} ${cy} Q${c1x.toFixed(2)} ${c1y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} Q${c2x.toFixed(2)} ${c2y.toFixed(2)} ${cx} ${cy}`,
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-ay`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold-strong, #A67C3D)" />
        </linearGradient>
      </defs>
      <path
        d={petals.join(" ")}
        fill={`url(#${uid}-ay)`}
        stroke="var(--color-mushaf-gold-strong, #A67C3D)"
        strokeWidth="0.6"
      />
      <circle
        cx="20"
        cy="20"
        r="11.6"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke="var(--color-mushaf-gold-strong, #A67C3D)"
        strokeWidth="1.1"
      />
      <circle
        cx="20"
        cy="20"
        r="9.4"
        fill="none"
        stroke="var(--color-mushaf-gold-soft, #C9B07A)"
        strokeWidth="0.45"
        opacity="0.55"
      />
    </svg>
  );
}

/** خرطوش رقم الصفحة — بيضاوي بإطار ذهبي وحلية في كل طرف */
export function MushafPageCartoucheSvg({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 168 44"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-pg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold-strong, #A67C3D)" />
        </linearGradient>
      </defs>
      <ellipse
        cx="84"
        cy="22"
        rx="54"
        ry="15"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="1.1"
      />
      <ellipse
        cx="84"
        cy="22"
        rx="48"
        ry="11.5"
        fill="none"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.45"
        opacity="0.45"
      />
      <g fill="none" stroke={`url(#${uid}-pg)`} strokeWidth="0.9">
        <circle cx="16" cy="22" r="4.4" />
        <circle cx="16" cy="22" r="1.9" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.5" />
        <path d="M21.5 22 C27 14.5 33 16.5 37.5 22 C33 27.5 27 29.5 21.5 22Z" />
        <circle cx="152" cy="22" r="4.4" />
        <circle cx="152" cy="22" r="1.9" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.5" />
        <path d="M146.5 22 C141 14.5 135 16.5 130.5 22 C135 27.5 141 29.5 146.5 22Z" />
      </g>
    </svg>
  );
}
