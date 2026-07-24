export type UserPreferences = {
  fontSize: "صغير" | "متوسط" | "كبير";
  interfaceLanguage: string;
  direction: "rtl" | "ltr";
  readingTextSize: string;
  readingSpacing: "ضيق" | "متوسط" | "واسع";
  readingMode: boolean;
  imageQuality: "منخفض" | "متوسط" | "عالي";
  videoAutoplay: boolean;
  quranFontScale: string;
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
  numeralSystem: "عربي" | "إنجليزي";
};

export const SETTINGS_KEY = "majalis-user-settings-v1";

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: "متوسط",
  interfaceLanguage: "العربية",
  direction: "rtl",
  readingTextSize: "17",
  readingSpacing: "واسع",
  readingMode: false,
  imageQuality: "متوسط",
  videoAutoplay: false,
  quranFontScale: "22",
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
  numeralSystem: "عربي",
};

export function readPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
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
  root.style.setProperty("--ui-font-scale", fontScale);
  root.style.setProperty("--reading-font-size", `${prefs.readingTextSize}px`);
  root.style.setProperty("--quran-font-size", `${prefs.quranFontScale}px`);
  root.style.setProperty(
    "--reading-line-height",
    prefs.readingSpacing === "ضيق" ? "1.6" : prefs.readingSpacing === "متوسط" ? "1.85" : "2.1",
  );
  root.dataset.readingMode = prefs.readingMode ? "quiet" : "normal";
  root.dir = prefs.direction;
  root.dataset.imageQuality = prefs.imageQuality;
}
