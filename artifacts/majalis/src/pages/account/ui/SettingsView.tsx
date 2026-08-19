import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { useAuth } from "@/components/AuthProvider";
import { useFontPreference } from "@/components/FontPreferenceProvider";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme-preference";
import { clearQuranCache } from "@/lib/quran-api";
import { type UserPreferences } from "@/lib/user-preferences";
import { clearLocalBookmarks } from "@/lib/local-bookmarks";
import { clearOfflineReading } from "@/lib/offline-reading-pack";
import { useQuranPreferences, type QuranFontId } from "@/hooks/useQuranPreferences";
import {
  QURAN_FONT_MAX_PX,
  QURAN_FONT_MIN_PX,
  QURAN_FONT_STEP_PX,
} from "@/lib/quran-font-size";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/lib/supabase";
import {
  getFeaturedReciters,
  loadPlaybackRate,
  loadReciterId,
  savePlaybackRate,
  saveReciterId,
  VALID_PLAYBACK_RATES,
} from "@/lib/quran-audio";
import {
  MUSHAF_TAFSIR_EDITIONS,
  persistTafsirEdition,
  readStoredTafsirEdition,
} from "@/lib/quran-data";
import {
  readBackgroundPlaybackPref,
  restoreDefaultAppSettings,
  writeBackgroundPlaybackPref,
} from "@/lib/restore-default-settings";
import { requestFeatureTourReplay } from "@/lib/feature-tour-state";
import "@/styles/pages/settings.css";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <span>
        <strong className="settings-toggle-label">{label}</strong>
        {description ? <em className="settings-toggle-desc">{description}</em> : null}
      </span>
      <input
        type="checkbox"
        name={label.replace(/\s+/g, "-")}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

type SectionDef = {
  id: string;
  title: string;
  keywords: string;
};

export default function SettingsPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [reciterId, setReciterIdState] = useState(loadReciterId);
  const [tafsirId, setTafsirIdState] = useState(readStoredTafsirEdition);
  const [playbackRate, setPlaybackRateState] = useState(loadPlaybackRate);
  const [bgPlayback, setBgPlayback] = useState(readBackgroundPlaybackPref);

  useEffect(() => {
    applyPageSeo({
      path: "/settings",
      title: "الإعدادات | المجلس العلمي",
      description: "إعدادات القراءة والصوت والتذكيرات والخصوصية في المجلس العلمي.",
      keywords: ["إعدادات", "المجلس العلمي", "تفضيلات"],
      robots: "noindex, follow",
    });
  }, []);

  const { t } = useLanguage();
  const { preference: fontPreference } = useFontPreference();
  const {
    preference: themePreference,
    resolvedTheme,
    setPreference: setThemePreference,
  } = useThemePreference();
  const { prefs: quranPrefs, setPref: setQuranPref, bumpFont } = useQuranPreferences();
  const { preferences, updatePreferences } = useUserPreferences();

  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    updatePreferences({ [key]: value });
  };

  const reciters = useMemo(() => getFeaturedReciters("ayah"), []);
  const tafsirs = useMemo(() => MUSHAF_TAFSIR_EDITIONS, []);

  const sections: SectionDef[] = [
    { id: "account", title: t("settings_account"), keywords: "حساب دخول تسجيل خروج" },
    {
      id: "reading",
      title: "القراءة",
      keywords: "خط سمة ثيم كبار السن قراءة قرآن كثافة تباين",
    },
    {
      id: "sound",
      title: "الصوت",
      keywords: "قارئ سرعة تلاوة تشغيل خلفي صوت",
    },
    {
      id: "reminders",
      title: "التذكيرات",
      keywords: "إشعار تذكير أذان دروس محتوى",
    },
    {
      id: "downloads",
      title: "التحميلات والمساحة",
      keywords: "تنزيل كاش مساحة دون اتصال",
    },
    {
      id: "privacy",
      title: "البيانات والخصوصية",
      keywords: "خصوصية تصدير حذف بيانات",
    },
    { id: "about", title: "عن التطبيق", keywords: "حول سياسة شروط دعم مصادر جولة مزايا" },
  ];

  const q = query.trim().toLowerCase();
  const visible = (sec: SectionDef) => {
    if (!q) return true;
    return `${sec.title} ${sec.keywords}`.toLowerCase().includes(q);
  };

  const setSeniorMode = (on: boolean) => {
    if (on) {
      updatePreferences({
        seniorMode: true,
        fontSize: "كبير",
        highContrast: true,
        uiDensity: "comfortable",
        readingTextSize: String(Math.max(22, Number(preferences.readingTextSize) || 17)),
        readingSpacing: "واسع",
      });
    } else {
      update("seniorMode", false);
    }
  };

  return (
    <LegalPageLayout eyebrow={t("settings_eyebrow")} title={t("settings_title")}>
      <div className="settings-search-wrap">
        <label className="settings-search-field">
          <span className="sr-only">بحث في الإعدادات</span>
          <input
            type="search"
            name="settings-search"
            placeholder="ابحث في الإعدادات…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="page-action-btn page-action-btn--secondary"
          onClick={() => {
            restoreDefaultAppSettings(updatePreferences);
            setThemePreference("auto");
            setReciterIdState(loadReciterId());
            setTafsirIdState(readStoredTafsirEdition());
            setPlaybackRateState(1);
            setBgPlayback(false);
          }}
        >
          استعادة الإعدادات الافتراضية
        </button>
      </div>

      {visible(sections[0]!) && (
        <LegalSection title={sections[0]!.title}>
          <div className="settings-account-card">
            <div className="settings-avatar" aria-hidden="true">
              {(user?.profile?.full_name || user?.email || "م").slice(0, 1)}
            </div>
            <div>
              <p>
                <strong>{t("settings_name")}:</strong>{" "}
                {user?.profile?.full_name || t("settings_guest")}
              </p>
              <p>
                <strong>{t("settings_email")}:</strong>{" "}
                {user?.email || t("settings_not_logged_in")}
              </p>
            </div>
          </div>
          <div className="settings-actions">
            {isLoggedIn ? (
              <button type="button" className="page-action-btn" onClick={() => logout()}>
                {t("settings_logout")}
              </button>
            ) : (
              <>
                <Link href="/login" className="page-action-btn">
                  {t("settings_login")}
                </Link>
                <Link href="/register" className="page-action-btn page-action-btn--secondary">
                  {t("settings_register")}
                </Link>
              </>
            )}
          </div>
        </LegalSection>
      )}

      {visible(sections[1]!) && (
        <LegalSection title={sections[1]!.title}>
          <div className="settings-field settings-field--lang">
            <span>{t("settings_language")}</span>
            <LanguageSwitcher />
          </div>
          <p className="settings-note">{t("lang_overlay_note")}</p>
          <p className="settings-note">السمة والمظهر</p>
          <div className="settings-option-grid" role="group" aria-label="اختيار الوضع">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`settings-choice${themePreference === option.id ? " is-active" : ""}`}
                onClick={() => setThemePreference(option.id as ThemePreference)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
          <p className="settings-note">
            الوضع الحالي: {resolvedTheme === "dark" ? "داكن" : "فاتح"}
          </p>
          <ToggleRow
            label="وضع كبار السن"
            description="خط أوضح وتباين أعلى ومسافات أوسع للقراءة"
            checked={preferences.seniorMode}
            onChange={setSeniorMode}
          />
          <ToggleRow
            label="تباين مرتفع"
            description="يزيد وضوح النص والحدود دون تغيير لون الهوية"
            checked={preferences.highContrast}
            onChange={(value) => update("highContrast", value)}
          />
          <label className="settings-field">
            <span>{t("settings_font_size")}</span>
            <select
              name="interface-font-size"
              value={preferences.fontSize}
              onChange={(e) => update("fontSize", e.target.value as UserPreferences["fontSize"])}
            >
              <option>صغير</option>
              <option>متوسط</option>
              <option>كبير</option>
            </select>
          </label>
          <label className="settings-field">
            <span>{t("settings_reading_size")}</span>
            <input
              type="range"
              name="reading-text-size"
              min="16"
              max="28"
              value={preferences.readingTextSize}
              onChange={(e) => update("readingTextSize", e.target.value)}
            />
            <strong>{preferences.readingTextSize}px</strong>
          </label>
          <label className="settings-field">
            <span>{t("settings_quran_font_size")}</span>
            <input
              type="range"
              min={QURAN_FONT_MIN_PX}
              max={QURAN_FONT_MAX_PX}
              step={QURAN_FONT_STEP_PX}
              value={quranPrefs.fontScale}
              onChange={(e) => setQuranPref("fontScale", Number(e.target.value))}
            />
            <strong>{quranPrefs.fontScale}px</strong>
          </label>
          <label className="settings-field">
            <span>{t("settings_quran_font")}</span>
            <select
              value={quranPrefs.fontId}
              onChange={(e) => setQuranPref("fontId", e.target.value as QuranFontId)}
            >
              <option value="uthmani">شهرزاد (Scheherazade)</option>
              <option value="naskh">نسخ (Traditional Arabic)</option>
              <option value="amiri">أميري (Amiri)</option>
            </select>
          </label>
          <div className="settings-actions">
            <button type="button" className="ds-btn ds-btn--ghost" onClick={() => bumpFont(2)}>
              {t("settings_quran_font_up")}
            </button>
            <button type="button" className="ds-btn ds-btn--ghost" onClick={() => bumpFont(-2)}>
              {t("settings_quran_font_down")}
            </button>
          </div>
        </LegalSection>
      )}

      {visible(sections[2]!) && (
        <LegalSection title={sections[2]!.title}>
          <label className="settings-field">
            <span>القارئ المفضّل</span>
            <select
              value={reciterId}
              onChange={(e) => {
                saveReciterId(e.target.value);
                setReciterIdState(e.target.value);
              }}
            >
              {reciters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr}
                </option>
              ))}
            </select>
          </label>
          <p className="settings-note">يُستخدم في مشغّل التلاوة داخل المصحف</p>
          <label className="settings-field">
            <span>التفسير المفضّل</span>
            <select
              value={tafsirId}
              onChange={(e) => {
                persistTafsirEdition(e.target.value);
                setTafsirIdState(e.target.value);
              }}
            >
              {tafsirs.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.label}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            <span>سرعة التشغيل</span>
            <select
              value={String(playbackRate)}
              onChange={(e) => {
                const rate = Number(e.target.value);
                savePlaybackRate(rate);
                setPlaybackRateState(rate);
              }}
            >
              {VALID_PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={String(rate)}>
                  {rate}×
                </option>
              ))}
            </select>
          </label>
          <ToggleRow
            label="التشغيل في الخلفية"
            description="تفضيل محلي لإبقاء التلاوة عند مغادرة الشاشة (حسب دعم الجهاز)"
            checked={bgPlayback}
            onChange={(on) => {
              writeBackgroundPlaybackPref(on);
              setBgPlayback(on);
            }}
          />
          <ToggleRow
            label="توفير البيانات"
            description="يقلّل إحماء الوسائط الثقيلة عند الاتصال الضعيف"
            checked={preferences.dataSaver}
            onChange={(value) => update("dataSaver", value)}
          />
        </LegalSection>
      )}

      {visible(sections[3]!) && (
        <LegalSection title={sections[3]!.title}>
          <p className="settings-note">
            تُحفظ التفضيلات محليًا. إذن الإشعارات يُطلب عند فتح إعدادات التذكيرات أو الأذان لأول مرة.
          </p>
          <ToggleRow
            label={t("settings_notif_lessons")}
            description="تنبيهات الدروس الجديدة"
            checked={preferences.lessonNotifications}
            onChange={(value) => update("lessonNotifications", value)}
          />
          <ToggleRow
            label={t("settings_notif_content")}
            description="تنبيهات المحتوى العلمي"
            checked={preferences.contentNotifications}
            onChange={(value) => update("contentNotifications", value)}
          />
          <ToggleRow
            label={t("settings_notif_occasions")}
            description="مناسبات ومواسم"
            checked={preferences.occasionNotifications}
            onChange={(value) => update("occasionNotifications", value)}
          />
          <div className="settings-legal-links">
            <Link href="/notification-settings" className="settings-legal-link">
              إعدادات التذكيرات التفصيلية
            </Link>
            <Link href="/adhan-settings" className="settings-legal-link">
              إعدادات الأذان
            </Link>
          </div>
        </LegalSection>
      )}

      {visible(sections[4]!) && (
        <LegalSection title={sections[4]!.title}>
          <p className="settings-note">إدارة التحميلات والمساحة دون اتصال من المصحف والأذان.</p>
          <div className="settings-legal-links">
            <Link href="/mushaf" className="settings-legal-link">
              التنزيلات الصوتية
            </Link>
            <Link href="/adhan-settings" className="settings-legal-link">
              أصوات الأذان المحمّلة
            </Link>
            <Link href="/vault" className="settings-legal-link">
              مخزن المعرفة دون اتصال
            </Link>
          </div>
          <button type="button" className="ui-card-btn" onClick={() => clearQuranCache()}>
            {t("settings_clear_quran_cache")}
          </button>
        </LegalSection>
      )}

      {visible(sections[5]!) && (
        <LegalSection title={sections[5]!.title}>
          <p>{t("settings_privacy_desc")}</p>
          <div className="settings-legal-links">
            <Link href="/privacy-center" className="settings-legal-link">
              مركز الخصوصية
            </Link>
            <Link href="/privacy" className="settings-legal-link">
              سياسة الخصوصية
            </Link>
            {isLoggedIn && (
              <Link
                href="/account-deletion"
                className="settings-legal-link settings-legal-link--danger"
              >
                حذف الحساب نهائياً
              </Link>
            )}
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="ui-card-btn"
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify({ preferences, fontPreference }, null, 2)],
                  { type: "application/json" },
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "majalis-settings.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {t("settings_download_data")}
            </button>
            {isLoggedIn && (
              <button
                type="button"
                className="ui-card-btn"
                onClick={() => {
                  void (async () => {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    if (!token) return;
                    const res = await fetch("/api/account/export", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) return;
                    const blob = new Blob([JSON.stringify(body, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "majlisilm-data-export.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  })();
                }}
              >
                تصدير بيانات الحساب (خادم)
              </button>
            )}
            <button
              type="button"
              className="settings-danger-btn"
              onClick={() => {
                restoreDefaultAppSettings(updatePreferences);
                clearLocalBookmarks();
                void clearOfflineReading();
                void import("@/lib/clear-user-local-data").then(({ clearUserLocalDataAndMedia }) =>
                  clearUserLocalDataAndMedia(),
                );
              }}
            >
              {t("settings_clear_local")}
            </button>
          </div>
        </LegalSection>
      )}

      {visible(sections[6]!) && (
        <LegalSection title={sections[6]!.title}>
          <p className="settings-note">
            أعد مشاهدة جولة المزايا لتتعرّف على المصحف والصلاة والأذكار والبحث والتنبيهات.
          </p>
          <div className="settings-actions">
            <button
              type="button"
              className="page-action-btn page-action-btn--secondary"
              onClick={() => requestFeatureTourReplay()}
            >
              جولة المزايا
            </button>
          </div>
          <div className="settings-legal-links">
            <Link href="/about" className="settings-legal-link">
              حول التطبيق
            </Link>
            <Link href="/sources" className="settings-legal-link">
              المصادر والتراخيص
            </Link>
            <Link href="/support" className="settings-legal-link">
              الدعم والتواصل
            </Link>
            <Link href="/privacy" className="settings-legal-link">
              سياسة الخصوصية
            </Link>
            <Link href="/terms" className="settings-legal-link">
              شروط الاستخدام
            </Link>
          </div>
        </LegalSection>
      )}

      <LegalBackLink />
    </LegalPageLayout>
  );
}
