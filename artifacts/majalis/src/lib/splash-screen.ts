/**
 * إخفاء شاشة الإطلاق الأصلية (Capacitor) عند أول إطار بعد التركيب.
 * دخولية الويب صامتة في index.html — ليست مكوّن React.
 */
import { Capacitor } from "@capacitor/core";

/** سقف أمان فقط — الإخفاء الأساسي عند أول إطار جاهز بلا تأخير مصطنع. */
const MAX_MS = 900;
let hidden = false;

export async function hideAppSplash() {
  if (hidden) return;
  hidden = true;
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // بلا fade طويل — انتقال فوري تقريباً للمحتوى / دخولية الويب المطابقة
    await SplashScreen.hide({ fadeOutDuration: 0 });
  } catch {
    /* منصّة بلا ملحق — تجاهل */
  }
}

/** يُستدعى مرة عند الإقلاع: يخفي الإطلاق الأصلي عند أول إطار بعد التركيب */
export function armSplashAutoHide() {
  const deadline = window.setTimeout(() => {
    void hideAppSplash();
  }, MAX_MS);

  const hide = () => {
    window.clearTimeout(deadline);
    void hideAppSplash();
  };

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(hide);
    });
  } else {
    window.setTimeout(hide, 0);
  }
}
