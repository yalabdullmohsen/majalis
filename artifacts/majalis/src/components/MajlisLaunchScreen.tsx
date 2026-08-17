/**
 * MajlisLaunchScreen — دخولية افتتاحية يومية قصيرة (ليست Onboarding).
 * ١٫٢–١٫٨ث · تخطّي باللمس/السحب · لا تغيّر المسار (الروابط المباشرة تبقى كما هي).
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { hideAppSplash } from "@/lib/splash-screen";
import {
  LAUNCH_ENTER_MS,
  LAUNCH_EXIT_MS,
  LAUNCH_MAX_MS,
  LAUNCH_TAGLINE,
  canDismissLaunch,
} from "@/lib/launch-intro";
import {
  bootstrapLaunchReadinessSync,
  isAppLaunchReady,
  markLaunchGate,
  subscribeLaunchReady,
} from "@/lib/launch-readiness";
import { isNative } from "@/lib/capacitor-utils";
import "@/styles/launch-screen.css";

const LOGO_SRC = "/icon-192.png";
const LOGO_WEBP_SRC = "/icon-192.webp";
const LOGO_FALLBACK_SRC = "/brand/official.png";
const LOGO_FALLBACK_WEBP_SRC = "/brand/official.webp";
const LAUNCH_BG = "#002b21";
const SKIP_SWIPE_PX = 48;

type Phase = "enter" | "exit";

export type MajlisLaunchScreenProps = {
  /** يُستدعى عند اكتمال الخروج — لربط isLaunching في AppShell */
  onComplete?: () => void;
};

function restoreThemeColor(): void {
  try {
    void import("@/lib/apply-page-chrome").then(({ reapplyPageChromeFromLocation }) => {
      void import("@/lib/theme-preference").then(({ readThemePreference, resolveTheme }) => {
        void reapplyPageChromeFromLocation(resolveTheme(readThemePreference()));
      });
    });
  } catch {
    /* ignore */
  }
}

function applyLaunchChrome(): void {
  try {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", LAUNCH_BG);
    });
    document.documentElement.style.setProperty("--app-status-bg", LAUNCH_BG);
    document.documentElement.style.setProperty("--app-status-fg-mode", "light");
  } catch {
    /* ignore */
  }
}

async function applyNativeLaunchStatusBar(): Promise<void> {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: LAUNCH_BG });
  } catch {
    /* منصّة بلا ملحق */
  }
}

export function MajlisLaunchScreen({ onComplete }: MajlisLaunchScreenProps = {}) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("enter");
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);
  const [logoFailed, setLogoFailed] = useState(false);
  const finishedRef = useRef(false);
  const readyRef = useRef(isAppLaunchReady());
  const skippedRef = useRef(false);
  const mountedAtRef = useRef(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback((reason: "ready" | "timeout" | "skip") => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (reason === "timeout" && import.meta.env.DEV && !readyRef.current) {
      console.warn(
        `[launch] سقف ${LAUNCH_MAX_MS}ms — دخول التطبيق مع fallback قبل اكتمال كل البوابات`,
      );
    }
    setPhase("exit");
    window.setTimeout(() => {
      document.body.classList.remove("mj-launching");
      restoreThemeColor();
      setVisible(false);
      onCompleteRef.current?.();
    }, LAUNCH_EXIT_MS);
  }, []);

  const requestSkip = useCallback(() => {
    if (finishedRef.current) return;
    skippedRef.current = true;
    finish("skip");
  }, [finish]);

  useEffect(() => {
    if (!visible) return;

    mountedAtRef.current = performance.now();
    applyLaunchChrome();
    document.body.classList.add("mj-launching");
    void hideAppSplash();
    void applyNativeLaunchStatusBar();
    bootstrapLaunchReadinessSync();

    const tryFinish = () => {
      const elapsed = performance.now() - mountedAtRef.current;
      if (
        canDismissLaunch({
          ready: readyRef.current,
          elapsedMs: elapsed,
          skipped: skippedRef.current,
        })
      ) {
        finish(skippedRef.current ? "skip" : readyRef.current ? "ready" : "timeout");
      }
    };

    const unsub = subscribeLaunchReady(() => {
      readyRef.current = true;
      tryFinish();
    });

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        markLaunchGate("shell");
        readyRef.current = isAppLaunchReady();
        tryFinish();
      });
    });

    const maxTimer = window.setTimeout(() => finish("timeout"), LAUNCH_MAX_MS);
    const enterTimer = window.setTimeout(tryFinish, LAUNCH_ENTER_MS);
    const poll = window.setInterval(tryFinish, 80);

    return () => {
      window.clearTimeout(maxTimer);
      window.clearTimeout(enterTimer);
      window.clearInterval(poll);
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      unsub();
      document.body.classList.remove("mj-launching");
    };
  }, [visible, finish]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    touchRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) {
      requestSkip();
      return;
    }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) >= SKIP_SWIPE_PX || Math.abs(dy) >= SKIP_SWIPE_PX) {
      requestSkip();
      return;
    }
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
      requestSkip();
    }
  };

  if (!visible) return null;

  return (
    <div
      className="mj-launch-screen"
      data-phase={phase}
      data-testid="majlis-launch-screen"
      role="presentation"
      aria-hidden="true"
      dir="rtl"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
      }}
    >
      <div className="mj-launch-screen__glow" aria-hidden="true" />
      <div className="mj-launch-screen__pattern" aria-hidden="true" />
      <div className="mj-launch-screen__inner">
        <div className="mj-launch-screen__logo-wrap">
          {logoFailed ? (
            <span className="mj-launch-screen__mark" aria-hidden="true">
              م
            </span>
          ) : (
            <picture>
              <source
                srcSet={logoSrc === LOGO_FALLBACK_SRC ? LOGO_FALLBACK_WEBP_SRC : LOGO_WEBP_SRC}
                type="image/webp"
              />
              <img
                className="mj-launch-screen__logo"
                src={logoSrc}
                alt=""
                width={96}
                height={96}
                decoding="async"
                loading="eager"
                fetchPriority="high"
                onError={() => {
                  if (logoSrc !== LOGO_FALLBACK_SRC) {
                    setLogoSrc(LOGO_FALLBACK_SRC);
                    return;
                  }
                  setLogoFailed(true);
                }}
              />
            </picture>
          )}
        </div>
        <p className="mj-launch-screen__title">المجلس العلمي</p>
        <p className="mj-launch-screen__tagline">{LAUNCH_TAGLINE}</p>
        <div className="mj-launch-screen__loader" aria-hidden="true" />
      </div>
    </div>
  );
}

/** توافق مؤقت مع الاسم السابق */
export { MajlisLaunchScreen as MajalisLaunchScreen };
