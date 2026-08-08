/**
 * إخفاء شاشة الدخول (ويب + Capacitor) عند أول جاهزية للمسار.
 * سقف زمني 1.2s يخفيها على أي حال — بارد البدء فقط، بلا إبقاء اصطناعي.
 */
import { Capacitor } from "@capacitor/core";

/** سقف أمان فقط — الإخفاء الأساسي عند أول إطار جاهز بلا تأخير مصطنع. */
const MAX_MS = 900;
let hidden = false;

function dismissWebSplash() {
  document.documentElement.setAttribute("data-splash-done", "1");
  const el = document.getElementById("mj-boot-splash");
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) {
    el.remove();
    return;
  }
  el.classList.add("is-hiding");
  window.setTimeout(() => {
    el.remove();
  }, 200);
}

export async function hideAppSplash() {
  if (hidden) return;
  hidden = true;
  dismissWebSplash();
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch {
    /* منصّة بلا ملحق — تجاهل */
  }
}

/** يُستدعى مرة عند الإقلاع: يخفي عند أول إطار بعد التركيب، مع سقف 1.2s */
export function armSplashAutoHide() {
  const deadline = window.setTimeout(() => {
    void hideAppSplash();
  }, MAX_MS);

  const hide = () => {
    window.clearTimeout(deadline);
    void hideAppSplash();
  };

  // أول إطار بعد تركيب React ≈ جاهزية المسار الأولي
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(hide);
    });
  } else {
    window.setTimeout(hide, 0);
  }
}
