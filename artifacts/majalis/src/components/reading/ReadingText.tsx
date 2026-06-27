import type { CSSProperties, ReactNode } from "react";
import { useReadingStyles } from "@/hooks/useReadingStyles";

type Props = {
  children: ReactNode;
  /** @deprecated Use Settings → إعدادات القراءة instead */
  fontSize?: number;
  readingMode?: boolean;
  className?: string;
};

export function ReadingText({ children, fontSize, readingMode = false, className = "" }: Props) {
  const styles = useReadingStyles();

  const inlineStyle: CSSProperties =
    fontSize != null
      ? { fontSize: `${fontSize / 100}rem`, lineHeight: styles.lineHeight }
      : { fontSize: styles.fontSize, lineHeight: styles.lineHeight };

  return (
    <div
      className={`reading-text${readingMode ? " reading-text--mode" : ""}${styles.quietMode ? " reading-text--quiet" : ""} ${className}`.trim()}
      style={inlineStyle}
      data-font={styles.fontFamily}
    >
      {children}
    </div>
  );
}
