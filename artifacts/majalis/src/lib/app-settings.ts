/**
 * إعدادات التطبيق الموسّعة — تفضيلات الواجهة/الأذكار/التعلم/… التي لا تملك
 * مخزنًا مستقلًا بعد. الحفظ فوري في localStorage ويُطبَّق على documentElement.
 */

export type UiDensity = "comfortable" | "compact" | "spacious";
export type BrandAccent = "emerald" | "forest" | "olive" | "teal";
export type CoverSize = "صغير" | "متوسط" | "كبير";
export type LibraryView = "شبكة" | "قائمة";
export type QuizDifficulty = "سهل" | "متوسط" | "صعب";

export type AppSettings = {
  country: string;
  uiDensity: UiDensity;
  reduceMotion: boolean;
  showOrnaments: boolean;
  brandAccent: BrandAccent;
  largeText: boolean;
  highContrast: boolean;
  largeButtons: boolean;
  colorBlindFriendly: boolean;
  screenReaderHints: boolean;

  /* قرآن — إضافات فوق mj-quran-prefs */
  showSurahNames: boolean;
  showWaqfMarks: boolean;
  defaultTafsir: string;
  autoPlayTilawa: boolean;
  defaultReciter: string;

  /* صلاة — إضافات فوق adhan-prefs */
  calcMethod: string;
  asrMadhab: "شافعي" | "حنفي";
  minuteAdjust: number;
  fullAdhan: boolean;
  takbeerOnly: boolean;
  alertTone: string;
  prayerVibrate: boolean;
  showCountdown: boolean;
  silentDuringPrayer: boolean;

  /* أذكار */
  adhkarDefaultCount: number;
  adhkarSound: boolean;
  adhkarVibrate: boolean;
  adhkarTrackProgress: boolean;
  adhkarMorningReminder: boolean;
  adhkarEveningReminder: boolean;
  adhkarSleepReminder: boolean;
  adhkarIstighfarReminder: boolean;

  /* تعلم */
  resumeLastLesson: boolean;
  lessonAutoplay: boolean;
  playbackSpeed: string;
  videoQuality: string;
  downloadLessons: boolean;
  showCaptions: boolean;
  hideCompletedLessons: boolean;
  smartLessonSuggest: boolean;

  /* مكتبة */
  libraryView: LibraryView;
  coverSize: CoverSize;
  smartBookSearch: boolean;
  downloadBooks: boolean;

  /* اختبارات */
  quizDifficulty: QuizDifficulty;
  quizQuestionCount: number;
  quizTimer: boolean;
  quizShowAnswerImmediate: boolean;
  quizReviewErrors: boolean;
  quizAllowRetake: boolean;
  quizSaveStats: boolean;

  /* إشعارات إضافية */
  notifAdhkar: boolean;
  notifQuran: boolean;
  notifStories: boolean;
  notifNews: boolean;
  notifAds: boolean;
  notifImportantOnly: boolean;

  /* ذكاء اصطناعي */
  aiMasterEnabled: boolean;
  aiSummarizeLessons: boolean;
  aiLearningPlan: boolean;
  aiPersonalizeHome: boolean;
  aiAnalyzeInterests: boolean;

  /* ميتا UX */
  favorites: string[];
  recentKeys: string[];
  hideUnused: boolean;
};

export const APP_SETTINGS_KEY = "majalis-app-settings-v1";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  country: "الكويت",
  uiDensity: "comfortable",
  reduceMotion: false,
  showOrnaments: true,
  brandAccent: "emerald",
  largeText: false,
  highContrast: false,
  largeButtons: false,
  colorBlindFriendly: false,
  screenReaderHints: true,

  showSurahNames: true,
  showWaqfMarks: true,
  defaultTafsir: "الميسّر",
  autoPlayTilawa: false,
  defaultReciter: "مشاري العفاسي",

  calcMethod: "أم القرى",
  asrMadhab: "شافعي",
  minuteAdjust: 0,
  fullAdhan: true,
  takbeerOnly: false,
  alertTone: "افتراضي",
  prayerVibrate: true,
  showCountdown: true,
  silentDuringPrayer: false,

  adhkarDefaultCount: 33,
  adhkarSound: true,
  adhkarVibrate: true,
  adhkarTrackProgress: true,
  adhkarMorningReminder: true,
  adhkarEveningReminder: true,
  adhkarSleepReminder: false,
  adhkarIstighfarReminder: false,

  resumeLastLesson: true,
  lessonAutoplay: false,
  playbackSpeed: "1",
  videoQuality: "تلقائي",
  downloadLessons: false,
  showCaptions: false,
  hideCompletedLessons: false,
  smartLessonSuggest: true,

  libraryView: "شبكة",
  coverSize: "متوسط",
  smartBookSearch: true,
  downloadBooks: false,

  quizDifficulty: "متوسط",
  quizQuestionCount: 10,
  quizTimer: true,
  quizShowAnswerImmediate: false,
  quizReviewErrors: true,
  quizAllowRetake: true,
  quizSaveStats: true,

  notifAdhkar: true,
  notifQuran: true,
  notifStories: true,
  notifNews: false,
  notifAds: false,
  notifImportantOnly: false,

  aiMasterEnabled: true,
  aiSummarizeLessons: true,
  aiLearningPlan: true,
  aiPersonalizeHome: true,
  aiAnalyzeInterests: false,

  favorites: [],
  recentKeys: [],
  hideUnused: false,
};

export const BRAND_ACCENT_OPTIONS: { id: BrandAccent; label: string; swatch: string }[] = [
  { id: "emerald", label: "زمردي (افتراضي)", swatch: "#143F35" },
  { id: "forest", label: "غابي", swatch: "#1B4D3E" },
  { id: "olive", label: "زيتوني", swatch: "#3D4F2F" },
  { id: "teal", label: "فيروزي هادئ", swatch: "#1F5C55" },
];

export const COUNTRY_OPTIONS = [
  "الكويت", "السعودية", "الإمارات", "قطر", "البحرين", "عُمان",
  "مصر", "الأردن", "سوريا", "العراق", "المغرب", "الجزائر", "تونس",
  "تركيا", "أخرى",
] as const;

const RECENT_MAX = 12;
const FAVORITES_MAX = 16;

export function readAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.slice(0, FAVORITES_MAX) : [],
      recentKeys: Array.isArray(parsed.recentKeys) ? parsed.recentKeys.slice(0, RECENT_MAX) : [],
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function applyAppSettings(settings: AppSettings = readAppSettings()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.uiDensity = settings.uiDensity;
  root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
  root.dataset.ornaments = settings.showOrnaments ? "on" : "off";
  root.dataset.brandAccent = settings.brandAccent;
  root.dataset.a11yLargeText = settings.largeText ? "true" : "false";
  root.dataset.a11yContrast = settings.highContrast ? "true" : "false";
  root.dataset.a11yLargeButtons = settings.largeButtons ? "true" : "false";
  root.dataset.a11yColorBlind = settings.colorBlindFriendly ? "true" : "false";
  if (settings.reduceMotion) {
    root.style.setProperty("--motion-scale", "0");
  } else {
    root.style.removeProperty("--motion-scale");
  }
  if (settings.largeText) {
    root.style.setProperty("--a11y-font-boost", "1.12");
  } else {
    root.style.removeProperty("--a11y-font-boost");
  }
}

export function writeAppSettings(patch: Partial<AppSettings>, recentKey?: string): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  const current = readAppSettings();
  let recentKeys = current.recentKeys;
  if (recentKey) {
    recentKeys = [recentKey, ...recentKeys.filter((k) => k !== recentKey)].slice(0, RECENT_MAX);
  }
  const next: AppSettings = { ...current, ...patch, recentKeys };
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  applyAppSettings(next);
  return next;
}

export function toggleFavoriteSetting(key: string): AppSettings {
  const current = readAppSettings();
  const has = current.favorites.includes(key);
  const favorites = has
    ? current.favorites.filter((k) => k !== key)
    : [key, ...current.favorites].slice(0, FAVORITES_MAX);
  return writeAppSettings({ favorites });
}

export function resetAppSettingsSection(keys: (keyof AppSettings)[]): AppSettings {
  const patch = {} as Partial<AppSettings>;
  for (const key of keys) {
    (patch as Record<string, unknown>)[key] = DEFAULT_APP_SETTINGS[key];
  }
  return writeAppSettings(patch);
}

export function resetAllAppSettings(): AppSettings {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(DEFAULT_APP_SETTINGS));
  } catch {
    /* ignore */
  }
  applyAppSettings(DEFAULT_APP_SETTINGS);
  return { ...DEFAULT_APP_SETTINGS };
}

/** تقدير تقريبي لحجم بيانات localStorage ذات الصلة بالتطبيق. */
export function estimateLocalStorageBytes(): { total: number; downloads: number; cache: number } {
  if (typeof localStorage === "undefined") return { total: 0, downloads: 0, cache: 0 };
  let total = 0;
  let downloads = 0;
  let cache = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    const val = localStorage.getItem(key) || "";
    const size = (key.length + val.length) * 2;
    total += size;
    if (/offline|download|cache|quran-pages|pack/i.test(key)) downloads += size;
    if (/cache|tmp|temp/i.test(key)) cache += size;
  }
  return { total, downloads, cache };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} ب`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}
