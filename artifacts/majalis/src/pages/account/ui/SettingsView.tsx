import { lazy, Suspense, useEffect, useMemo, useState } from "react";
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
  clampQuranFontSize,
  clampReadingTextSize,
  QURAN_FONT_MAX_PX,
  QURAN_FONT_MIN_PX,
  QURAN_FONT_STEP_PX,
  READING_TEXT_MAX_PX,
  READING_TEXT_MIN_PX,
} from "@/lib/quran-font-size";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/lib/supabase";
import {
  loadPlaybackRate,
  loadReciterId,
  savePlaybackRate,
  saveReciterId,
  VALID_PLAYBACK_RATES,
} from "@/lib/quran-audio";
import { useVerifiedReciters } from "@/hooks/useVerifiedReciters";
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
import { refreshAppAndPurgeCaches } from "@/lib/runtime-cache-purge";
import "@/styles/pages/settings.css";

const ReciterDownloadManager = lazy(() =>
  import("@/components/quran/ReciterDownloadManager").then((m) => ({
    default: m.ReciterDownloadManager,
  })),
);

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cacheRefreshBusy, setCacheRefreshBusy] = useState(false);
  const [cacheRefreshNote, setCacheRefreshNote] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/settings",
      title: "الإعدادات | سُنّة",
      description: "إعدادات القراءة والصوت والتذكيرات والخصوصية في سُنّة.",
      keywords: ["إعدادات", "سُنّة", "تفضيلات"],
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
  /** مسودة مقياس الخط أثناء السحب — تُلتزَم عند الإفلات فقط لتجنّب وميض التخطيط */
  const [draftQuranScale, setDraftQuranScale] = useState(quranPrefs.fontScale);
  const [draftReadingSize, setDraftReadingSize] = useState(
    () => clampReadingTextSize(Number(preferences.readingTextSize) || 17),
  );

  useEffect(() => {
    setDraftQuranScale(quranPrefs.fontScale);
  }, [quranPrefs.fontScale]);

  useEffect(() => {
    setDraftReadingSize(clampReadingTextSize(Number(preferences.readingTextSize) || 17));
  }, [preferences.readingTextSize]);

  const commitQuranScale = (raw: number) => {
    const next = clampQuranFontSize(raw);
    setDraftQuranScale(next);
    setQuranPref("fontScale", next);
  };

  const commitReadingSize = (raw: number) => {
    const next = clampReadingTextSize(raw);
    setDraftReadingSize(next);
    updatePreferences({ readingTextSize: String(next) });
  };

  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    updatePreferences({ [key]: value });
  };

  const reciters = useVerifiedReciters();
  const tafsirs = useMemo(() => MUSHAF_TAFSIR_EDITIONS, []);

  const sections: SectionDef[] = [
    { id: "account", title: t("settings_account"), keywords: "حساب دخول تسجيل خروج حذف الحساب" },
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
    <LegalPageLayout
      eyebrow={t("settings_eyebrow")}
      title={t("settings_title")}
      density="medium"
      className="settings-page"
    >
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
              <>
                <button type="button" className="page-action-btn" onClick={() => logout()}>
                  {t("settings_logout")}
                </button>
                <button
                  type="button"
                  className="page-action-btn page-action-btn--danger"
                  data-testid="settings-delete-account"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  {t("settings_delete_account")}
                </button>
              </>
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
          {deleteDialogOpen ? (
            <div
              className="settings-delete-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="settings-delete-title"
              aria-describedby="settings-delete-desc"
            >
              <div className="settings-delete-dialog__panel">
                <h2 id="settings-delete-title">تأكيد حذف الحساب</h2>
                <p id="settings-delete-desc">
                  سيُحذف حسابك وبيانات المصادقة وجميع بياناتك الشخصية المرتبطة به نهائيًا
                  ولا يمكن التراجع عن ذلك. المحتوى العلمي العام غير المرتبط بحسابك يبقى متاحًا للجميع.
                </p>
                <div className="settings-delete-dialog__actions">
                  <Link
                    href="/account-deletion?confirm=1"
                    className="page-action-btn page-action-btn--danger"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    المتابعة إلى الحذف النهائي
                  </Link>
                  <button
                    type="button"
                    className="page-action-btn page-action-btn--secondary"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          ) : null}
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
          <button
            type="button"
            className="page-action-btn page-action-btn--secondary"
            disabled={cacheRefreshBusy}
            onClick={() => {
              setCacheRefreshBusy(true);
              setCacheRefreshNote("جاري تحديث التطبيق وحذف الكاش…");
              void refreshAppAndPurgeCaches()
                .then(() => {
                  setCacheRefreshNote("تم التحديث — يُعاد التحميل…");
                })
                .catch(() => {
                  setCacheRefreshBusy(false);
                  setCacheRefreshNote("تعذّر التحديث. حاول مرة أخرى.");
                });
            }}
          >
            {cacheRefreshBusy ? "جاري التحديث…" : "تحديث التطبيق وحذف الكاش"}
          </button>
          {cacheRefreshNote ? <p className="settings-note">{cacheRefreshNote}</p> : null}
          <p className="settings-note">
            يحذف نسخة الواجهة القديمة فقط، ولا يمس الثيم أو المفضلة أو إعدادات الصلاة.
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
              min={READING_TEXT_MIN_PX}
              max={READING_TEXT_MAX_PX}
              value={draftReadingSize}
              onInput={(e) => setDraftReadingSize(Number(e.currentTarget.value))}
              onPointerUp={(e) => commitReadingSize(Number(e.currentTarget.value))}
              onKeyUp={(e) => commitReadingSize(Number((e.target as HTMLInputElement).value))}
              onBlur={(e) => commitReadingSize(Number(e.currentTarget.value))}
            />
            <strong className="mj-bidi-isolate">{draftReadingSize}px</strong>
          </label>
          <label className="settings-field">
            <span>{t("settings_quran_font_size")}</span>
            <input
              type="range"
              min={QURAN_FONT_MIN_PX}
              max={QURAN_FONT_MAX_PX}
              step={QURAN_FONT_STEP_PX}
              value={draftQuranScale}
              onInput={(e) => setDraftQuranScale(Number(e.currentTarget.value))}
              onPointerUp={(e) => commitQuranScale(Number(e.currentTarget.value))}
              onKeyUp={(e) => commitQuranScale(Number((e.target as HTMLInputElement).value))}
              onBlur={(e) => commitQuranScale(Number(e.currentTarget.value))}
            />
            <strong className="mj-bidi-isolate">{draftQuranScale}px</strong>
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
          <p className="settings-note">
            تنزيل تلاوة السور كاملة للقرّاء المُحقَّقين QA — للاستماع دون اتصال.
          </p>
          <Suspense fallback={<p className="settings-note">جاري تحميل إدارة التنزيلات…</p>}>
            <ReciterDownloadManager />
          </Suspense>
          <div className="settings-legal-links">
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
                    a.download = "ssunnah-data-export.json";
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
            <Link href="/feature-tour" className="page-action-btn page-action-btn--secondary">
              جولة المزايا
            </Link>
          </div>
          <div className="settings-legal-links">
            <Link href="/about" className="settings-legal-link">
              حول التطبيق
            </Link>
            <Link href="/sources" className="settings-legal-link">
              المصادر والتراخيص
            </Link>
            <Link href="/contact" className="settings-legal-link">
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
