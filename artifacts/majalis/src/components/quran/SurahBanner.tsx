/**
 * شارة سورة رسمية (١٢ أغسطس ٢٠٢٦): شريط أفقي واحد بلا زخارف.
 * خلفية عاجية · إطار ذهبي 1px · نصف قطر 3px · اسم السورة في الوسط بخط الصفحة.
 */
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { MUSHAF_TYPESCALE } from "@/features/mushaf/typescale";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

const NAME_MARGIN_PX = 8;

export function SurahBanner({ label, className, titleRef, style }: Props) {
  const aria = label.replace(/^(?:سُورَةُ|سورة)\s*/u, "").trim() || label;
  const nameRef = useRef<HTMLSpanElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const nameEl = nameRef.current;
    const root = rootRef.current;
    if (!nameEl || !root) return;

    const fit = () => {
      const maxW = Math.max(24, root.clientWidth - NAME_MARGIN_PX * 2);
      let sizeEm = MUSHAF_TYPESCALE.surahBannerName;
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
      data-ornament="simple-strip"
    >
      <div className="mf2-surah-banner__bar" aria-hidden="true" />
      <span
        className="mf2-surah-banner__name mf2-surah-header__name"
        data-sizing-line="surah_title"
        lang="ar"
        dir="rtl"
        ref={setNameRef}
        style={{ fontSize: `${MUSHAF_TYPESCALE.surahBannerName}em` }}
      >
        {label}
      </span>
    </div>
  );
}

export default SurahBanner;
