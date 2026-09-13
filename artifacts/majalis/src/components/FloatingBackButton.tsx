/**
 * GlobalBackControlHost — مصدر حقيقة واحد لزر الرجوع العام في سُنّة.
 * يُركَّب مرة واحدة في جذر التطبيق. FLOATING_BACK_DISABLED = لا FAB دائري.
 * الشريط ثابت على كل الشاشات/الأقسام (ما عدا الرئيسية) — أسفل يمين بما فيها /profile.
 */
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppBackButton } from "@/components/common/AppBackButton";
import {
  computeBackControlBottomOffset,
  computeContentBottomInsetForBack,
  BACK_CONTROL_SIZE_PX,
} from "@/lib/global-back-layout";
import { normalizeNavPath } from "@/lib/navigation-back";

function readCssPx(varName: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function syncBackLayoutVars(host: HTMLElement | null) {
  if (typeof window === "undefined") return;
  const safeBottom = readCssPx("--inset-bottom", 0) || readCssPx("--safe-area-inset-bottom", 0);
  const bottomNav = readCssPx("--bottom-nav-height", 64);
  const miniPlayer =
    document.documentElement.classList.contains("audio-dock-open") ||
    document.documentElement.getAttribute("data-audio-dock") === "1"
      ? readCssPx("--audio-dock-h", 72)
      : 0;
  const keyboard = readCssPx("--keyboard-inset", 0);
  const sheet = document.body.classList.contains("filter-sheet-open")
    ? Math.min(window.innerHeight * 0.45, 360)
    : 0;
  const insets = {
    safeAreaBottom: safeBottom,
    bottomNavigationHeight: bottomNav,
    miniPlayerHeight: miniPlayer,
    keyboardHeight: keyboard,
    activeSheetHeight: sheet,
  };
  const bottom = computeBackControlBottomOffset(insets);
  const contentPad = computeContentBottomInsetForBack(insets);
  document.documentElement.style.setProperty("--global-back-bottom", `${bottom}px`);
  document.documentElement.style.setProperty("--global-back-clearance", `${contentPad}px`);
  document.documentElement.style.setProperty("--global-back-size", `${BACK_CONTROL_SIZE_PX}px`);
  document.documentElement.setAttribute("data-global-back-host", "1");
  if (host) host.style.bottom = `${bottom}px`;
}

/** المضيف الوحيد لزر الرجوع العام */
export function GlobalBackControlHost() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const path = normalizeNavPath(location);
  /** الرئيسية فقط — لا نخفي على /profile أو الإعدادات أو أقسام اللوبي */
  const hideOnHome = path === "/";

  useLayoutEffect(() => {
    if (hideOnHome) return;
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
  }, [hideOnHome]);

  if (hideOnHome) return null;

  return (
    <div
      ref={hostRef}
      className="global-back-control-host"
      data-global-back-control-host="1"
      data-testid="global-back-control-host"
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

