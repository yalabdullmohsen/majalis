/**
 * غلاف شاشة موحّد — يثبت الهوية (tokens/حالات) ويسمح بتنويع التخطيط عبر النمط والكثافة.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/mj";
import { BodyText } from "@/components/design-system/text";
import type { SsScreenDensity, SsScreenPattern } from "@/lib/ssunnah-screen-patterns";

export type ScreenShellStatus = "ready" | "loading" | "empty" | "error";

export type ScreenShellProps = {
  pattern: SsScreenPattern;
  density?: SsScreenDensity;
  status?: ScreenShellStatus;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  children?: ReactNode;
};

export function ScreenShell({
  pattern,
  density = "regular",
  status = "ready",
  onRetry,
  emptyTitle = "لا محتوى حالياً",
  emptyDescription,
  className,
  children,
}: ScreenShellProps) {
  return (
    <div
      className={cn(
        "ss-screen",
        `ss-screen--${pattern}`,
        `ss-screen--density-${density}`,
        className,
      )}
      data-ss-screen-pattern={pattern}
      data-ss-screen-density={density}
      dir="rtl"
    >
      {status === "loading" ? (
        <div className="ss-screen__state" aria-busy="true">
          <div className="ss-screen__skeleton" />
          <div className="ss-screen__skeleton ss-screen__skeleton--short" />
          <div className="ss-screen__skeleton" />
        </div>
      ) : null}
      {status === "empty" ? (
        <div className="ss-screen__state">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : null}
      {status === "error" ? (
        <div className="ss-screen__state" role="alert">
          <BodyText>
            {typeof navigator !== "undefined" && navigator.onLine === false
              ? "أنت غير متصل بالإنترنت. اتصل بالشبكة ثم أعد المحاولة."
              : "تعذّر تحميل المحتوى مؤقتًا. أعد المحاولة بعد لحظات."}
          </BodyText>
          {onRetry ? (
            <button type="button" className="ss-screen__retry mj-pressable" onClick={onRetry}>
              إعادة المحاولة
            </button>
          ) : null}
        </div>
      ) : null}
      {status === "ready" ? children : null}
    </div>
  );
}
