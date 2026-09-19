/**
 * عقد تنقّل قارئ المصحف — يثبّت فتحات المستقبل بلا تنفيذ الميزات الآن.
 * Bookmark / Quick Jump / Tafsir Layer / Audio Sync تُسجَّل كـ reserved فقط.
 */

export type MushafReaderNavCapability =
  | "exit"
  | "pageArrows"
  | "pageScrubber"
  | "chromeToggle"
  | "bookmark"
  | "quickJump"
  | "tafsirLayer"
  | "audioSync";

export type MushafReaderNavSlot = {
  id: MushafReaderNavCapability;
  /** مفعّل في الإنتاج الآن */
  enabled: boolean;
  /** محجوز لطبقات لاحقة — لا UI بعد */
  reserved?: boolean;
};

/** مصدر حقيقة واحد لقدرات شريط أدوات القارئ */
export const MUSHAF_READER_NAV_SLOTS: readonly MushafReaderNavSlot[] = [
  { id: "exit", enabled: true },
  { id: "chromeToggle", enabled: true },
  { id: "pageArrows", enabled: true },
  { id: "pageScrubber", enabled: true },
  { id: "bookmark", enabled: true },
  { id: "quickJump", enabled: false, reserved: true },
  { id: "tafsirLayer", enabled: false, reserved: true },
  { id: "audioSync", enabled: false, reserved: true },
] as const;

export function isMushafNavCapabilityEnabled(id: MushafReaderNavCapability): boolean {
  return MUSHAF_READER_NAV_SLOTS.some((s) => s.id === id && s.enabled);
}

export function listReservedMushafNavCapabilities(): MushafReaderNavCapability[] {
  return MUSHAF_READER_NAV_SLOTS.filter((s) => s.reserved).map((s) => s.id);
}

/** نيّات تنقّل مستقبلية — واجهة فقط، بدون side-effects */
export type MushafReaderNavIntent =
  | { kind: "exit" }
  | { kind: "gotoPage"; page: number }
  | { kind: "nextPage" }
  | { kind: "prevPage" }
  | { kind: "toggleChrome" }
  | { kind: "openBookmark"; reserved: true }
  | { kind: "openQuickJump"; reserved: true }
  | { kind: "openTafsirLayer"; reserved: true }
  | { kind: "syncAudio"; reserved: true };

export function isReservedNavIntent(intent: MushafReaderNavIntent): boolean {
  return "reserved" in intent && intent.reserved === true;
}
