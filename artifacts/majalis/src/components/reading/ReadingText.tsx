import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Uses global reading prefs from /settings via CSS variables on html */
export function ReadingText({ children, className = "" }: Props) {
  return <div className={`reading-text ${className}`.trim()}>{children}</div>;
}
