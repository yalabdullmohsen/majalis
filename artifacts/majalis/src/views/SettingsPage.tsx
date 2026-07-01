"use client";

import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { useAuth } from "@/components/AuthProvider";
import { useFontPreference } from "@/components/FontPreferenceProvider";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { FONT_OPTIONS, type FontPreference } from "@/lib/font-preference";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme-preference";
import { clearQuranCache } from "@/lib/quran-api";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/user-preferences";
import { useQuranPreferences, type QuranFontId } from "@/hooks/useQuranPreferences";
import { PushPrompt } from "@/components/PushPrompt";

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
  const { preference: fontPreference, setPreference: setFontPreference } = useFontPreference();
  const { preference: themePreference, resolvedTheme, setPreference: setThemePreference } = useThemePreference();
  const { preferences, updatePreferences } = useUserPreferences();
  const { prefs: quranPrefs, setPref: setQuranPref, bumpFont } = useQuranPreferences();

  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    updatePreferences({ [key]: value });
  };

  return (
    <LegalPageLayout eyebrow="تفضيلات المستخدم" title="الإعدادات">
      <LegalSection title="الحساب">
        <div className="settings-account-card">
          <div className="settings-avatar" aria-hidden="true">
            {(user?.profile?.name || user?.email || "م").slice(0, 1)}
          </div>
          <div>
            <p><strong>الاسم:</strong> {user?.profile?.name || "زائر"}</p>
            <p><strong>البريد:</strong> {user?.email || "لم يتم تسجيل الدخول"}</p>
            <p className="settings-note">الصورة الشخصية وكلمة المرور وإدارة الجلسات تُدار من نظام الحساب عند تفعيل Supabase Auth.</p>
          </div>
        </div>
        <div className="settings-actions">
          {isLoggedIn ? (
            <button type="button" className="page-action-btn" onClick={() => logout()}>
              تسجيل الخروج
            </button>
          ) : (
            <>
              <Link href="/login" className="page-action-btn">تسجيل الدخول</Link>
              <Link href="/register" className="page-action-btn page-action-btn--secondary">إنشاء حساب</Link>
            </>
          )}
          <button type="button" className="settings-danger-btn" disabled title="تحتاج تأكيداً عبر نظام الحساب">
            حذف الحساب
          </button>
        </div>
      </LegalSection>

      <LegalSection title="الواجهة">
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
        <p className="settings-note">الوضع الحالي: {resolvedTheme === "dark" ? "ليلي" : "نهاري"}</p>
        <label className="settings-field">
          <span>حجم واجهة الموقع</span>
          <select name="interface-font-size" value={preferences.fontSize} onChange={(e) => update("fontSize", e.target.value as UserPreferences["fontSize"])}>
            <option>صغير</option>
            <option>متوسط</option>
            <option>كبير</option>
          </select>
        </label>
        <label className="settings-field">
          <span>لغة الواجهة</span>
          <select name="interface-language" value={preferences.interfaceLanguage} onChange={(e) => update("interfaceLanguage", e.target.value)}>
            <option>العربية</option>
            <option disabled>English (قريباً)</option>
          </select>
        </label>
        <label className="settings-field">
          <span>اتجاه الصفحة</span>
          <select name="interface-direction" value={preferences.direction} onChange={(e) => update("direction", e.target.value as "rtl" | "ltr")}>
            <option value="rtl">RTL — عربي</option>
            <option value="ltr">LTR — تجريبي</option>
          </select>
        </label>
      </LegalSection>

      <LegalSection title="القراءة">
        <div className="settings-option-grid" role="group" aria-label="اختيار الخط">
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
          <span>حجم نص القراءة</span>
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
          <span>تباعد الأسطر</span>
          <select name="reading-spacing" value={preferences.readingSpacing} onChange={(e) => update("readingSpacing", e.target.value as UserPreferences["readingSpacing"])}>
            <option value="ضيق">ضيق</option>
            <option value="متوسط">متوسط</option>
            <option value="واسع">واسع</option>
          </select>
        </label>
        <ToggleRow label="وضع القراءة الهادئ" checked={preferences.readingMode} onChange={(value) => update("readingMode", value)} />
      </LegalSection>

      <LegalSection title="القرآن والإذاعة">
        <label className="settings-field">
          <span>حجم خط المصحف</span>
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
          <span>خط المصحف</span>
          <select
            value={quranPrefs.fontId}
            onChange={(e) => setQuranPref("fontId", e.target.value as QuranFontId)}
          >
            <option value="uthmani">عثماني</option>
            <option value="naskh">نسخ</option>
            <option value="amiri">أميري</option>
          </select>
        </label>
        <ToggleRow label="أرقام الآيات" checked={quranPrefs.showAyahNumbers} onChange={(v) => setQuranPref("showAyahNumbers", v)} />
        <ToggleRow label="علامات الوقف" checked={quranPrefs.showWaqf} onChange={(v) => setQuranPref("showWaqf", v)} />
        <ToggleRow label="وضع القراءة" checked={quranPrefs.readingMode} onChange={(v) => setQuranPref("readingMode", v)} />
        <ToggleRow label="إخفاء التشكيل" checked={quranPrefs.hideTashkeel} onChange={(v) => setQuranPref("hideTashkeel", v)} />
        <ToggleRow label="وضع ليلي للمصحف" checked={quranPrefs.nightMode} onChange={(v) => setQuranPref("nightMode", v)} />
        <div className="settings-actions">
          <button type="button" className="ds-btn ds-btn--ghost" onClick={() => bumpFont(2)}>تكبير خط المصحف</button>
          <button type="button" className="ds-btn ds-btn--ghost" onClick={() => bumpFont(-2)}>تصغير خط المصحف</button>
        </div>
        <label className="settings-field">
          <span>مستوى صوت الإذاعة</span>
          <input type="range" min="0" max="100" value={preferences.radioVolume} onChange={(e) => update("radioVolume", e.target.value)} />
        </label>
        <button type="button" className="ui-card-btn" onClick={() => clearQuranCache()}>مسح ذاكرة المصحف المحلية</button>
      </LegalSection>

      <LegalSection title="الوسائط">
        <label className="settings-field">
          <span>جودة الصور</span>
          <select value={preferences.imageQuality} onChange={(e) => update("imageQuality", e.target.value as UserPreferences["imageQuality"])}>
            <option value="منخفض">منخفض</option>
            <option value="متوسط">متوسط</option>
            <option value="عالي">عالي</option>
          </select>
        </label>
        <ToggleRow label="تشغيل الفيديو تلقائياً" checked={preferences.videoAutoplay} onChange={(v) => update("videoAutoplay", v)} />
      </LegalSection>

      <LegalSection title="الإشعارات">
        <PushPrompt />
        <ToggleRow label="إشعارات الدروس" checked={preferences.lessonNotifications} onChange={(value) => update("lessonNotifications", value)} />
        <ToggleRow label="إشعارات الدورات" checked={preferences.lectureNotifications} onChange={(value) => update("lectureNotifications", value)} />
        <ToggleRow label="إشعارات المحتوى الجديد" checked={preferences.contentNotifications} onChange={(value) => update("contentNotifications", value)} />
        <ToggleRow label="إشعارات التحديثات" checked={preferences.updateNotifications} onChange={(value) => update("updateNotifications", value)} />
        <ToggleRow label="إشعارات المناسبات الإسلامية" checked={preferences.occasionNotifications} onChange={(value) => update("occasionNotifications", value)} />
      </LegalSection>

      <LegalSection title="البحث والمساعد">
        <ToggleRow label="حفظ سجل البحث" checked={preferences.searchHistory} onChange={(v) => update("searchHistory", v)} />
        <ToggleRow label="إجابات المساعد التفصيلية" checked={preferences.assistantVerbose} onChange={(v) => update("assistantVerbose", v)} />
      </LegalSection>

      <LegalSection title="الخصوصية والأمان">
        <p>يمكنك إدارة بياناتك المحلية المحفوظة في هذا المتصفح، وتشمل تفضيلات الخط والوضع وموضع القراءة.</p>
        <div className="settings-actions">
          <button type="button" className="ui-card-btn" onClick={() => {
            const blob = new Blob([JSON.stringify({ preferences, fontPreference, themePreference }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "majalis-settings.json";
            a.click();
            URL.revokeObjectURL(url);
          }}>
            تحميل البيانات
          </button>
          <button type="button" className="settings-danger-btn" onClick={() => updatePreferences(DEFAULT_PREFERENCES)}>
            حذف بيانات الإعدادات المحلية
          </button>
        </div>
      </LegalSection>

      <LegalSection title="الذكاء الاصطناعي">
        <ToggleRow label="تشغيل الاقتراحات الذكية" checked={preferences.aiSuggestions} onChange={(value) => update("aiSuggestions", value)} />
        <label className="settings-field">
          <span>مستوى عرض المصادر</span>
          <select name="ai-source-detail-level" value={preferences.sourceDetailLevel} onChange={(e) => update("sourceDetailLevel", e.target.value)}>
            <option>مختصر</option>
            <option>تفصيلي</option>
            <option>كامل مع روابط</option>
          </select>
        </label>
        <p className="settings-note">سجل الاستفسارات محفوظ في سجلات الخادم عند استخدام المساعد الموثق، ولا يُستخدم لإنشاء أحكام بلا مصادر.</p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
