export type UserPreferences = {
  fontSize: "صغير" | "متوسط" | "كبير";
  interfaceLanguage: string;
  direction: "rtl" | "ltr";
  readingSpacing: "ضيق" | "متوسط" | "واسع";
  readingMode: boolean;
  imageQuality: "منخفض" | "متوسط" | "عالي";
  videoAutoplay: boolean;
  radioVolume: string;
  playerQuality: string;
  lessonNotifications: boolean;
  lectureNotifications: boolean;
  contentNotifications: boolean;
  updateNotifications: boolean;
  occasionNotifications: boolean;
  aiSuggestions: boolean;
  sourceDetailLevel: string;
  searchHistory: boolean;
  assistantVerbose: boolean;
};

export const SETTINGS_KEY = "majalis-user-settings-v1";

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: "متوسط",
  interfaceLanguage: "العربية",
  direction: "rtl",
  readingSpacing: "واسع",
  readingMode: false,
  imageQuality: "متوسط",
  videoAutoplay: false,
  radioVolume: "80",
  playerQuality: "128",
  lessonNotifications: true,
  lectureNotifications: true,
  contentNotifications: true,
  updateNotifications: true,
  occasionNotifications: true,
  aiSuggestions: true,
  sourceDetailLevel: "مختصر",
  searchHistory: true,
  assistantVerbose: false,
};

function fontSizePx(fontSize: UserPreferences["fontSize"]): number {
  if (fontSize === "صغير") return 18;
  if (fontSize === "كبير") return 24;
  return 20;
}

export function readPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const merged = { ...DEFAULT_PREFERENCES, ...raw };
    delete (merged as Record<string, unknown>).readingTextSize;
    delete (merged as Record<string, unknown>).quranFontScale;
    return merged as UserPreferences;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(prefs: Partial<UserPreferences>) {
  if (typeof window === "undefined") return;
  const next = { ...readPreferences(), ...prefs };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  applyPreferences(next);
}

export function applyPreferences(prefs: UserPreferences = readPreferences()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const fontScale =
    prefs.fontSize === "صغير" ? "0.92" : prefs.fontSize === "كبير" ? "1.08" : "1";
  const basePx = fontSizePx(prefs.fontSize);

  root.style.setProperty("--ui-font-scale", fontScale);
  root.style.setProperty("--reading-font-size", `${basePx}px`);
  root.style.setProperty("--quran-font-size", `${basePx + 4}px`);
  root.style.setProperty(
    "--reading-line-height",
    prefs.readingSpacing === "ضيق" ? "1.6" : prefs.readingSpacing === "متوسط" ? "1.85" : "2.1",
  );
  root.dataset.readingMode = prefs.readingMode ? "quiet" : "normal";
  root.dir = prefs.direction;
  root.dataset.imageQuality = prefs.imageQuality;
}
