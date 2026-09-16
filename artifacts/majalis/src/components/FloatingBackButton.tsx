/**
 * GlobalBackControlHost — مصدر حقيقة واحد لزر الرجوع العام في سُنّة.
 * يُركَّب مرة واحدة في جذر التطبيق. FLOATING_BACK_DISABLED = لا FAB دائري.
 * شريط مضغوط أعلى يمين (لا يغطي البطاقات/المحتوى السفلي).
 */
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppBackButton } from "@/components/common/AppBackButton";
import {
  computeBackControlTopOffset,
  computeContentTopInsetForBack,
  BACK_CONTROL_SIZE_PX,
} from "@/lib/global-back-layout";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { normalizeNavPath } from "@/lib/navigation-back";

function readCssPx(varName: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function syncBackLayoutVars(host: HTMLElement | null) {
  if (typeof window === "undefined") return;
  const safeTop = readCssPx("--inset-top", 0) || readCssPx("--safe-area-inset-top", 0);
  const top = computeBackControlTopOffset({ safeAreaTop: safeTop });
  const contentPad = computeContentTopInsetForBack({ safeAreaTop: safeTop });
  document.documentElement.style.setProperty("--global-back-top", `${top}px`);
  /* إبقاء المتغيرات السفلية عند صفر — لا حجز مساحة سفلية لزر لم يعد سفليًا */
  document.documentElement.style.setProperty("--global-back-bottom", `0px`);
  document.documentElement.style.setProperty("--global-back-clearance", `0px`);
  document.documentElement.style.setProperty("--global-back-top-clearance", `${contentPad}px`);
  document.documentElement.style.setProperty("--global-back-size", `${BACK_CONTROL_SIZE_PX}px`);
  document.documentElement.setAttribute("data-global-back-host", "1");
  document.documentElement.setAttribute("data-global-back-edge", "top");
  if (host) {
    host.style.top = `${top}px`;
    host.style.bottom = "auto";
  }
}

/** المضيف الوحيد لزر الرجوع العام */
export function GlobalBackControlHost() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const path = normalizeNavPath(location);
  /** الرئيسية + المصحف + إعدادات الأذان (هيدر داخلي) — لا زر يغطي المحتوى */
  const hideOnHome = path === "/";
  const hideOnMushaf = isImmersiveChromePath(path);
  const hideOnAdhanSettings =
    path === "/adhan-settings" || path.startsWith("/adhan-settings/");
  const hideBack = hideOnHome || hideOnMushaf || hideOnAdhanSettings;

  useLayoutEffect(() => {
    if (hideBack) return;
    const sync = () => syncBackLayoutVars(hostRef.current);
    sync();
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-audio-dock", "data-theme"],
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      mo.disconnect();
    };
  }, [hideBack]);

  if (hideBack) return null;

  return (
    <div
      ref={hostRef}
      className="global-back-control-host"
      data-global-back-control-host="1"
      data-testid="global-back-control-host"
      data-edge="top"
    >
      <AppBackButton
        variant="bar"
        autoHideFloating={false}
        label="رجوع"
        aria-label="رجوع"
        className="global-back-control-host__btn"
      />
    </div>
  );
}

/** توافق مع الاسم السابق */
export function FloatingBackButton() {
  return <GlobalBackControlHost />;
}

export { FloatingBackButton as GlobalBackButton };
export { AppBackButton } from "@/components/common/AppBackButton";

export const FLOATING_BACK_DISABLED = true as const;
export const FIXED_BACK_BAR_ENABLED = true as const;
export const GLOBAL_BACK_CONTROL_HOST = true as const;
