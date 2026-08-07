export type UserPreferences = {
  fontSize: "صغير" | "متوسط" | "كبير";
  interfaceLanguage: string;
  direction: "rtl" | "ltr";
  readingTextSize: string;
  readingSpacing: "ضيق" | "متوسط" | "واسع";
  /** عرض عمود النص في وضع القراءة (ch) */
  readingWidth: "ضيق" | "متوسط" | "واسع";
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
  /** كثافة واجهة المستخدم — تُطبَّق على html[data-ui-density] */
  uiDensity: "comfortable" | "compact";
  /** توفير البيانات: يقلّل الإحماء الثقيل والوسائط عند الاتصال الضعيف */
  dataSaver: boolean;
};

export const SETTINGS_KEY = "majalis-user-settings-v1";

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: "متوسط",
  interfaceLanguage: "العربية",
  direction: "rtl",
  readingTextSize: "17",
  readingSpacing: "واسع",
  readingWidth: "متوسط",
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
  uiDensity: "comfortable",
  dataSaver: false,
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

  let dataSaver = prefs.dataSaver;
  try {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) dataSaver = true;
  } catch {
    /* ignore */
  }

  const fontScale =
    prefs.fontSize === "صغير" ? "0.92" : prefs.fontSize === "كبير" ? "1.08" : "1";
  const densityScale = prefs.uiDensity === "compact" ? "0.92" : "1";
  root.style.setProperty("--ui-font-scale", fontScale);
  root.style.setProperty("--ui-density-scale", densityScale);
  root.style.setProperty("--reading-font-size", `${prefs.readingTextSize}px`);
  root.style.setProperty("--quran-font-size", `${prefs.quranFontScale}px`);
  root.style.setProperty(
    "--reading-line-height",
    prefs.readingSpacing === "ضيق" ? "1.6" : prefs.readingSpacing === "متوسط" ? "1.85" : "2.1",
  );
  root.style.setProperty(
    "--reading-max-width",
    prefs.readingWidth === "ضيق" ? "52ch" : prefs.readingWidth === "واسع" ? "78ch" : "68ch",
  );
  root.dataset.readingMode = prefs.readingMode ? "quiet" : "normal";
  root.dataset.readingWidth = prefs.readingWidth;
  root.dir = prefs.direction;
  root.dataset.imageQuality = dataSaver ? "منخفض" : prefs.imageQuality;
  root.dataset.uiDensity = prefs.uiDensity;
  root.dataset.dataSaver = dataSaver ? "1" : "0";
}
