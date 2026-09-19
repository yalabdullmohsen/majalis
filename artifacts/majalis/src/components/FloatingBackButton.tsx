/**
 * GlobalBackControlHost — مصدر حقيقة واحد لزر الرجوع العام في سُنّة.
 * يُركَّب مرة واحدة في جذر التطبيق.
 * FLOATING_BACK_DISABLED = لا FAB دائري علوي قديم.
 * UNIFIED_BACK_FAB = زر رجوع موحّد أسفل يمين (فوق Bottom Nav) ظاهر دائمًا خارج الرئيسية/المصحف.
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppBackButton } from "@/components/common/AppBackButton";
import {
  BACK_CONTROL_SIZE_PX,
  computeBackControlBottomOffset,
  computeContentBottomInsetForBack,
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
  const safeBottom =
    readCssPx("--inset-bottom", 0) || readCssPx("--safe-area-inset-bottom", 0);
  const bottomNav =
    readCssPx("--bottom-nav-height", 64) ||
    readCssPx("--bottom-nav-h", 64) ||
    64;
  const miniPlayer =
    document.documentElement.getAttribute("data-quran-mini-player") === "mini" ||
    document.documentElement.getAttribute("data-quran-mini-player") === "expanded" ||
    document.documentElement.classList.contains("audio-dock-open") ||
    document.documentElement.getAttribute("data-audio-dock") === "1"
      ? readCssPx("--quran-mini-player-offset", 0) ||
        readCssPx("--audio-dock-h", 72) ||
        52
      : readCssPx("--quran-mini-player-offset", 0);
  const insets = {
    safeAreaBottom: safeBottom,
    bottomNavigationHeight: bottomNav,
    miniPlayerHeight: Math.max(0, miniPlayer),
    keyboardHeight: 0,
    activeSheetHeight: document.body.classList.contains("filter-sheet-open") ? 120 : 0,
  };
  const bottom = computeBackControlBottomOffset(insets);
  const clearance = computeContentBottomInsetForBack(insets);
  document.documentElement.style.setProperty("--global-back-bottom", `${bottom}px`);
  document.documentElement.style.setProperty("--global-back-clearance", `${clearance}px`);
  document.documentElement.style.setProperty("--global-back-top", `0px`);
  document.documentElement.style.setProperty("--global-back-top-clearance", `0px`);
  document.documentElement.style.setProperty("--global-back-size", `${BACK_CONTROL_SIZE_PX}px`);
  document.documentElement.setAttribute("data-global-back-host", "1");
  document.documentElement.setAttribute("data-global-back-edge", "bottom");
  document.documentElement.setAttribute("data-global-back-visible", "1");
  if (host) {
    host.style.bottom = `${bottom}px`;
    host.style.top = "auto";
  }
}

/** المضيف الوحيد لزر الرجوع العام — أسفل يمين ظاهر دائمًا */
export function GlobalBackControlHost() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const path = normalizeNavPath(location);
  const hideOnHome = path === "/";
  const hideOnMushaf = isImmersiveChromePath(path);
  const hideOnAdhanSettings =
    path === "/adhan-settings" || path.startsWith("/adhan-settings/");
  const hideBack = hideOnHome || hideOnMushaf || hideOnAdhanSettings;

  useLayoutEffect(() => {
    if (hideBack) {
      document.documentElement.style.setProperty("--global-back-clearance", `0px`);
      document.documentElement.removeAttribute("data-global-back-visible");
      return;
    }
    const sync = () => syncBackLayoutVars(hostRef.current);
    sync();
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-audio-dock", "data-quran-mini-player", "data-theme"],
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      mo.disconnect();
    };
  }, [hideBack]);

  useEffect(() => {
    if (hideBack) {
      document.documentElement.removeAttribute("data-global-back-visible");
      return;
    }
    document.documentElement.setAttribute("data-global-back-visible", "1");
  }, [hideBack, path]);

  if (hideBack) return null;

  return (
    <div
      ref={hostRef}
      className="global-back-control-host"
      data-global-back-control-host="1"
      data-testid="global-back-control-host"
      data-edge="bottom"
      data-visible="1"
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

/** الدائري العلوي القديم معطّل — البديل: Back FAB سفلي موحّد */
export const FLOATING_BACK_DISABLED = true as const;
export const FIXED_BACK_BAR_ENABLED = true as const;
export const UNIFIED_BACK_FAB_ENABLED = true as const;
export const GLOBAL_BACK_CONTROL_HOST = true as const;
