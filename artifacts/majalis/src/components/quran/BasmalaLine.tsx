/**
 * بسملة موحّدة بأسلوب الفاتحة (محارف QPC من صفحة ١).
 * الفرق الوحيد المسموح: ميدالية رقم ١ في الفاتحة فقط.
 */
import { useEffect, type Ref } from "react";
import {
  ensureMushafPageFont,
  mushafPageFontFamily,
} from "@/hooks/useMushafPageFont";

/** محارف بسملة الفاتحة من page-001.json (خط qpc-page-1) */
export const BASMALA_QPC_WORDS = ["ﭑ", "ﭒ", "ﭓ", "ﭔ"] as const;
export const BASMALA_QPC_END = "ﭕ";

export type BasmalaLineProps = {
  /** ميدالية رقم ١ — للفاتحة فقط */
  showNumber?: boolean;
  className?: string;
  lineRef?: Ref<HTMLDivElement>;
  /** ayah = تدخل تحجيم العرض · basmala = خانة مستقلة */
  sizingKind?: "ayah" | "basmala";
};

export function BasmalaLine({
  showNumber = false,
  className = "",
  lineRef,
  sizingKind = "basmala",
}: BasmalaLineProps) {
  useEffect(() => {
    void ensureMushafPageFont(1).catch(() => {});
  }, []);

  const family = mushafPageFontFamily(1);

  return (
    <div
      ref={lineRef}
      className={["mf2-bismillah", showNumber ? "mf2-bismillah--numbered" : "", className]
        .filter(Boolean)
        .join(" ")}
      lang="ar"
      dir="rtl"
      data-sizing-line={sizingKind}
      data-basmala="unified"
      data-basmala-numbered={showNumber ? "1" : "0"}
      style={{ fontFamily: `"${family}"` }}
    >
      <span className="mf2-line__run mf2-bismillah__run">
        {BASMALA_QPC_WORDS.map((glyph, i) => (
          <span key={i} className="mf2-word" data-basmala-word={i + 1}>
            {glyph}
          </span>
        ))}
        {showNumber ? (
          <span
            className="mf2-word mf2-word--ayah-end"
            data-char-type="end"
            data-ayah-numeral="qpc"
            data-basmala-end="1"
          >
            {BASMALA_QPC_END}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export default BasmalaLine;
