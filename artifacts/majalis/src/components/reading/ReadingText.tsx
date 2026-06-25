import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  fontSize?: number;
  readingMode?: boolean;
  className?: string;
};

export function ReadingText({ children, fontSize = 100, readingMode = false, className = "" }: Props) {
  return (
    <div
      className={`reading-text${readingMode ? " reading-text--mode" : ""} ${className}`.trim()}
      style={{ fontSize: `${fontSize / 100}rem` }}
    >
      {children}
    </div>
  );
}
