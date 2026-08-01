/**
 * Web / Capacitor port of Flutter `QuranReaderPage` immersive chrome:
 *
 * ```dart
 * SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
 * backgroundColor: Color(0xFFF5F5DC); // ورق كريمي
 * padding: EdgeInsets.symmetric(horizontal: 30, vertical: 20);
 * fontFamily: 'UthmaniFont', fontSize: 28, height: 2.0, color: Colors.black87
 * ```
 *
 * Does not own reading prefs (font/theme live in QuranContext / useQuranPreferences).
 */

import { isNative, setupStatusBar } from "@/lib/capacitor-utils";
import { resolveTheme, readThemePreference } from "@/lib/theme-preference";

/** Flutter `Color(0xFFF5F5DC)` — parchment cream. */
export const IMMERSIVE_PAPER_BG = "#F5F5DC";

/** Ayah-app warm paper for the Mushaf page reader (`/mushaf/page`). */
export const AYAH_MUSHAF_PAPER_BG = "#FAF7F2";

/** Soft ink on Ayah paper. */
export const AYAH_MUSHAF_INK = "#2C2C2E";

/** Muted meta text (juz / surah) — system gray. */
export const AYAH_MUSHAF_META = "#8E8E93";

/** Flutter `Colors.black87` ≈ #000000 at 87% opacity on paper. */
export const IMMERSIVE_INK = "rgba(0, 0, 0, 0.87)";

/** Flutter `Colors.brown.withOpacity(0.2)` — verse selection wash. */
export const VERSE_SELECTED_BG = "rgba(121, 85, 72, 0.2)";

/** Flutter `Colors.brown[900]` — selected verse ink. */
export const VERSE_SELECTED_INK = "#3E2723";

/** Flutter `BorderRadius.circular(10)`. */
export const VERSE_SELECTED_RADIUS_PX = 10;

/** Flutter list item `margin: EdgeInsets.only(bottom: 20)`. */
export const VERSE_ITEM_GAP_PX = 20;

/** Flutter demo `fontSize: 28` (focus comfort; prefs may override). */
export const IMMERSIVE_FONT_SIZE_PX = 28;

/** ارتفاع سطر أوفر للتشكيل (كان 2.0 في Flutter demo). */
export const IMMERSIVE_LINE_HEIGHT_RATIO = 2.4;

/** Flutter `EdgeInsets.symmetric(horizontal: 30)`. */
export const IMMERSIVE_PAD_X_PX = 30;

/** Flutter `EdgeInsets.symmetric(vertical: 20)`. */
export const IMMERSIVE_PAD_Y_PX = 20;

/** Flutter ImmersiveQuranPage `vertical: 50` list padding. */
export const IMMERSIVE_LIST_PAD_Y_PX = 50;

/** Flutter `Colors.brown` — selected verse text in ImmersiveQuranPage. */
export const VERSE_SELECTED_BROWN = "#795548";

/** Body / html class while System UI is immersive-sticky. */
export const IMMERSIVE_BODY_CLASS = "quran-immersive-sticky";

const THEME_COLOR_META = 'meta[name="theme-color"]';

type ImmersiveSession = {
  prevThemeColor: string | null;
  hadMeta: boolean;
};

let session: ImmersiveSession | null = null;
let enterCount = 0;

async function hideNativeSystemUi(): Promise<void> {
  if (!isNative) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.hide();
  } catch {
    /* platform without StatusBar — ignore */
  }
}

async function restoreNativeSystemUi(): Promise<void> {
  if (!isNative) return;
  try {
    const theme = resolveTheme(readThemePreference());
    await setupStatusBar(theme);
  } catch {
    /* ignore */
  }
}

function applyThemeColor(color: string): void {
  let meta = document.querySelector(THEME_COLOR_META) as HTMLMetaElement | null;
  const hadMeta = Boolean(meta);
  const prev = meta?.getAttribute("content") ?? null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
  session = { prevThemeColor: prev, hadMeta };
}

function restoreThemeColor(): void {
  if (!session) return;
  const meta = document.querySelector(THEME_COLOR_META) as HTMLMetaElement | null;
  if (!meta) {
    session = null;
    return;
  }
  if (session.prevThemeColor != null) {
    meta.setAttribute("content", session.prevThemeColor);
  } else if (!session.hadMeta) {
    meta.remove();
  }
  session = null;
}

/**
 * Enter immersive-sticky (Flutter `SystemUiMode.immersiveSticky`).
 * Reference-counted so nested readers (mushaf + focus) share one session.
 */
export async function enterImmersiveSystemUi(
  paperBg: string = IMMERSIVE_PAPER_BG,
): Promise<void> {
  enterCount += 1;
  if (enterCount > 1) return;

  document.documentElement.classList.add(IMMERSIVE_BODY_CLASS);
  document.body.classList.add(IMMERSIVE_BODY_CLASS);
  document.documentElement.style.setProperty("--quran-immersive-paper", paperBg);
  applyThemeColor(paperBg);
  await hideNativeSystemUi();
}

/**
 * Leave immersive-sticky — restores StatusBar / theme-color when last caller exits.
 */
export async function exitImmersiveSystemUi(): Promise<void> {
  if (enterCount <= 0) return;
  enterCount -= 1;
  if (enterCount > 0) return;

  document.documentElement.classList.remove(IMMERSIVE_BODY_CLASS);
  document.body.classList.remove(IMMERSIVE_BODY_CLASS);
  document.documentElement.style.removeProperty("--quran-immersive-paper");
  restoreThemeColor();
  await restoreNativeSystemUi();
}

/** Test helper — clears refcount without touching DOM (Node unit tests). */
export function __resetImmersiveForTests(): void {
  enterCount = 0;
  session = null;
}

/** CSS variables matching Flutter Scaffold padding + type. */
export function immersiveReaderCssVars(opts?: {
  fontSize?: number;
  paperBg?: string;
  ink?: string;
}): Record<string, string> {
  const fontSize = opts?.fontSize ?? IMMERSIVE_FONT_SIZE_PX;
  const paperBg = opts?.paperBg ?? IMMERSIVE_PAPER_BG;
  const ink = opts?.ink ?? IMMERSIVE_INK;
  return {
    "--quran-immersive-paper": paperBg,
    "--quran-immersive-ink": ink,
    "--quran-immersive-pad-x": `${IMMERSIVE_PAD_X_PX}px`,
    "--quran-immersive-pad-y": `${IMMERSIVE_PAD_Y_PX}px`,
    "--quran-immersive-fs": `${fontSize}px`,
    "--quran-immersive-lh": `${fontSize * IMMERSIVE_LINE_HEIGHT_RATIO}px`,
  };
}
