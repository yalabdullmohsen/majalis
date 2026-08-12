/**
 * شارة سورة بسيطة: اسم مركزي + خطّان رفيعان ذهبيان باهتان.
 * بلا إطار ولا نقش ولا ظل — ارتفاع خانة سطر واحدة.
 */
import type { CSSProperties } from "react";
import { MUSHAF_TYPESCALE } from "@/features/mushaf/typescale";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

const GOLD_FAINT =
  "color-mix(in srgb, var(--color-mushaf-gold-strong, #A67C3D) 35%, transparent)";

export function SurahBanner({ label, className, titleRef, style }: Props) {
  const aria = label.replace(/^سُورَةُ\s+/u, "").trim() || label;

  return (
    <div
      className={className ? `mf2-surah-banner mf2-surah-banner--minimal ${className}` : "mf2-surah-banner mf2-surah-banner--minimal"}
      role="heading"
      aria-level={2}
      aria-label={`سورة ${aria}`}
      style={style}
      data-ornament="none"
      data-banner-style="minimal-rule"
    >
      <span className="mf2-surah-banner__rule" aria-hidden="true" style={{ background: GOLD_FAINT }} />
      <span
        className="mf2-surah-banner__name mf2-surah-header__name"
        data-sizing-line="surah_title"
        lang="ar"
        dir="rtl"
        ref={titleRef}
        style={{ fontSize: `${MUSHAF_TYPESCALE.surahBannerName}em` }}
      >
        {label}
      </span>
      <span className="mf2-surah-banner__rule" aria-hidden="true" style={{ background: GOLD_FAINT }} />
    </div>
  );
}

export default SurahBanner;
