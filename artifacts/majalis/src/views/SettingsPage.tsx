import { lazy, Suspense, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Accessibility,
  Bell,
  BookOpen,
  Brain,
  ChevronRight,
  GraduationCap,
  HardDrive,
  Heart,
  Info,
  Library,
  Moon,
  Palette,
  Search,
  Shield,
  Star,
  UserRound,
  HelpCircle,
  Clock3,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuranPreferences, type QuranFontId } from "@/hooks/useQuranPreferences";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme-preference";
import { LANG_META, type Lang } from "@/lib/language-preference";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/user-preferences";
import { clearQuranCache } from "@/lib/quran-api";
import { clearLocalBookmarks } from "@/lib/local-bookmarks";
import { clearOfflineReading } from "@/lib/offline-reading-pack";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  type AdhanPreferences,
} from "@/lib/adhan-preferences";
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
} from "@/lib/prayer-times";
import {
  APP_SETTINGS_KEY,
  BRAND_ACCENT_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_APP_SETTINGS,
  applyAppSettings,
  estimateLocalStorageBytes,
  formatBytes,
  readAppSettings,
  resetAllAppSettings,
  resetAppSettingsSection,
  toggleFavoriteSetting,
  writeAppSettings,
  type AppSettings,
  type BrandAccent,
} from "@/lib/app-settings";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL, mailtoWithSubject } from "@/lib/site-config";
import { PushPrompt } from "@/components/PushPrompt";
import {
  SettingsActionRow,
  SettingsChoiceRow,
  SettingsGroup,
  SettingsInfoRow,
  SettingsLinkRow,
  SettingsNavRow,
  SettingsSelectRow,
  SettingsSliderRow,
  SettingsToggleRow,
} from "@/components/settings/SettingsPrimitives";
import "@/styles/pages/settings.css";

type SectionId =
  | "account"
  | "appearance"
  | "quran"
  | "prayer"
  | "adhkar"
  | "learning"
  | "library"
  | "quizzes"
  | "notifications"
  | "privacy"
  | "accessibility"
  | "storage"
  | "ai"
  | "about";

type SectionMeta = {
  id: SectionId;
  title: string;
  subtitle: string;
  tone: string;
  icon: ReactNode;
  keywords: string[];
};

const SECTIONS: SectionMeta[] = [
  { id: "account", title: "الحساب", subtitle: "الاسم والبريد واللغة والدولة", tone: "account", icon: <UserRound />, keywords: ["حساب", "بريد", "خروج", "لغة", "دولة"] },
  { id: "appearance", title: "المظهر", subtitle: "الوضع والخط والكثافة والهوية", tone: "appearance", icon: <Palette />, keywords: ["مظهر", "داكن", "فاتح", "خط", "حركة", "لون"] },
  { id: "quran", title: "القرآن الكريم", subtitle: "المصحف والخط والتلاوة", tone: "quran", icon: <BookOpen />, keywords: ["قرآن", "مصحف", "آية", "تفسير", "قارئ"] },
  { id: "prayer", title: "الصلاة", subtitle: "المواقيت والأذان والتنبيهات", tone: "prayer", icon: <Moon />, keywords: ["صلاة", "أذان", "مواقيت", "جمعة"] },
  { id: "adhkar", title: "الأذكار", subtitle: "العد والتذكير والاهتزاز", tone: "adhkar", icon: <Heart />, keywords: ["أذكار", "تسبيح", "استغفار"] },
  { id: "learning", title: "التعلم", subtitle: "الدروس والتشغيل والجودة", tone: "learning", icon: <GraduationCap />, keywords: ["دروس", "فيديو", "تشغيل"] },
  { id: "library", title: "المكتبة", subtitle: "عرض الكتب والتنزيلات", tone: "library", icon: <Library />, keywords: ["كتب", "مكتبة", "غلاف"] },
  { id: "quizzes", title: "الاختبارات", subtitle: "الصعوبة والمؤقت والمراجعة", tone: "quizzes", icon: <HelpCircle />, keywords: ["اختبار", "أسئلة", "مؤقت"] },
  { id: "notifications", title: "الإشعارات", subtitle: "الدروس والمناسبات والتنبيهات", tone: "notifications", icon: <Bell />, keywords: ["إشعار", "تنبيه", "أخبار"] },
  { id: "privacy", title: "الخصوصية", subtitle: "البيانات والحساب والسياسات", tone: "privacy", icon: <Shield />, keywords: ["خصوصية", "حذف", "تصدير"] },
  { id: "accessibility", title: "إمكانية الوصول", subtitle: "التباين والحركة والتكبير", tone: "accessibility", icon: <Accessibility />, keywords: ["وصول", "تباين", "قارئ"] },
  { id: "storage", title: "التخزين", subtitle: "الكاش والتنزيلات والتنظيف", tone: "storage", icon: <HardDrive />, keywords: ["تخزين", "كاش", "تنظيف"] },
  { id: "ai", title: "الذكاء الاصطناعي", subtitle: "الاقتراحات والتلخيص والخطة", tone: "ai", icon: <Brain />, keywords: ["ذكاء", "اقتراح", "تلخيص"] },
  { id: "about", title: "حول التطبيق", subtitle: "الإصدار والتواصل والمساهمة", tone: "about", icon: <Info />, keywords: ["حول", "إصدار", "تقييم", "مشكلة"] },
];

const SECTION_RESET_KEYS: Partial<Record<SectionId, (keyof AppSettings)[]>> = {
  appearance: ["uiDensity", "reduceMotion", "showOrnaments", "brandAccent"],
  quran: ["showSurahNames", "showWaqfMarks", "defaultTafsir", "autoPlayTilawa", "defaultReciter"],
  prayer: ["calcMethod", "asrMadhab", "minuteAdjust", "fullAdhan", "takbeerOnly", "alertTone", "prayerVibrate", "showCountdown", "silentDuringPrayer"],
  adhkar: ["adhkarDefaultCount", "adhkarSound", "adhkarVibrate", "adhkarTrackProgress", "adhkarMorningReminder", "adhkarEveningReminder", "adhkarSleepReminder", "adhkarIstighfarReminder"],
  learning: ["resumeLastLesson", "lessonAutoplay", "playbackSpeed", "videoQuality", "downloadLessons", "showCaptions", "hideCompletedLessons", "smartLessonSuggest"],
  library: ["libraryView", "coverSize", "smartBookSearch", "downloadBooks"],
  quizzes: ["quizDifficulty", "quizQuestionCount", "quizTimer", "quizShowAnswerImmediate", "quizReviewErrors", "quizAllowRetake", "quizSaveStats"],
  notifications: ["notifAdhkar", "notifQuran", "notifStories", "notifNews", "notifAds", "notifImportantOnly"],
  accessibility: ["largeText", "highContrast", "largeButtons", "colorBlindFriendly", "screenReaderHints", "reduceMotion"],
  ai: ["aiMasterEnabled", "aiSummarizeLessons", "aiLearningPlan", "aiPersonalizeHome", "aiAnalyzeInterests"],
  account: ["country"],
};

type SearchHit = {
  key: string;
  section: SectionId;
  title: string;
  description?: string;
};

const SEARCH_INDEX: SearchHit[] = [
  { key: "account.language", section: "account", title: "اللغة", description: "لغة واجهة التطبيق" },
  { key: "account.country", section: "account", title: "الدولة", description: "الدولة الافتراضية للتفضيلات المحلية" },
  { key: "account.logout", section: "account", title: "تسجيل الخروج" },
  { key: "appearance.theme", section: "appearance", title: "الوضع", description: "فاتح أو داكن أو حسب النظام" },
  { key: "appearance.fontSize", section: "appearance", title: "حجم الخط" },
  { key: "appearance.density", section: "appearance", title: "كثافة الواجهة" },
  { key: "appearance.motion", section: "appearance", title: "تقليل الحركة" },
  { key: "appearance.ornaments", section: "appearance", title: "الزخارف الإسلامية" },
  { key: "appearance.brand", section: "appearance", title: "لون الهوية" },
  { key: "quran.font", section: "quran", title: "خط المصحف" },
  { key: "quran.scale", section: "quran", title: "حجم خط القرآن" },
  { key: "quran.ayah", section: "quran", title: "أرقام الآيات" },
  { key: "prayer.adhan", section: "prayer", title: "الأذان", description: "تشغيل الأذان والتنبيهات" },
  { key: "prayer.method", section: "prayer", title: "طريقة حساب المواقيت" },
  { key: "adhkar.count", section: "adhkar", title: "عدد التسبيحات" },
  { key: "learning.autoplay", section: "learning", title: "التشغيل التلقائي" },
  { key: "library.view", section: "library", title: "عرض الكتب" },
  { key: "quizzes.difficulty", section: "quizzes", title: "مستوى الصعوبة" },
  { key: "notifications.lessons", section: "notifications", title: "إشعارات الدروس" },
  { key: "privacy.delete", section: "privacy", title: "حذف الحساب" },
  { key: "a11y.contrast", section: "accessibility", title: "تباين مرتفع" },
  { key: "storage.cache", section: "storage", title: "تنظيف الكاش" },
  { key: "ai.master", section: "ai", title: "المزايا الذكية" },
  { key: "about.version", section: "about", title: "الإصدار" },
];

function isSectionId(value: string | null): value is SectionId {
  return !!value && SECTIONS.some((s) => s.id === value);
}

function SectionFallback() {
  return <p className="ios-set-empty">جاري التحميل…</p>;
}

/* تحميل كسول لمحتوى الأقسام الثقيلة نسبيًا */
const LazyPushPrompt = lazy(async () => ({ default: PushPrompt }));

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const sectionParam = params.get("s");
  const activeSection = isSectionId(sectionParam) ? sectionParam : null;

  const { user, isLoggedIn, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { preference: themePreference, resolvedTheme, setPreference: setThemePreference } = useThemePreference();
  const { preferences, updatePreferences } = useUserPreferences();
  const { prefs: quranPrefs, setPref: setQuranPref } = useQuranPreferences();

  const [app, setApp] = useState<AppSettings>(() => readAppSettings());
  const [adhan, setAdhan] = useState<AdhanPreferences>(() => loadAdhanPrefs());
  const [govId, setGovId] = useState(() => getSelectedGovernorate().id);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const [storageStats, setStorageStats] = useState(() => estimateLocalStorageBytes());

  useEffect(() => {
    applyPageSeo({
      path: "/settings",
      title: `الإعدادات | ${SITE_NAME}`,
      description: "إعدادات المجلس العلمي بأسلوب منظم: الحساب، المظهر، القرآن، الصلاة، الخصوصية والمزيد.",
      keywords: ["إعدادات", SITE_NAME, "تفضيلات"],
      robots: "noindex, follow",
    });
    applyAppSettings(readAppSettings());
  }, []);

  const openSection = (id: SectionId | null) => {
    startTransition(() => {
      if (!id) {
        setLocation("/settings");
        return;
      }
      setLocation(`/settings?s=${id}`);
    });
  };

  const patchApp = <K extends keyof AppSettings>(key: K, value: AppSettings[K], recentKey?: string) => {
    setApp(writeAppSettings({ [key]: value } as Partial<AppSettings>, recentKey ?? String(key)));
  };

  const patchUser = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K], recentKey?: string) => {
    updatePreferences({ [key]: value });
    if (recentKey) setApp(writeAppSettings({}, recentKey));
  };

  const patchAdhan = (patch: Partial<AdhanPreferences>, recentKey?: string) => {
    const next = patchAdhanPrefs(patch);
    setAdhan(next);
    if (recentKey) setApp(writeAppSettings({}, recentKey));
  };

  const onToggleFavorite = (key: string) => setApp(toggleFavoriteSetting(key));
  const fav = (key: string) => app.favorites.includes(key);

  const filteredSections = useMemo(() => {
    const q = query.trim();
    if (!q) return SECTIONS;
    const needle = q.toLocaleLowerCase("ar");
    const hitIds = new Set(
      SEARCH_INDEX.filter(
        (h) =>
          h.title.toLocaleLowerCase("ar").includes(needle) ||
          (h.description || "").toLocaleLowerCase("ar").includes(needle),
      ).map((h) => h.section),
    );
    return SECTIONS.filter(
      (s) =>
        hitIds.has(s.id) ||
        s.title.includes(q) ||
        s.subtitle.includes(q) ||
        s.keywords.some((k) => k.includes(q)),
    );
  }, [query]);

  const searchHits = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as SearchHit[];
    const needle = q.toLocaleLowerCase("ar");
    return SEARCH_INDEX.filter(
      (h) =>
        h.title.toLocaleLowerCase("ar").includes(needle) ||
        (h.description || "").toLocaleLowerCase("ar").includes(needle) ||
        h.key.includes(needle),
    ).slice(0, 12);
  }, [query]);

  const recentHits = useMemo(
    () =>
      app.recentKeys
        .map((key) => SEARCH_INDEX.find((h) => h.key === key || h.key.endsWith(key) || key.includes(h.key)))
        .filter(Boolean) as SearchHit[],
    [app.recentKeys],
  );

  const favoriteHits = useMemo(
    () =>
      app.favorites
        .map((key) => SEARCH_INDEX.find((h) => h.key === key) || { key, section: "appearance" as SectionId, title: key })
        .slice(0, 8),
    [app.favorites],
  );

  const sectionTitle = activeSection
    ? SECTIONS.find((s) => s.id === activeSection)?.title || "الإعدادات"
    : "الإعدادات";

  const resetSection = () => {
    if (!activeSection) return;
    const keys = SECTION_RESET_KEYS[activeSection];
    if (keys?.length) setApp(resetAppSettingsSection(keys));
    if (activeSection === "appearance") {
      setThemePreference("light");
      updatePreferences({ fontSize: DEFAULT_PREFERENCES.fontSize, numeralSystem: DEFAULT_PREFERENCES.numeralSystem });
    }
    if (activeSection === "quran") {
      setQuranPref("fontScale", 26);
      setQuranPref("fontId", "uthmani");
      setQuranPref("showAyahNumbers", true);
      setQuranPref("pageMode", "precision");
    }
    if (activeSection === "notifications") {
      updatePreferences({
        lessonNotifications: DEFAULT_PREFERENCES.lessonNotifications,
        lectureNotifications: DEFAULT_PREFERENCES.lectureNotifications,
        contentNotifications: DEFAULT_PREFERENCES.contentNotifications,
        updateNotifications: DEFAULT_PREFERENCES.updateNotifications,
        occasionNotifications: DEFAULT_PREFERENCES.occasionNotifications,
      });
    }
  };

  const resetEverything = () => {
    if (!window.confirm("إعادة ضبط جميع الإعدادات المحلية؟ لا يمكن التراجع.")) return;
    setApp(resetAllAppSettings());
    updatePreferences(DEFAULT_PREFERENCES);
    setThemePreference("light");
    setQuranPref("fontScale", 26);
    setQuranPref("fontId", "uthmani");
    setQuranPref("showAyahNumbers", true);
    patchAdhanPrefs({ ...loadAdhanPrefs(), ...{ globalEnabled: true, fridayBannerEnabled: true } });
    setAdhan(loadAdhanPrefs());
  };

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ preferences, app, themePreference, quranPrefs, adhan }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "majlisilm-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearUsage = () => {
    if (!window.confirm("حذف سجل الاستخدام المحلي (الإشارات المرجعية والتقدّم)؟")) return;
    clearLocalBookmarks();
    try {
      localStorage.removeItem("majalis-reading-progress-v1");
    } catch {
      /* ignore */
    }
    setStorageStats(estimateLocalStorageBytes());
  };

  const clearCache = () => {
    clearQuranCache();
    setStorageStats(estimateLocalStorageBytes());
  };

  const clearTemp = async () => {
    await clearOfflineReading();
    setStorageStats(estimateLocalStorageBytes());
  };

  const avatarLetter = (user?.profile?.name || user?.email || "م").slice(0, 1);
  const avatarUrl = (user?.profile as { avatar_url?: string } | undefined)?.avatar_url;

  return (
    <div className="ios-settings" dir="rtl">
      <header className="ios-set-header">
        <div className="ios-set-header__bar">
          {activeSection ? (
            <button type="button" className="ios-set-back" onClick={() => openSection(null)}>
              <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
              الإعدادات
            </button>
          ) : (
            <button
              type="button"
              className="ios-set-back"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else setLocation("/");
              }}
            >
              <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
              رجوع
            </button>
          )}
          <h1 className="ios-set-header__title">{sectionTitle}</h1>
          <span className="ios-set-header__spacer" aria-hidden="true" />
        </div>
        {!activeSection ? (
          <label className="ios-set-search">
            <Search size={16} strokeWidth={2.2} aria-hidden="true" />
            <input
              type="search"
              name="settings-search"
              placeholder="بحث في الإعدادات"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
        ) : null}
      </header>

      {!activeSection ? (
        <div className="ios-set-panel">
          {query.trim() ? (
            <SettingsGroup title="نتائج البحث" footer={searchHits.length ? undefined : "لا نتائج مطابقة"}>
              {searchHits.map((hit) => (
                <SettingsNavRow
                  key={hit.key}
                  title={hit.title}
                  subtitle={hit.description}
                  onClick={() => {
                    setQuery("");
                    openSection(hit.section);
                  }}
                />
              ))}
              {filteredSections.map((s) => (
                <SettingsNavRow
                  key={`sec-${s.id}`}
                  icon={s.icon}
                  iconTone={s.tone}
                  title={s.title}
                  subtitle={s.subtitle}
                  onClick={() => {
                    setQuery("");
                    openSection(s.id);
                  }}
                />
              ))}
            </SettingsGroup>
          ) : (
            <>
              {favoriteHits.length > 0 ? (
                <SettingsGroup title="المفضلة">
                  {favoriteHits.map((hit) => (
                    <SettingsNavRow
                      key={hit.key}
                      icon={<Star />}
                      iconTone="fav"
                      title={hit.title}
                      subtitle={hit.description}
                      onClick={() => openSection(hit.section)}
                    />
                  ))}
                </SettingsGroup>
              ) : null}

              {recentHits.length > 0 ? (
                <SettingsGroup title="آخر التعديلات">
                  {recentHits.map((hit) => (
                    <SettingsNavRow
                      key={`recent-${hit.key}`}
                      icon={<Clock3 />}
                      iconTone="recent"
                      title={hit.title}
                      subtitle={SECTIONS.find((s) => s.id === hit.section)?.title}
                      onClick={() => openSection(hit.section)}
                    />
                  ))}
                </SettingsGroup>
              ) : null}

              <SettingsGroup title="الأقسام">
                {filteredSections.map((s) => (
                  <SettingsNavRow
                    key={s.id}
                    icon={s.icon}
                    iconTone={s.tone}
                    title={s.title}
                    subtitle={s.subtitle}
                    onClick={() => openSection(s.id)}
                  />
                ))}
              </SettingsGroup>

              <SettingsGroup title="إعادة الضبط" footer="يُعاد ضبط التفضيلات المحلية فقط دون حذف حسابك.">
                <SettingsActionRow
                  title="إعادة ضبط جميع الإعدادات"
                  description="استعادة القيم الافتراضية للمظهر والإشعارات والتفضيلات"
                  destructive
                  onClick={resetEverything}
                />
              </SettingsGroup>
            </>
          )}
        </div>
      ) : (
        <div className="ios-set-panel" key={activeSection}>
          {activeSection === "account" && (
            <>
              <SettingsGroup>
                <div className="ios-set-profile">
                  <div className="ios-set-avatar" aria-hidden="true">
                    {avatarUrl ? <img src={avatarUrl} alt="" /> : avatarLetter}
                  </div>
                  <div className="ios-set-profile__meta">
                    <p className="ios-set-profile__name">{user?.profile?.name || t("settings_guest")}</p>
                    <p className="ios-set-profile__email">{user?.email || t("settings_not_logged_in")}</p>
                  </div>
                </div>
              </SettingsGroup>

              <SettingsGroup title="الملف الشخصي">
                <SettingsInfoRow title="الاسم" value={user?.profile?.name || "—"} description="يُعرض من حسابك عند تسجيل الدخول" />
                <SettingsInfoRow title="البريد الإلكتروني" value={user?.email || "—"} />
                <SettingsSelectRow
                  title="اللغة"
                  description="لغة واجهة التطبيق"
                  value={lang}
                  options={LANG_META.map((m) => ({ value: m.code, label: m.nativeName }))}
                  onChange={(v) => {
                    setLang(v as Lang);
                    setApp(writeAppSettings({}, "account.language"));
                  }}
                  favoriteKey="account.language"
                  isFavorite={fav("account.language")}
                  onToggleFavorite={onToggleFavorite}
                />
                <SettingsSelectRow
                  title="الدولة"
                  description="للتفضيلات المحلية والعرض"
                  value={app.country}
                  options={COUNTRY_OPTIONS.map((c) => ({ value: c, label: c }))}
                  onChange={(v) => patchApp("country", v, "account.country")}
                  favoriteKey="account.country"
                  isFavorite={fav("account.country")}
                  onToggleFavorite={onToggleFavorite}
                />
              </SettingsGroup>

              <SettingsGroup>
                {isLoggedIn ? (
                  <SettingsActionRow title="تسجيل الخروج" description="الخروج من هذا الجهاز" destructive onClick={() => logout()} />
                ) : (
                  <>
                    <SettingsLinkRow title="تسجيل الدخول" href="/login" description="للمزامنة والحفظ السحابي" />
                    <SettingsLinkRow title="إنشاء حساب" href="/register" />
                  </>
                )}
              </SettingsGroup>
            </>
          )}

          {activeSection === "appearance" && (
            <>
              <SettingsGroup title="السمة" footer={`الوضع الحالي: ${resolvedTheme === "dark" ? "داكن" : "فاتح"}`}>
                <SettingsChoiceRow
                  title="مظهر التطبيق"
                  description="فاتح، داكن، أو حسب النظام"
                  value={themePreference}
                  options={THEME_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
                  onChange={(v) => {
                    setThemePreference(v as ThemePreference);
                    setApp(writeAppSettings({}, "appearance.theme"));
                  }}
                />
              </SettingsGroup>

              <SettingsGroup title="الخط والواجهة">
                <SettingsChoiceRow
                  title="حجم الخط"
                  description="يؤثر على واجهة التطبيق بالكامل"
                  value={preferences.fontSize}
                  options={[
                    { value: "صغير", label: "صغير" },
                    { value: "متوسط", label: "متوسط" },
                    { value: "كبير", label: "كبير" },
                  ]}
                  onChange={(v) => patchUser("fontSize", v as UserPreferences["fontSize"], "appearance.fontSize")}
                />
                <SettingsInfoRow
                  title="نوع الخط العربي"
                  value="Alexandria"
                  description="خط المنصة الموحّد للقراءة والواجهة"
                />
                <SettingsChoiceRow
                  title="كثافة الواجهة"
                  description="المسافات بين العناصر"
                  value={app.uiDensity}
                  options={[
                    { value: "compact", label: "مضغوطة" },
                    { value: "comfortable", label: "مريحة" },
                    { value: "spacious", label: "واسعة" },
                  ]}
                  onChange={(v) => patchApp("uiDensity", v as AppSettings["uiDensity"], "appearance.density")}
                />
                <SettingsSelectRow
                  title="نظام الأرقام"
                  value={preferences.numeralSystem}
                  options={[
                    { value: "عربي", label: "عربي (٠١٢٣)" },
                    { value: "إنجليزي", label: "إنجليزي (0123)" },
                  ]}
                  onChange={(v) => patchUser("numeralSystem", v as UserPreferences["numeralSystem"])}
                />
              </SettingsGroup>

              <SettingsGroup title="الحركة والزخارف">
                <SettingsToggleRow
                  title="تقليل الحركة"
                  description="إخفاء الانتقالات والحركات غير الضرورية"
                  checked={app.reduceMotion}
                  onChange={(v) => patchApp("reduceMotion", v, "appearance.motion")}
                  favoriteKey="appearance.motion"
                  isFavorite={fav("appearance.motion")}
                  onToggleFavorite={onToggleFavorite}
                />
                <SettingsToggleRow
                  title="الخلفيات والزخارف الإسلامية"
                  description="إظهار الزخارف الخفيفة في الواجهة"
                  checked={app.showOrnaments}
                  onChange={(v) => patchApp("showOrnaments", v, "appearance.ornaments")}
                  favoriteKey="appearance.ornaments"
                  isFavorite={fav("appearance.ornaments")}
                  onToggleFavorite={onToggleFavorite}
                />
              </SettingsGroup>

              <SettingsGroup title="لون الهوية" footer="بدائل رسمية مستمدة من هوية المجلس فقط.">
                <div className="ios-set-swatches" role="group" aria-label="لون الهوية">
                  {BRAND_ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`ios-set-swatch${app.brandAccent === opt.id ? " is-active" : ""}`}
                      style={{ background: opt.swatch }}
                      aria-label={opt.label}
                      aria-pressed={app.brandAccent === opt.id}
                      onClick={() => patchApp("brandAccent", opt.id as BrandAccent, "appearance.brand")}
                    />
                  ))}
                </div>
              </SettingsGroup>
            </>
          )}

          {activeSection === "quran" && (
            <>
              <SettingsGroup title="المصحف">
                <SettingsChoiceRow
                  title="نوع المصحف"
                  description="دقة مطابقة المطبوع أو وضع خفيف"
                  value={quranPrefs.pageMode}
                  options={[
                    { value: "precision", label: "دقيق" },
                    { value: "light", label: "خفيف" },
                  ]}
                  onChange={(v) => {
                    setQuranPref("pageMode", v as "precision" | "light");
                    setApp(writeAppSettings({}, "quran.mode"));
                  }}
                />
                <SettingsSliderRow
                  title="حجم الخط"
                  description="حجم نص الآيات في القارئ"
                  min={18}
                  max={40}
                  value={quranPrefs.fontScale}
                  display={`${quranPrefs.fontScale}px`}
                  onChange={(v) => {
                    setQuranPref("fontScale", v);
                    setApp(writeAppSettings({}, "quran.scale"));
                  }}
                />
                <SettingsSelectRow
                  title="نوع الخط"
                  value={quranPrefs.fontId}
                  options={[
                    { value: "uthmani", label: "عثماني" },
                    { value: "naskh", label: "نسخ" },
                    { value: "amiri", label: "أميري" },
                  ]}
                  onChange={(v) => {
                    setQuranPref("fontId", v as QuranFontId);
                    setApp(writeAppSettings({}, "quran.font"));
                  }}
                  favoriteKey="quran.font"
                  isFavorite={fav("quran.font")}
                  onToggleFavorite={onToggleFavorite}
                />
              </SettingsGroup>

              <SettingsGroup title="العرض">
                <SettingsToggleRow
                  title="إظهار أرقام الآيات"
                  checked={quranPrefs.showAyahNumbers}
                  onChange={(v) => {
                    setQuranPref("showAyahNumbers", v);
                    setApp(writeAppSettings({}, "quran.ayah"));
                  }}
                  favoriteKey="quran.ayah"
                  isFavorite={fav("quran.ayah")}
                  onToggleFavorite={onToggleFavorite}
                />
                <SettingsToggleRow
                  title="إظهار أسماء السور"
                  checked={app.showSurahNames}
                  onChange={(v) => patchApp("showSurahNames", v)}
                />
                <SettingsToggleRow
                  title="علامات الوقف"
                  description="إظهار رموز الوقف المعتمدة"
                  checked={app.showWaqfMarks}
                  onChange={(v) => patchApp("showWaqfMarks", v)}
                />
                <SettingsSelectRow
                  title="التفسير الافتراضي"
                  value={app.defaultTafsir}
                  options={[
                    { value: "الميسّر", label: "الميسّر" },
                    { value: "السعدي", label: "السعدي" },
                    { value: "ابن كثير", label: "ابن كثير" },
                  ]}
                  onChange={(v) => patchApp("defaultTafsir", v)}
                />
              </SettingsGroup>

              <SettingsGroup title="التلاوة">
                <SettingsToggleRow
                  title="تشغيل التلاوة تلقائياً"
                  checked={app.autoPlayTilawa}
                  onChange={(v) => patchApp("autoPlayTilawa", v)}
                />
                <SettingsSelectRow
                  title="القارئ الافتراضي"
                  value={app.defaultReciter}
                  options={[
                    { value: "مشاري العفاسي", label: "مشاري العفاسي" },
                    { value: "محمود خليل الحصري", label: "محمود خليل الحصري" },
                    { value: "عبد الباسط عبد الصمد", label: "عبد الباسط عبد الصمد" },
                    { value: "ماهر المعيقلي", label: "ماهر المعيقلي" },
                  ]}
                  onChange={(v) => patchApp("defaultReciter", v)}
                />
                <SettingsLinkRow title="آخر موضع قراءة" href="/quran" description="متابعة من حيث توقفت" />
                <SettingsActionRow
                  title="تنزيل السور للاستخدام بدون إنترنت"
                  description="إدارة حزمة القراءة دون اتصال"
                  onClick={() => setLocation("/quran")}
                />
              </SettingsGroup>
            </>
          )}

          {activeSection === "prayer" && (
            <>
              <SettingsGroup title="المواقيت">
                <SettingsSelectRow
                  title="طريقة حساب المواقيت"
                  value={app.calcMethod}
                  options={[
                    { value: "أم القرى", label: "أم القرى" },
                    { value: "رابطة العالم الإسلامي", label: "رابطة العالم الإسلامي" },
                    { value: "الهيئة المصرية", label: "الهيئة المصرية" },
                    { value: "الكويت", label: "الكويت" },
                  ]}
                  onChange={(v) => patchApp("calcMethod", v, "prayer.method")}
                  favoriteKey="prayer.method"
                  isFavorite={fav("prayer.method")}
                  onToggleFavorite={onToggleFavorite}
                />
                <SettingsChoiceRow
                  title="المذهب الفقهي للعصر"
                  value={app.asrMadhab}
                  options={[
                    { value: "شافعي", label: "شافعي / مالكي / حنبلي" },
                    { value: "حنفي", label: "حنفي" },
                  ]}
                  onChange={(v) => patchApp("asrMadhab", v as AppSettings["asrMadhab"])}
                />
                <SettingsSelectRow
                  title="المدينة"
                  description="محافظة الكويت لحساب المواقيت"
                  value={govId}
                  options={KUWAIT_GOVERNORATES.map((g) => ({ value: g.id, label: g.name }))}
                  onChange={(v) => {
                    setSelectedGovernorate(v);
                    setGovId(v);
                    setApp(writeAppSettings({}, "prayer.city"));
                  }}
                />
                <SettingsSliderRow
                  title="تعديل الدقائق"
                  description="إزاحة يدوية لجميع الأوقات"
                  min={-15}
                  max={15}
                  value={app.minuteAdjust}
                  display={`${app.minuteAdjust > 0 ? "+" : ""}${app.minuteAdjust} د`}
                  onChange={(v) => patchApp("minuteAdjust", v)}
                />
              </SettingsGroup>

              <SettingsGroup title="التنبيهات">
                <SettingsToggleRow
                  title="تفعيل الأذان"
                  description="التنبيهات العامة للأوقات"
                  checked={adhan.globalEnabled}
                  onChange={(v) => patchAdhan({ globalEnabled: v }, "prayer.adhan")}
                  favoriteKey="prayer.adhan"
                  isFavorite={fav("prayer.adhan")}
                  onToggleFavorite={onToggleFavorite}
                />
                <SettingsToggleRow
                  title="الأذان الكامل"
                  checked={app.fullAdhan}
                  onChange={(v) => {
                    patchApp("fullAdhan", v);
                    if (v) patchApp("takbeerOnly", false);
                  }}
                />
                <SettingsToggleRow
                  title="التكبيرات فقط"
                  checked={app.takbeerOnly}
                  onChange={(v) => {
                    patchApp("takbeerOnly", v);
                    if (v) patchApp("fullAdhan", false);
                  }}
                />
                <SettingsSelectRow
                  title="نغمة التنبيه"
                  value={app.alertTone}
                  options={[
                    { value: "افتراضي", label: "افتراضي" },
                    { value: "هادئ", label: "هادئ" },
                    { value: "قصير", label: "قصير" },
                  ]}
                  onChange={(v) => patchApp("alertTone", v)}
                />
                <SettingsToggleRow
                  title="الاهتزاز"
                  checked={app.prayerVibrate}
                  onChange={(v) => patchApp("prayerVibrate", v)}
                />
                <SettingsToggleRow
                  title="تذكير قبل الصلاة"
                  description="يستخدم إعدادات التذكير المسبق لكل صلاة"
                  checked={adhan.silentReminderEnabled}
                  onChange={(v) => patchAdhan({ silentReminderEnabled: v })}
                />
                <SettingsToggleRow
                  title="العد التنازلي"
                  checked={app.showCountdown}
                  onChange={(v) => patchApp("showCountdown", v)}
                />
                <SettingsToggleRow
                  title="إشعارات الجمعة"
                  checked={adhan.fridayBannerEnabled}
                  onChange={(v) => patchAdhan({ fridayBannerEnabled: v })}
                />
                <SettingsToggleRow
                  title="الوضع الصامت أثناء الصلاة"
                  checked={app.silentDuringPrayer}
                  onChange={(v) => patchApp("silentDuringPrayer", v)}
                />
              </SettingsGroup>

              <SettingsGroup footer="للتخصيص التفصيلي لكل صلاة واختيار المؤذن.">
                <SettingsLinkRow title="إعدادات الأذان الكاملة" href="/adhan-settings" description="مؤذن، تذكير مسبق، وصلاحيات الجهاز" />
              </SettingsGroup>
            </>
          )}

          {activeSection === "adhkar" && (
            <SettingsGroup title="الأذكار والتسبيح">
              <SettingsSliderRow
                title="عدد التسبيحات الافتراضي"
                min={11}
                max={100}
                step={1}
                value={app.adhkarDefaultCount}
                display={String(app.adhkarDefaultCount)}
                onChange={(v) => patchApp("adhkarDefaultCount", v, "adhkar.count")}
              />
              <SettingsToggleRow title="تشغيل صوت العد" checked={app.adhkarSound} onChange={(v) => patchApp("adhkarSound", v)} />
              <SettingsToggleRow title="الاهتزاز" checked={app.adhkarVibrate} onChange={(v) => patchApp("adhkarVibrate", v)} />
              <SettingsToggleRow title="متابعة الإنجاز" checked={app.adhkarTrackProgress} onChange={(v) => patchApp("adhkarTrackProgress", v)} />
              <SettingsToggleRow title="تذكير الصباح" checked={app.adhkarMorningReminder} onChange={(v) => patchApp("adhkarMorningReminder", v)} />
              <SettingsToggleRow title="تذكير المساء" checked={app.adhkarEveningReminder} onChange={(v) => patchApp("adhkarEveningReminder", v)} />
              <SettingsToggleRow title="تذكير النوم" checked={app.adhkarSleepReminder} onChange={(v) => patchApp("adhkarSleepReminder", v)} />
              <SettingsToggleRow title="تذكير الاستغفار" checked={app.adhkarIstighfarReminder} onChange={(v) => patchApp("adhkarIstighfarReminder", v)} />
            </SettingsGroup>
          )}

          {activeSection === "learning" && (
            <SettingsGroup title="تفضيلات التعلم">
              <SettingsToggleRow title="متابعة آخر درس" checked={app.resumeLastLesson} onChange={(v) => patchApp("resumeLastLesson", v)} />
              <SettingsToggleRow
                title="التشغيل التلقائي"
                checked={preferences.videoAutoplay || app.lessonAutoplay}
                onChange={(v) => {
                  patchUser("videoAutoplay", v, "learning.autoplay");
                  patchApp("lessonAutoplay", v);
                }}
                favoriteKey="learning.autoplay"
                isFavorite={fav("learning.autoplay")}
                onToggleFavorite={onToggleFavorite}
              />
              <SettingsSelectRow
                title="سرعة التشغيل"
                value={app.playbackSpeed}
                options={["0.75", "1", "1.25", "1.5", "2"].map((s) => ({ value: s, label: `${s}×` }))}
                onChange={(v) => patchApp("playbackSpeed", v)}
              />
              <SettingsSelectRow
                title="جودة الفيديو"
                value={app.videoQuality}
                options={["تلقائي", "منخفض", "متوسط", "عالي"].map((s) => ({ value: s, label: s }))}
                onChange={(v) => patchApp("videoQuality", v)}
              />
              <SettingsSelectRow
                title="جودة الصور"
                value={preferences.imageQuality}
                options={["منخفض", "متوسط", "عالي"].map((s) => ({ value: s, label: s }))}
                onChange={(v) => patchUser("imageQuality", v as UserPreferences["imageQuality"])}
              />
              <SettingsToggleRow title="تنزيل الدروس" checked={app.downloadLessons} onChange={(v) => patchApp("downloadLessons", v)} />
              <SettingsToggleRow title="الترجمة / الترجمة النصية" checked={app.showCaptions} onChange={(v) => patchApp("showCaptions", v)} />
              <SettingsToggleRow title="إخفاء الدروس المكتملة" checked={app.hideCompletedLessons} onChange={(v) => patchApp("hideCompletedLessons", v)} />
              <SettingsToggleRow title="اقتراح الدروس الذكي" checked={app.smartLessonSuggest} onChange={(v) => patchApp("smartLessonSuggest", v)} />
            </SettingsGroup>
          )}

          {activeSection === "library" && (
            <SettingsGroup title="المكتبة">
              <SettingsChoiceRow
                title="عرض الكتب"
                value={app.libraryView}
                options={[
                  { value: "شبكة", label: "شبكة" },
                  { value: "قائمة", label: "قائمة" },
                ]}
                onChange={(v) => patchApp("libraryView", v as AppSettings["libraryView"], "library.view")}
              />
              <SettingsChoiceRow
                title="حجم الغلاف"
                value={app.coverSize}
                options={[
                  { value: "صغير", label: "صغير" },
                  { value: "متوسط", label: "متوسط" },
                  { value: "كبير", label: "كبير" },
                ]}
                onChange={(v) => patchApp("coverSize", v as AppSettings["coverSize"])}
              />
              <SettingsLinkRow title="آخر صفحة" href="/library" description="متابعة القراءة من المكتبة" />
              <SettingsToggleRow title="البحث الذكي" checked={app.smartBookSearch} onChange={(v) => patchApp("smartBookSearch", v)} />
              <SettingsToggleRow title="تنزيل الكتب" checked={app.downloadBooks} onChange={(v) => patchApp("downloadBooks", v)} />
              <SettingsActionRow title="إدارة التنزيلات" description="فتح قسم التخزين" onClick={() => openSection("storage")} />
            </SettingsGroup>
          )}

          {activeSection === "quizzes" && (
            <SettingsGroup title="الاختبارات">
              <SettingsChoiceRow
                title="مستوى الصعوبة"
                value={app.quizDifficulty}
                options={[
                  { value: "سهل", label: "سهل" },
                  { value: "متوسط", label: "متوسط" },
                  { value: "صعب", label: "صعب" },
                ]}
                onChange={(v) => patchApp("quizDifficulty", v as AppSettings["quizDifficulty"], "quizzes.difficulty")}
              />
              <SettingsSliderRow
                title="عدد الأسئلة"
                min={5}
                max={30}
                step={5}
                value={app.quizQuestionCount}
                onChange={(v) => patchApp("quizQuestionCount", v)}
              />
              <SettingsToggleRow title="المؤقت" checked={app.quizTimer} onChange={(v) => patchApp("quizTimer", v)} />
              <SettingsToggleRow title="إظهار الإجابة مباشرة" checked={app.quizShowAnswerImmediate} onChange={(v) => patchApp("quizShowAnswerImmediate", v)} />
              <SettingsToggleRow title="مراجعة الأخطاء" checked={app.quizReviewErrors} onChange={(v) => patchApp("quizReviewErrors", v)} />
              <SettingsToggleRow title="إعادة الاختبار" checked={app.quizAllowRetake} onChange={(v) => patchApp("quizAllowRetake", v)} />
              <SettingsToggleRow title="حفظ الإحصائيات" checked={app.quizSaveStats} onChange={(v) => patchApp("quizSaveStats", v)} />
            </SettingsGroup>
          )}

          {activeSection === "notifications" && (
            <>
              <SettingsGroup title="قنوات الإشعار" footer="يُحفظ كل خيار فورًا على هذا الجهاز.">
                <Suspense fallback={<SectionFallback />}>
                  <div style={{ padding: "0.75rem 1rem" }}>
                    <LazyPushPrompt />
                  </div>
                </Suspense>
                <SettingsToggleRow
                  title="الدروس"
                  checked={preferences.lessonNotifications}
                  onChange={(v) => patchUser("lessonNotifications", v, "notifications.lessons")}
                  favoriteKey="notifications.lessons"
                  isFavorite={fav("notifications.lessons")}
                  onToggleFavorite={onToggleFavorite}
                />
                <SettingsToggleRow title="المحاضرات" checked={preferences.lectureNotifications} onChange={(v) => patchUser("lectureNotifications", v)} />
                <SettingsToggleRow title="المناسبات" checked={preferences.occasionNotifications} onChange={(v) => patchUser("occasionNotifications", v)} />
                <SettingsToggleRow title="الأذكار" checked={app.notifAdhkar} onChange={(v) => patchApp("notifAdhkar", v)} />
                <SettingsToggleRow title="القرآن" checked={app.notifQuran} onChange={(v) => patchApp("notifQuran", v)} />
                <SettingsToggleRow title="القصص" checked={app.notifStories} onChange={(v) => patchApp("notifStories", v)} />
                <SettingsToggleRow title="التحديثات" checked={preferences.updateNotifications} onChange={(v) => patchUser("updateNotifications", v)} />
                <SettingsToggleRow title="الأخبار" checked={app.notifNews} onChange={(v) => patchApp("notifNews", v)} />
                <SettingsToggleRow title="الإعلانات" description="إن وُجدت إعلانات رسمية" checked={app.notifAds} onChange={(v) => patchApp("notifAds", v)} />
                <SettingsToggleRow
                  title="التنبيهات المهمة فقط"
                  description="يقلّل الإشعارات غير العاجلة"
                  checked={app.notifImportantOnly}
                  onChange={(v) => patchApp("notifImportantOnly", v)}
                />
              </SettingsGroup>
              <SettingsGroup>
                <SettingsLinkRow title="إعدادات الإشعارات المتقدمة" href="/notification-settings" />
              </SettingsGroup>
            </>
          )}

          {activeSection === "privacy" && (
            <>
              <SettingsGroup title="السياسات">
                <SettingsLinkRow title="سياسة الخصوصية" href="/privacy" />
                <SettingsLinkRow title="الشروط والأحكام" href="/terms" />
              </SettingsGroup>
              <SettingsGroup title="إدارة البيانات">
                <SettingsToggleRow
                  title="سجل البحث"
                  checked={preferences.searchHistory}
                  onChange={(v) => patchUser("searchHistory", v)}
                />
                <SettingsActionRow title="تصدير البيانات" description="تنزيل تفضيلاتك بصيغة JSON" onClick={exportData} />
                <SettingsActionRow title="حذف سجل الاستخدام" description="إشارات مرجعية وتقدّم محلي" destructive onClick={clearUsage} />
                {isLoggedIn ? (
                  <SettingsLinkRow title="حذف الحساب" href="/account-deletion" description="طلب حذف نهائي للحساب" destructive />
                ) : null}
                <SettingsInfoRow title="إدارة الأجهزة" value="هذا الجهاز" description="جلسات الأجهزة السحابية تُدار من مزوّد الحساب" />
              </SettingsGroup>
            </>
          )}

          {activeSection === "accessibility" && (
            <SettingsGroup title="إمكانية الوصول" footer="تُطبَّق فورًا على واجهة التطبيق.">
              <SettingsToggleRow title="تكبير الخط" checked={app.largeText} onChange={(v) => patchApp("largeText", v)} />
              <SettingsToggleRow
                title="تباين مرتفع"
                checked={app.highContrast}
                onChange={(v) => patchApp("highContrast", v, "a11y.contrast")}
                favoriteKey="a11y.contrast"
                isFavorite={fav("a11y.contrast")}
                onToggleFavorite={onToggleFavorite}
              />
              <SettingsToggleRow title="دعم قارئ الشاشة" description="تلميحات أوضح لعناصر التحكم" checked={app.screenReaderHints} onChange={(v) => patchApp("screenReaderHints", v)} />
              <SettingsToggleRow title="تقليل الحركة" checked={app.reduceMotion} onChange={(v) => patchApp("reduceMotion", v)} />
              <SettingsToggleRow title="تكبير الأزرار" checked={app.largeButtons} onChange={(v) => patchApp("largeButtons", v)} />
              <SettingsToggleRow title="ألوان مناسبة لضعف البصر" checked={app.colorBlindFriendly} onChange={(v) => patchApp("colorBlindFriendly", v)} />
            </SettingsGroup>
          )}

          {activeSection === "storage" && (
            <SettingsGroup title="التخزين المحلي" footer="الأرقام تقديرية من بيانات المتصفح على هذا الجهاز.">
              <SettingsInfoRow title="حجم البيانات" value={formatBytes(storageStats.total)} />
              <SettingsInfoRow title="حجم التنزيلات" value={formatBytes(storageStats.downloads)} />
              <SettingsActionRow title="تنظيف الكاش" description="مسح كاش القرآن المحلي" onClick={clearCache} />
              <SettingsActionRow title="حذف الملفات المؤقتة" description="حزمة القراءة دون اتصال" onClick={() => void clearTemp()} />
              <SettingsActionRow
                title="إعادة تنزيل المحتوى"
                description="تحديث بيانات القرآن المحلية"
                onClick={() => {
                  clearQuranCache();
                  setLocation("/quran");
                }}
              />
              <SettingsActionRow
                title="تحديث الأرقام"
                value={formatBytes(storageStats.total)}
                onClick={() => setStorageStats(estimateLocalStorageBytes())}
              />
            </SettingsGroup>
          )}

          {activeSection === "ai" && (
            <SettingsGroup title="المزايا الذكية" footer="لا تُرسل بياناتك الخاصة دون تفاعلك. يمكنك إيقاف المزايا في أي وقت.">
              <SettingsToggleRow
                title="تشغيل المزايا الذكية"
                checked={app.aiMasterEnabled && preferences.aiSuggestions}
                onChange={(v) => {
                  patchApp("aiMasterEnabled", v, "ai.master");
                  patchUser("aiSuggestions", v);
                }}
                favoriteKey="ai.master"
                isFavorite={fav("ai.master")}
                onToggleFavorite={onToggleFavorite}
              />
              <SettingsToggleRow
                title="اقتراح المحتوى"
                checked={preferences.aiSuggestions}
                onChange={(v) => patchUser("aiSuggestions", v)}
              />
              <SettingsToggleRow title="تلخيص الدروس" checked={app.aiSummarizeLessons} onChange={(v) => patchApp("aiSummarizeLessons", v)} />
              <SettingsToggleRow title="اقتراح خطة تعلم" checked={app.aiLearningPlan} onChange={(v) => patchApp("aiLearningPlan", v)} />
              <SettingsToggleRow title="تخصيص الصفحة الرئيسية" checked={app.aiPersonalizeHome} onChange={(v) => patchApp("aiPersonalizeHome", v)} />
              <SettingsToggleRow title="تحليل الاهتمامات" checked={app.aiAnalyzeInterests} onChange={(v) => patchApp("aiAnalyzeInterests", v)} />
              <SettingsSelectRow
                title="تفصيل المصادر"
                value={preferences.sourceDetailLevel}
                options={["مختصر", "تفصيلي", "كامل مع روابط"].map((s) => ({ value: s, label: s }))}
                onChange={(v) => patchUser("sourceDetailLevel", v)}
              />
              <SettingsToggleRow title="مساعد مفصّل" checked={preferences.assistantVerbose} onChange={(v) => patchUser("assistantVerbose", v)} />
            </SettingsGroup>
          )}

          {activeSection === "about" && (
            <>
              <SettingsGroup title="المعلومات">
                <SettingsInfoRow title="الإصدار" value="1.0.0" description={SITE_NAME} />
                <SettingsInfoRow title="آخر تحديث" value={new Date().toISOString().slice(0, 10)} />
                <SettingsLinkRow title="سجل التغييرات" href="/about" description="تعرّف على تطوّر المنصة" />
              </SettingsGroup>
              <SettingsGroup title="المشاركة والدعم">
                <SettingsActionRow
                  title="تقييم التطبيق"
                  description="افتح صفحة التقييم إن توفّرت على جهازك"
                  onClick={() => {
                    window.open("https://apps.apple.com", "_blank", "noopener,noreferrer");
                  }}
                />
                <SettingsActionRow
                  title="مشاركة التطبيق"
                  onClick={async () => {
                    const shareData = { title: SITE_NAME, text: SITE_NAME, url: SITE_URL };
                    try {
                      if (navigator.share) await navigator.share(shareData);
                      else await navigator.clipboard.writeText(SITE_URL);
                    } catch {
                      /* cancelled */
                    }
                  }}
                />
                <SettingsLinkRow title="التواصل" href="/contact" />
                <SettingsLinkRow title="الإبلاغ عن مشكلة" href="/contact" description="نموذج التواصل أو البريد الرسمي" />
                <SettingsLinkRow
                  title="اقتراح ميزة"
                  href={mailtoWithSubject(`اقتراح ميزة — ${SITE_NAME}`)}
                  description={CONTACT_EMAIL}
                />
                <SettingsLinkRow title="المساهمون" href="/about" />
                <SettingsLinkRow title="التراخيص" href="/terms" />
              </SettingsGroup>
            </>
          )}

          {SECTION_RESET_KEYS[activeSection] ? (
            <SettingsGroup title="هذا القسم">
              <SettingsActionRow
                title="إعادة تعيين هذا القسم"
                description="استعادة القيم الافتراضية لهذا القسم فقط"
                destructive
                onClick={resetSection}
              />
            </SettingsGroup>
          ) : null}

          <p className="ios-set-note">تُحفظ جميع التغييرات تلقائيًا — لا حاجة لزر حفظ.</p>
        </div>
      )}

      {/* مفتاح التخزين للتشخيص الداخلي فقط */}
      <span className="sr-only" data-settings-store={APP_SETTINGS_KEY} />
    </div>
  );
}
