/**
 * طبقة جاهزية إقلاع واحدة — ثيم/خطوط/CSS قبل إعلان أول رسم.
 * مهلة قصيرة آمنة؛ لا setTimeout عشوائي لإخفاء عيوب العرض.
 */

export type BootFlags = {
  themeReady: boolean;
  fontsReady: boolean;
  cssReady: boolean;
  routeReady: boolean;
};

const BOOT_FONT_TIMEOUT_MS = 420;

const flags: BootFlags = {
  themeReady: false,
  fontsReady: false,
  cssReady: false,
  routeReady: false,
};

function themeAlreadyApplied(): boolean {
  if (typeof document === "undefined") return true;
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark";
}

async function waitUiFonts(timeoutMs: number): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return true;
  try {
    const load = Promise.all([
      document.fonts.load('16px "Amiri"'),
      document.fonts.load('16px "Noto Naskh Arabic"'),
    ]).then(() => document.fonts.ready);
    await Promise.race([
      load,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, timeoutMs);
      }),
    ]);
    return (
      document.fonts.check('16px "Amiri"') ||
      document.fonts.check('16px "Noto Naskh Arabic"')
    );
  } catch {
    return false;
  }
}

/** يحدّث الأعلام ويُرجع نسخة للقراءة. */
export function getBootFlags(): Readonly<BootFlags> {
  return { ...flags };
}

/**
 * يجهّز الثيم/الخطوط/CSS ثم يعلن `mj:boot-ready`.
 * يُستدعى مرة واحدة بعد createRoot وقبل إخفاء Splash.
 */
export async function awaitBootReadiness(): Promise<BootFlags> {
  flags.themeReady = themeAlreadyApplied();
  flags.cssReady =
    typeof document !== "undefined" &&
    Boolean(document.getElementById("mj-lcp-critical") || document.styleSheets.length > 0);
  flags.routeReady = typeof document !== "undefined" && Boolean(document.getElementById("root"));
  flags.fontsReady = await waitUiFonts(BOOT_FONT_TIMEOUT_MS);

  try {
    window.dispatchEvent(
      new CustomEvent("mj:boot-ready", { detail: { ...flags } }),
    );
  } catch {
    /* ignore */
  }
  return { ...flags };
}

export { BOOT_FONT_TIMEOUT_MS };
