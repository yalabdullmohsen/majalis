/**
 * بسملة زخرفية (غير آية) — محارف code_v2 من page-001.json مع خط qpc-page-1.
 * الفاتحة ١:١ تُرسم من كلمات الصفحة في MushafPageV2 — لا عبر هذا المكوّن.
 *
 * مهم: الرمز الأول يجب أن يكون U+FC41 (كما في بيانات الصفحة)، لا U+FEA7
 * (شكل حاء عرضي) الذي يظهر كحرف/رمز غريب قبل «بسم الله» مع خط QPC.
 */
import { useEffect, type Ref } from "react";
import {
  ensureMushafPageFont,
  mushafPageFontFamily,
} from "@/hooks/useMushafPageFont";

/** code_v2 لبسملة ١:١ من page-001.json — يطابق خط qpc-v2/p1.woff2 */
export const BASMALA_QPC_WORDS = [
  String.fromCodePoint(0xfc41),
  String.fromCodePoint(0xfc42),
  String.fromCodePoint(0xfc43),
  String.fromCodePoint(0xfc44),
] as const;
/** نهاية الآية في ١:١ — U+FC45 (ليست ASCII) */
export const BASMALA_QPC_END = String.fromCodePoint(0xfc45);

export type BasmalaLineProps = {
  /** ميدالية رقم ١ — نادر للزخرفة؛ الفاتحة من كلمات الصفحة */
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
  const fontStyle = { fontFamily: `"${family}"` } as const;

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
      data-basmala-encoding="code_v2"
      data-basmala-codepoints="fc41-fc44"
      style={fontStyle}
    >
      <span className="mf2-line__run mf2-bismillah__run" style={fontStyle}>
        {BASMALA_QPC_WORDS.map((glyph, i) => (
          <span key={i} className="mf2-word" data-basmala-word={i + 1} style={fontStyle}>
            {glyph}
          </span>
        ))}
        {showNumber ? (
          <span
            className="mf2-word mf2-word--ayah-end"
            data-char-type="end"
            data-ayah-numeral="qpc"
            data-basmala-end="1"
            style={fontStyle}
          >
            {BASMALA_QPC_END}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export default BasmalaLine;
