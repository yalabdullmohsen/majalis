/**
 * MajlisLaunchScreen — شاشة تشغيل يومية (ليست Onboarding).
 * تظهر عند كل إقلاع، تختفي عند جاهزية التطبيق أو سقف 3ث.
 */
import { useEffect, useRef, useState } from "react";
import { hideAppSplash } from "@/lib/splash-screen";
import {
  LAUNCH_ENTER_MS,
  LAUNCH_EXIT_MS,
  LAUNCH_MAX_MS,
  canDismissLaunch,
  pickLaunchTagline,
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
const LAUNCH_BG = "#002b21";

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
    // خلفية داكنة → أيقونات فاتحة (Light content)
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: LAUNCH_BG });
  } catch {
    /* منصّة بلا ملحق */
  }
}

export function MajlisLaunchScreen({ onComplete }: MajlisLaunchScreenProps = {}) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("enter");
  const [tagline] = useState(() => pickLaunchTagline());
  const finishedRef = useRef(false);
  const readyRef = useRef(isAppLaunchReady());
  const mountedAtRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) return;

    mountedAtRef.current = performance.now();
    applyLaunchChrome();
    document.body.classList.add("mj-launching");
    void hideAppSplash();
    void applyNativeLaunchStatusBar();

    // بوابات متزامنة محلية فورًا
    bootstrapLaunchReadinessSync();

    const finish = (reason: "ready" | "timeout") => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (
        reason === "timeout" &&
        import.meta.env.DEV &&
        !readyRef.current
      ) {
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
    };

    const tryFinish = () => {
      const elapsed = performance.now() - mountedAtRef.current;
      if (canDismissLaunch({ ready: readyRef.current, elapsedMs: elapsed })) {
        finish(readyRef.current ? "ready" : "timeout");
      }
    };

    const unsub = subscribeLaunchReady(() => {
      readyRef.current = true;
      tryFinish();
    });

    // إطاران بعد التركيب = المسارات الحرجة جاهزة للرسم
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
    // فحص دوري خفيف أثناء انتظار الجاهزية
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
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="mj-launch-screen"
      data-phase={phase}
      data-testid="majlis-launch-screen"
      role="presentation"
      aria-hidden="true"
    >
      <div className="mj-launch-screen__pattern" aria-hidden="true" />
      <div className="mj-launch-screen__inner">
        <div className="mj-launch-screen__logo-wrap">
          <img
            className="mj-launch-screen__logo"
            src={LOGO_SRC}
            alt=""
            width={88}
            height={88}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <p className="mj-launch-screen__title">المجلس العلمي</p>
        <p className="mj-launch-screen__tagline">{tagline}</p>
        <div className="mj-launch-screen__loader" aria-hidden="true" />
      </div>
    </div>
  );
}

/** توافق مؤقت مع الاسم السابق */
export { MajlisLaunchScreen as MajalisLaunchScreen };
