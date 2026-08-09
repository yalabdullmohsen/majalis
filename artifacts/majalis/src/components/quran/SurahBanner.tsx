/**
 * شارة سورة بعرض كامل — إطار ذهبي مزدوج + جناحان بلون تان صلب + لوحة وسطى مستطيلة.
 * البديل الصلب معتمد صراحةً (أفضل من نقش ركيك). الاسم يُصغَّر تلقائيًا داخل اللوحة.
 */
import { useLayoutEffect, useRef, type CSSProperties } from "react";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

const PANEL_MARGIN_PX = 6;

export function SurahBanner({ label, className, titleRef, style }: Props) {
  const aria = label.replace(/^(?:سُورَةُ|سورة)\s*/u, "").trim() || label;
  const nameRef = useRef<HTMLSpanElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const nameEl = nameRef.current;
    const root = rootRef.current;
    if (!nameEl || !root) return;

    const fit = () => {
      const panelW = root.clientWidth * 0.32;
      const maxW = Math.max(24, panelW - PANEL_MARGIN_PX * 2);
      nameEl.style.fontSize = "";
      let sizeEm = 0.85;
      nameEl.style.fontSize = `${sizeEm}em`;
      for (let i = 0; i < 24; i++) {
        if (nameEl.scrollWidth <= maxW) break;
        sizeEm *= 0.92;
        nameEl.style.fontSize = `${sizeEm}em`;
      }
    };

    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(root);
    return () => ro?.disconnect();
  }, [label]);

  const W = 320;
  const H = 48;
  const wingW = W * 0.34;
  const panelW = W * 0.32;
  const panelX = (W - panelW) / 2;
  const panelY = 8;
  const panelH = H - 16;

  const setNameRef = (el: HTMLSpanElement | null) => {
    nameRef.current = el;
    titleRef?.(el);
  };

  return (
    <div
      ref={rootRef}
      className={className ? `mf2-surah-banner ${className}` : "mf2-surah-banner"}
      role="heading"
      aria-level={2}
      aria-label={`سورة ${aria}`}
      style={style}
      data-ornament="solid"
    >
      <svg
        className="mf2-surah-banner__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* إطار مزدوج */}
        <rect
          x="1"
          y="1"
          width={W - 2}
          height={H - 2}
          rx="4"
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="2"
        />
        <rect
          x="5"
          y="5"
          width={W - 10}
          height={H - 10}
          rx="2.5"
          fill="none"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1"
        />
        {/* جناحان تان صلب — بلا نقش بيضاوي/نجمي */}
        <rect
          x="6"
          y="6"
          width={wingW - 4}
          height={H - 12}
          rx="2"
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
        />
        <rect
          x={W - wingW - 2}
          y="6"
          width={wingW - 4}
          height={H - 12}
          rx="2"
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
        />
        {/* لوحة وسطى مستطيلة قائمة الزوايا */}
        <rect
          x={panelX}
          y={panelY}
          width={panelW}
          height={panelH}
          rx="3"
          fill="var(--color-mushaf-panel, #FAF3E8)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="mf2-surah-banner__name mf2-surah-header__name"
        data-sizing-line="surah_title"
        lang="ar"
        dir="rtl"
        ref={setNameRef}
      >
        {label}
      </span>
    </div>
  );
}
