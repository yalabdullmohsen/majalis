/** ثيم قارئ الكتب/النصوص الطويلة — يُحفظ محليًا. */
export type ReadingThemeId = "default" | "sepia" | "night";

export type UserPreferences = {
  fontSize: "صغير" | "متوسط" | "كبير";
  interfaceLanguage: string;
  direction: "rtl" | "ltr";
  readingTextSize: string;
  readingSpacing: "ضيق" | "متوسط" | "واسع";
  /** عرض عمود النص في وضع القراءة (ch) */
  readingWidth: "ضيق" | "متوسط" | "واسع";
  /** ثيم خلفية/حبر القارئ: افتراضي / سيبيا / ليلي */
  readingTheme: ReadingThemeId;
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
  /** اهتزاز لمسي تفاعلي (كتالوج haptics.ts) */
  hapticsEnabled: boolean;
  /** تباين مرتفع اختياري — html[data-contrast=high] + prefers-contrast */
  highContrast: boolean;
  /** وضع كبار السن: خط أكبر + تباين مرتفع + كثافة مريحة */
  seniorMode: boolean;
};

export const SETTINGS_KEY = "majalis-user-settings-v1";

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: "متوسط",
  interfaceLanguage: "العربية",
  direction: "rtl",
  readingTextSize: "17",
  readingSpacing: "واسع",
  readingWidth: "متوسط",
  readingTheme: "default",
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
  hapticsEnabled: true,
  highContrast: false,
  seniorMode: false,
};

export function readPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<UserPreferences>;
    const stored = { ...DEFAULT_PREFERENCES, ...raw };
    if (!("hapticsEnabled" in raw) && localStorage.getItem("adhkar_haptics_enabled") === "false") {
      stored.hapticsEnabled = false;
    }
    return stored;
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

  const senior = prefs.seniorMode;
  const fontScale = senior
    ? "1.16"
    : prefs.fontSize === "صغير"
      ? "0.92"
      : prefs.fontSize === "كبير"
        ? "1.08"
        : "1";
  const densityScale = prefs.uiDensity === "compact" && !senior ? "0.92" : "1";
  root.style.setProperty("--ui-font-scale", fontScale);
  root.style.setProperty("--ui-density-scale", densityScale);
  const baseReading = Number(prefs.readingTextSize) || 17;
  const readingPx = Math.min(32, Math.max(14, senior ? Math.max(baseReading, 22) : baseReading));
  root.style.setProperty("--reading-font-size", `${readingPx}px`);
  root.style.setProperty("--quran-font-size", `${prefs.quranFontScale}px`);
  root.style.setProperty(
    "--reading-line-height",
    senior || prefs.readingSpacing === "واسع"
      ? "2.1"
      : prefs.readingSpacing === "ضيق"
        ? "1.6"
        : "1.85",
  );
  root.style.setProperty(
    "--reading-max-width",
    prefs.readingWidth === "ضيق" ? "52ch" : prefs.readingWidth === "واسع" ? "78ch" : "68ch",
  );
  root.dataset.readingMode = prefs.readingMode ? "quiet" : "normal";
  root.dataset.readingWidth = prefs.readingWidth;
  root.dataset.readingTheme = prefs.readingTheme || "default";
  root.dir = prefs.direction;
  /** عربي = أرقام مشرقية ١٢٣ · إنجليزي = غربية 123 — عرض فقط بلا لمس نصوص شرعية */
  root.dataset.numerals = prefs.numeralSystem === "إنجليزي" ? "lat" : "ar";
  root.dataset.imageQuality = dataSaver ? "منخفض" : prefs.imageQuality;
  root.dataset.uiDensity = senior ? "comfortable" : prefs.uiDensity;
  root.dataset.dataSaver = dataSaver ? "1" : "0";
  root.dataset.contrast = senior || prefs.highContrast ? "high" : "normal";
  root.dataset.seniorMode = senior ? "1" : "0";
  try {
    localStorage.setItem("adhkar_haptics_enabled", prefs.hapticsEnabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}
