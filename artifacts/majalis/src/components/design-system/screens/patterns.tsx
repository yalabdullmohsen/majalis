import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScreenShell, type ScreenShellProps } from "./ScreenShell";
import type { SsScreenColumns, SsScreenDensity } from "@/lib/ssunnah-screen-patterns";

type Base = Omit<ScreenShellProps, "pattern" | "children"> & {
  children?: ReactNode;
  density?: SsScreenDensity;
  /**
   * layout = يضيف هيكل النمط (شبكة/قائمة/…).
   * mark = يغلف فقط بسمة النمط — لشاشات لها تخطيط قائم أثناء التبنّي التدريجي.
   */
  compose?: "layout" | "mark";
};

function wrap(
  compose: "layout" | "mark",
  className: string,
  children: ReactNode,
  attrs?: Record<string, string | number>,
) {
  if (compose === "mark") return <>{children}</>;
  return (
    <div className={className} {...attrs}>
      {children}
    </div>
  );
}

/** شبكة بطاقات أقسام/فئات — أعمدة وكثافة فقط. */
export function GridScreen({
  columns = 2,
  compose = "layout",
  className,
  children,
  ...shell
}: Base & { columns?: SsScreenColumns }) {
  return (
    <ScreenShell pattern="grid" className={className} {...shell}>
      {wrap(
        compose,
        cn("ss-screen-grid", columns === 1 ? "ss-screen-grid--1" : "ss-screen-grid--2"),
        children,
        { "data-ss-screen-columns": columns },
      )}
    </ScreenShell>
  );
}

/** قائمة رأسية لعناصر متتابعة. */
export function ListScreen({ compose = "layout", className, children, ...shell }: Base) {
  return (
    <ScreenShell pattern="list" className={className} {...shell}>
      {wrap(compose, "ss-screen-list", children)}
    </ScreenShell>
  );
}

/** قارئ نص طويل — عرض مريح على نفس الهوية. */
export function ReaderScreen({
  compose = "layout",
  className,
  children,
  density,
  ...shell
}: Base) {
  return (
    <ScreenShell
      pattern="reader"
      className={className}
      density={density ?? "comfortable"}
      {...shell}
    >
      {wrap(compose, "ss-screen-reader", children)}
    </ScreenShell>
  );
}

/**
 * مصحف/متون — يحترم المحرّك والخط الموثّق؛ لا يفرض Typography العام على النص الشرعي.
 */
export function ScriptureScreen({ compose = "layout", className, children, ...shell }: Base) {
  return (
    <ScreenShell pattern="scripture" className={className} {...shell}>
      {wrap(compose, "ss-screen-scripture", children, { "data-ss-scripture-surface": "1" })}
    </ScreenShell>
  );
}

/** مشغّل صوت/فيديو مع بيانات المادة. */
export function PlayerScreen({ compose = "layout", className, children, ...shell }: Base) {
  return (
    <ScreenShell pattern="player" className={className} {...shell}>
      {wrap(compose, "ss-screen-player", children)}
    </ScreenShell>
  );
}

/** تفاصيل عنصر واحد + إجراءات. */
export function DetailScreen({ compose = "layout", className, children, ...shell }: Base) {
  return (
    <ScreenShell pattern="detail" className={className} {...shell}>
      {wrap(compose, "ss-screen-detail", children)}
    </ScreenShell>
  );
}

/** لوحة ملخصات وبطاقات مختلطة. */
export function DashboardScreen({ compose = "layout", className, children, ...shell }: Base) {
  return (
    <ScreenShell pattern="dashboard" className={className} {...shell}>
      {wrap(compose, "ss-screen-dashboard", children)}
    </ScreenShell>
  );
}

/** إعدادات / حساب / أدوات. */
export function UtilityScreen({
  compose = "layout",
  className,
  children,
  density,
  ...shell
}: Base) {
  return (
    <ScreenShell
      pattern="utility"
      className={className}
      density={density ?? "compact"}
      {...shell}
    >
      {wrap(compose, "ss-screen-utility", children)}
    </ScreenShell>
  );
}
