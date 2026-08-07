import type { ReactNode } from "react";

/**
 * مزوّد جامع مستهدف (Theme + Query + Auth + Toast).
 * لا يُركَّب في main.tsx حتى تكتمل حزم C/E — حالياً passthrough بلا أثر مرئي.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
