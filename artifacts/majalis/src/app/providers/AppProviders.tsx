import type { ReactNode } from "react";

/**
 * مزوّد جامع مستهدف.
 * QueryClientProvider مركَّب فعليًا في main.tsx عبر createAppQueryClient —
 * هذا المكوّن يبقى نقطة تركيب مستقبلية (Auth/Toast) بلا أثر مرئي إضافي.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
