/**
 * دخولية احترافية سريعة — جلسة واحدة فقط، أصول محلية، CSS فقط.
 * تُنسَّق مع الشاشة الأصلية عبر hideAppSplash عند التركيب.
 */
import { useEffect, useRef, useState } from "react";
import { hideAppSplash } from "@/lib/splash-screen";
import {
  LAUNCH_INTRO_FADE_MS,
  LAUNCH_INTRO_MAX_MS,
  LAUNCH_INTRO_MIN_MS,
  markLaunchIntroSeen,
  shouldShowLaunchIntro,
} from "@/lib/launch-intro";
import "@/styles/components/majalis-launch-screen.css";

const LOGO_SRC = "/icon-192.png";

type Phase = "enter" | "exit";

function restoreThemeColor(): void {
  try {
    const dark = document.documentElement.classList.contains("dark")
      || document.documentElement.dataset.theme === "dark";
    const color = dark ? "#101614" : "#F2F4F3";
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", color);
    });
  } catch {
    /* ignore */
  }
}

function applyLaunchThemeColor(): void {
  try {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", "#002b21");
    });
  } catch {
    /* ignore */
  }
}

export function MajalisLaunchScreen() {
  const [visible, setVisible] = useState(() => {
    if (!shouldShowLaunchIntro()) return false;
    // تثبيت الجلسة فور قرار العرض — لا تكرار عند Strict Mode أو إعادة تركيب
    markLaunchIntroSeen();
    return true;
  });
  const [phase, setPhase] = useState<Phase>("enter");
  const finishedRef = useRef(false);
  const shellReadyRef = useRef(false);
  const mountedAtRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    mountedAtRef.current = performance.now();
    applyLaunchThemeColor();
    document.body.classList.add("mj-launch-intro-active");
    void hideAppSplash();

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setPhase("exit");
      window.setTimeout(() => {
        document.body.classList.remove("mj-launch-intro-active");
        restoreThemeColor();
        setVisible(false);
      }, LAUNCH_INTRO_FADE_MS);
    };

    const tryFinish = () => {
      const elapsed = performance.now() - mountedAtRef.current;
      if (elapsed >= LAUNCH_INTRO_MIN_MS && shellReadyRef.current) {
        finish();
      }
    };

    const maxTimer = window.setTimeout(finish, LAUNCH_INTRO_MAX_MS);
    const minTimer = window.setTimeout(tryFinish, LAUNCH_INTRO_MIN_MS);

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        shellReadyRef.current = true;
        tryFinish();
      });
    });

    return () => {
      window.clearTimeout(maxTimer);
      window.clearTimeout(minTimer);
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      document.body.classList.remove("mj-launch-intro-active");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="mj-launch-screen"
      data-phase={phase}
      role="presentation"
      aria-hidden="true"
    >
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
        <p className="mj-launch-screen__tagline">علم نافع، وتجربة مرتبة</p>
      </div>
    </div>
  );
}
