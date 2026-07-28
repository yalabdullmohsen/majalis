/**
 * Web port of Flutter `QuranReaderPage` scaffold:
 * immersive sticky System UI · parchment cream · SafeArea padding · Uthmani type.
 *
 * Shell only — children supply ayah/mushaf content (loose coupling).
 */
import type { CSSProperties, ReactNode } from "react";
import { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";
import {
  IMMERSIVE_INK,
  IMMERSIVE_PAPER_BG,
  immersiveReaderCssVars,
} from "@/lib/quran-immersive";
import "@/styles/quran-immersive-reader.css";

export type QuranReaderPageProps = {
  children?: ReactNode;
  className?: string;
  /** Override paper (default Flutter `#F5F5DC`). */
  paperBg?: string;
  /** Override ink (default `Colors.black87`). */
  ink?: string;
  /** Demo / comfort size — default 28; prefs may drive caller content. */
  fontSize?: number;
  /** When false, skip System UI hide (nested under another immersive shell). */
  immersive?: boolean;
};

/**
 * Flutter:
 * ```dart
 * Scaffold(
 *   backgroundColor: Color(0xFFF5F5DC),
 *   body: SafeArea(child: Padding(... Text(UthmaniFont)...)),
 * )
 * ```
 */
export function QuranReaderPage({
  children,
  className,
  paperBg = IMMERSIVE_PAPER_BG,
  ink = IMMERSIVE_INK,
  fontSize,
  immersive = true,
}: QuranReaderPageProps) {
  useImmersiveSystemUi(immersive, paperBg);

  const style = {
    ...immersiveReaderCssVars({ fontSize, paperBg, ink }),
    backgroundColor: paperBg,
    color: ink,
  } as CSSProperties;

  return (
    <div
      className={`quran-reader-page${className ? ` ${className}` : ""}`}
      dir="rtl"
      style={style}
      data-immersive={immersive ? "1" : "0"}
    >
      <div className="quran-reader-page__safe">
        <div className="quran-reader-page__pad">{children}</div>
      </div>
    </div>
  );
}

export default QuranReaderPage;
