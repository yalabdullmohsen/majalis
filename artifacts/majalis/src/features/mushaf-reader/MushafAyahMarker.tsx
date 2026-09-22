/**
 * MushafAyahMarker — مكوّن علامة الآية الوحيد (Accent عبر Tokens فقط).
 * بلا Opening/Green/Gold variants منفصلة · بلا transform:scale.
 */
import { memo, type ReactNode } from "react";

type Props = {
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
      aria-hidden="true"
    >
      <span className="nm-ayah-mark__glyph">{glyph}</span>
    </span>
  );
});
