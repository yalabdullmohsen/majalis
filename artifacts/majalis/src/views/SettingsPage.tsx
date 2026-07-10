import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { useAuth } from "@/components/AuthProvider";
import { useFontPreference } from "@/components/FontPreferenceProvider";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { FONT_OPTIONS, type FontPreference } from "@/lib/font-preference";
import { clearQuranCache } from "@/lib/quran-api";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/user-preferences";
import { useQuranPreferences, type QuranFontId } from "@/hooks/useQuranPreferences";
import { PushPrompt } from "@/components/PushPrompt";
import { useLanguage } from "@/components/LanguageProvider";

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        name={label.replace(/\s+/g, "-")}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export default function SettingsPage() {
  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    applyPageSeo({
      path: "/settings",
      title: "الإعدادات | المجلس العلمي",
      description: "إعدادات حساب المجلس العلمي، اللغة والخط والوضع الليلي وتفضيلات الأذان.",
      keywords: ["إعدادات", "المجلس العلمي", "تفضيلات"],
      robots: "noindex, follow",
    });
  }, []);
  const { t } = useLanguage();
  const { preference: fontPreference, setPreference: setFontPreference } = useFontPreference();
  const { preferences, updatePreferences } = useUserPreferences();
  const { prefs: quranPrefs, setPref: setQuranPref, bumpFont } = useQuranPreferences();

  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    updatePreferences({ [key]: value });
  };

  return (
    <LegalPageLayout eyebrow={t("settings_eyebrow")} title={t("settings_title")}>
      <LegalSection title={t("settings_account")}>
        <div className="settings-account-card">
          <div className="settings-avatar" aria-hidden="true">
            {(user?.profile?.name || user?.email || "م").slice(0, 1)}
          </div>
          <div>
            <p><strong>{t("settings_name")}:</strong> {user?.profile?.name || t("settings_guest")}</p>
            <p><strong>{t("settings_email")}:</strong> {user?.email || t("settings_not_logged_in")}</p>
          </div>
        </div>
        <div className="settings-actions">
          {isLoggedIn ? (
            <button type="button" className="page-action-btn" onClick={() => logout()}>
              {t("settings_logout")}
            </button>
          ) : (
            <>
              <Link href="/login" className="page-action-btn">{t("settings_login")}</Link>
              <Link href="/register" className="page-action-btn page-action-btn--secondary">{t("settings_register")}</Link>
            </>
          )}
          {isLoggedIn && (
            <Link href="/account-deletion" className="settings-danger-btn settings-danger-btn--link">
              {t("settings_delete_account")}
            </Link>
          )}
        </div>
      </LegalSection>

      <LegalSection title={t("settings_interface")}>
        <label className="settings-field">
          <span>{t("settings_font_size")}</span>
          <select name="interface-font-size" value={preferences.fontSize} onChange={(e) => update("fontSize", e.target.value as UserPreferences["fontSize"])}>
            <option>صغير</option>
            <option>متوسط</option>
            <option>كبير</option>
          </select>
        </label>
      </LegalSection>

      <LegalSection title={t("settings_reading")}>
        <div className="settings-option-grid" role="group" aria-label={t("settings_reading")}>
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`settings-choice${fontPreference === option.id ? " is-active" : ""}`}
              onClick={() => setFontPreference(option.id as FontPreference)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
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
          <span>{t("settings_line_spacing")}</span>
          <select name="reading-spacing" value={preferences.readingSpacing} onChange={(e) => update("readingSpacing", e.target.value as UserPreferences["readingSpacing"])}>
            <option value="ضيق">ضيق</option>
            <option value="متوسط">متوسط</option>
            <option value="واسع">واسع</option>
          </select>
        </label>
        <ToggleRow label={t("settings_reading_mode")} checked={preferences.readingMode} onChange={(value) => update("readingMode", value)} />
      </LegalSection>

      <LegalSection title={t("settings_quran")}>
        <label className="settings-field">
          <span>{t("settings_quran_font_size")}</span>
          <input
            type="range"
            min="18"
            max="40"
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
            <option value="uthmani">عثماني</option>
            <option value="naskh">نسخ</option>
            <option value="amiri">أميري</option>
          </select>
        </label>
        <ToggleRow label={t("settings_ayah_numbers")} checked={quranPrefs.showAyahNumbers} onChange={(v) => setQuranPref("showAyahNumbers", v)} />
        <ToggleRow label={t("settings_night_mode")} checked={quranPrefs.nightMode} onChange={(v) => setQuranPref("nightMode", v)} />
        <div className="settings-actions">
          <button type="button" className="ds-btn ds-btn--ghost" onClick={() => bumpFont(2)}>{t("settings_quran_font_up")}</button>
          <button type="button" className="ds-btn ds-btn--ghost" onClick={() => bumpFont(-2)}>{t("settings_quran_font_down")}</button>
        </div>
        <label className="settings-field">
          <span>{t("settings_radio_volume")}</span>
          <input type="range" min="0" max="100" value={preferences.radioVolume} onChange={(e) => update("radioVolume", e.target.value)} />
        </label>
        <button type="button" className="ui-card-btn" onClick={() => clearQuranCache()}>{t("settings_clear_quran_cache")}</button>
      </LegalSection>

      <LegalSection title={t("settings_media")}>
        <label className="settings-field">
          <span>{t("settings_image_quality")}</span>
          <select value={preferences.imageQuality} onChange={(e) => update("imageQuality", e.target.value as UserPreferences["imageQuality"])}>
            <option value="منخفض">منخفض</option>
            <option value="متوسط">متوسط</option>
            <option value="عالي">عالي</option>
          </select>
        </label>
        <ToggleRow label={t("settings_video_autoplay")} checked={preferences.videoAutoplay} onChange={(v) => update("videoAutoplay", v)} />
      </LegalSection>

      <LegalSection title={t("settings_notifications")}>
        <PushPrompt />
        <ToggleRow label={t("settings_notif_lessons")} checked={preferences.lessonNotifications} onChange={(value) => update("lessonNotifications", value)} />
        <ToggleRow label={t("settings_notif_courses")} checked={preferences.lectureNotifications} onChange={(value) => update("lectureNotifications", value)} />
        <ToggleRow label={t("settings_notif_content")} checked={preferences.contentNotifications} onChange={(value) => update("contentNotifications", value)} />
        <ToggleRow label={t("settings_notif_updates")} checked={preferences.updateNotifications} onChange={(value) => update("updateNotifications", value)} />
        <ToggleRow label={t("settings_notif_occasions")} checked={preferences.occasionNotifications} onChange={(value) => update("occasionNotifications", value)} />
      </LegalSection>

      <LegalSection title={t("settings_search")}>
        <ToggleRow label={t("settings_search_history")} checked={preferences.searchHistory} onChange={(v) => update("searchHistory", v)} />
        <ToggleRow label={t("settings_assistant_verbose")} checked={preferences.assistantVerbose} onChange={(v) => update("assistantVerbose", v)} />
      </LegalSection>

      <LegalSection title={t("settings_privacy")}>
        <p>{t("settings_privacy_desc")}</p>
        <div className="settings-legal-links">
          <Link href="/privacy" className="settings-legal-link">سياسة الخصوصية</Link>
          <Link href="/terms" className="settings-legal-link">الشروط والأحكام</Link>
          {isLoggedIn && (
            <Link href="/account-deletion" className="settings-legal-link settings-legal-link--danger">حذف الحساب نهائياً</Link>
          )}
        </div>
        <div className="settings-actions">
          <button type="button" className="ui-card-btn" onClick={() => {
            const blob = new Blob([JSON.stringify({ preferences, fontPreference }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "majalis-settings.json";
            a.click();
            URL.revokeObjectURL(url);
          }}>
            {t("settings_download_data")}
          </button>
          <button type="button" className="settings-danger-btn" onClick={() => updatePreferences(DEFAULT_PREFERENCES)}>
            {t("settings_clear_local")}
          </button>
        </div>
      </LegalSection>

      <LegalSection title={t("settings_ai")}>
        <ToggleRow label={t("settings_ai_suggestions")} checked={preferences.aiSuggestions} onChange={(value) => update("aiSuggestions", value)} />
        <label className="settings-field">
          <span>{t("settings_source_detail")}</span>
          <select name="ai-source-detail-level" value={preferences.sourceDetailLevel} onChange={(e) => update("sourceDetailLevel", e.target.value)}>
            <option>مختصر</option>
            <option>تفصيلي</option>
            <option>كامل مع روابط</option>
          </select>
        </label>
        <p className="settings-note">{t("settings_ai_note")}</p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
