/**
 * MushafAyahMarker — مكوّن علامة الآية الوحيد (Accent عبر Tokens فقط).
 * بلا Opening/Green/Gold variants منفصلة · بلا transform:scale · بلا Hex.
 * الشكل: وردة 8 بتلات ناعمة عبر CSS clip-path (لا SVG منفصل).
 */
import { memo, type ReactNode } from "react";

type Props = {
  /** محرف رقم الآية من بيانات المصحف (QPC) — لا رقم مكتوب يدويًا */
  glyph: ReactNode;
  className?: string;
};

export const MushafAyahMarker = memo(function MushafAyahMarker({
  glyph,
  className = "",
}: Props) {
  return (
    <span
      className={["nm-ayah-mark", className].filter(Boolean).join(" ")}
      data-component="MushafAyahMarker"
      data-marker="ayah-rosette-v2"
      aria-hidden="true"
    >
      <span className="nm-ayah-mark__glyph">{glyph}</span>
    </span>
  );
});
