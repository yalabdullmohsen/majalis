/**
 * طبقة جاهزية إقلاع واحدة — ثيم/خطوط/CSS/تخزين قبل إعلان أول رسم مرئي.
 * ينتظر document.fonts فعليًا؛ لا يُعلن الجاهزية بمهلة عشوائية قصيرة تُسبب FOUT.
 */

export type BootFlags = {
  themeReady: boolean;
  fontsReady: boolean;
  cssReady: boolean;
  routeReady: boolean;
  storageReady: boolean;
};

/**
 * سقف قصير يطابق نافذة font-display:optional (~100ms).
 * لا نحبس Splash/LCP على تنزيل Amiri الكامل — المقاييس تمنع CLS.
 */
const BOOT_FONT_TIMEOUT_MS = 180;

/** سقف مزامنة Preferences → localStorage داخل حارس الإقلاع (لا يحجب createRoot). */
const BOOT_STORAGE_TIMEOUT_MS = 450;

const flags: BootFlags = {
  themeReady: false,
  fontsReady: false,
  cssReady: false,
  routeReady: false,
  storageReady: false,
};

let storageGate: Promise<void> | null = null;

function themeAlreadyApplied(): boolean {
  if (typeof document === "undefined") return true;
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark";
}

function raceTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * يسجّل وعد التخزين ليُنتظَر داخل awaitBootReadiness دون تأخير createRoot.
 */
export function registerBootStorageGate(promise: Promise<unknown>): void {
  storageGate = Promise.resolve(promise).then(
    () => undefined,
    () => undefined,
  );
}

async function waitUiFonts(timeoutMs: number): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return true;
  try {
    // خط الواجهة الفعلي هو Amiri (--font-app) — لا ننتظر Noto في المسار الحرج
    const primary = '16px "Amiri"';
    const load = (async () => {
      await document.fonts.load(primary);
    })();
    await Promise.race([load, raceTimeout(timeoutMs)]);
    return document.fonts.check(primary);
  } catch {
    return false;
  }
}

async function waitStorageGate(timeoutMs: number): Promise<boolean> {
  if (!storageGate) return true;
  try {
    await Promise.race([storageGate, raceTimeout(timeoutMs)]);
    return true;
  } catch {
    return false;
  }
}

/** يحدّث الأعلام ويُرجع نسخة للقراءة. */
export function getBootFlags(): Readonly<BootFlags> {
  return { ...flags };
}

/**
 * يجهّز الثيم/الخطوط/CSS/التخزين ثم يعلن `mj:boot-ready`.
 * يُستدعى مرة واحدة بعد createRoot وقبل إخفاء Splash.
 */
export async function awaitBootReadiness(): Promise<BootFlags> {
  flags.themeReady = themeAlreadyApplied();
  flags.cssReady =
    typeof document !== "undefined" &&
    Boolean(document.getElementById("mj-lcp-critical") || document.styleSheets.length > 0);
  flags.routeReady = typeof document !== "undefined" && Boolean(document.getElementById("root"));

  const [fontsReady, storageReady] = await Promise.all([
    waitUiFonts(BOOT_FONT_TIMEOUT_MS),
    waitStorageGate(BOOT_STORAGE_TIMEOUT_MS),
  ]);
  flags.fontsReady = fontsReady;
  flags.storageReady = storageReady;

  try {
    if (fontsReady) {
      document.documentElement.dataset.mjFonts = "1";
    }
  } catch {
    /* ignore */
  }

  try {
    const { markBootReady } = await import("@/lib/boot-sequence");
    markBootReady();
  } catch {
    /* ignore */
  }

  // الاستقرار الفعلي بعد زوال app-booting (index.html) — هنا نبثّ boot-ready فقط
  try {
    window.dispatchEvent(
      new CustomEvent("mj:boot-ready", { detail: { ...flags } }),
    );
  } catch {
    /* ignore */
  }
  return { ...flags };
}

export { BOOT_FONT_TIMEOUT_MS, BOOT_STORAGE_TIMEOUT_MS };
