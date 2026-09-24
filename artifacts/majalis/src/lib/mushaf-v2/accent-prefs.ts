/**
 * مظهر المصحف الذهبي الثابت — Migration مرة واحدة من مفتاح Accent القديم.
 * لا قراءة مظهر زمردي · لا حفظ اختيار · data-mushaf-accent="gold" دائمًا.
 */

import {
  MUSHAF_ACCENT_STORAGE_KEY_LEGACY,
  MUSHAF_SETTINGS_SCHEMA_VERSION,
  MUSHAF_SETTINGS_SCHEMA_VERSION_KEY,
  type MushafAppearanceTheme,
} from "./mushaf-appearance-theme";

/** يزيل مفتاح المظهر القديم ويثبّت schema — مرة واحدة بلا Flash زمردي */
export function migrateMushafAccentStorageOnce(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const schema = localStorage.getItem(MUSHAF_SETTINGS_SCHEMA_VERSION_KEY);
    if (schema === MUSHAF_SETTINGS_SCHEMA_VERSION) {
      /* حتى مع schema حديثة: امسح المفتاح القديم إن بقي من جلسة قديمة */
      localStorage.removeItem(MUSHAF_ACCENT_STORAGE_KEY_LEGACY);
      return;
    }
    localStorage.removeItem(MUSHAF_ACCENT_STORAGE_KEY_LEGACY);
    localStorage.setItem(MUSHAF_SETTINGS_SCHEMA_VERSION_KEY, MUSHAF_SETTINGS_SCHEMA_VERSION);
  } catch {
    /* ignore */
  }
}

/** دائمًا GOLD — التوافق مع المستدعين القدامى */
export function loadMushafAccentTheme(): MushafAppearanceTheme {
  migrateMushafAccentStorageOnce();
  return "GOLD";
}

/** لا يحفظ اختيارًا — يطبّق الذهب ويمسح المفتاح القديم فقط */
export function saveMushafAccentTheme(_theme?: MushafAppearanceTheme): void {
  migrateMushafAccentStorageOnce();
  applyMushafAccentTheme("GOLD");
}

/** يطبّق الذهب فورًا على html و.nm-root — بلا وميض زمردي */
export function applyMushafAccentTheme(
  _theme: MushafAppearanceTheme = "GOLD",
  root?: HTMLElement | null,
): void {
  migrateMushafAccentStorageOnce();
  const targets: HTMLElement[] = [];
  if (root) targets.push(root);
  if (typeof document !== "undefined") {
    targets.push(document.documentElement);
    document.querySelectorAll<HTMLElement>(".nm-root").forEach((el) => targets.push(el));
  }
  for (const el of targets) {
    el.setAttribute("data-mushaf-accent", "gold");
    /* إزالة أي قيمة زمردية عالقة */
    if (el.getAttribute("data-mushaf-accent") !== "gold") {
      el.setAttribute("data-mushaf-accent", "gold");
    }
  }
}

export function readAccentThemeFromDom(_root?: HTMLElement | null): MushafAppearanceTheme {
  return "GOLD";
}
