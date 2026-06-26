import { useState } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { useAuth } from "@/components/AuthProvider";
import { useFontPreference } from "@/components/FontPreferenceProvider";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { FONT_OPTIONS, type FontPreference } from "@/lib/font-preference";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme-preference";

type SettingsState = {
  fontSize: string;
  interfaceLanguage: string;
  direction: "rtl" | "ltr";
  readingTextSize: string;
  readingSpacing: string;
  readingMode: boolean;
  lessonNotifications: boolean;
  lectureNotifications: boolean;
  contentNotifications: boolean;
  updateNotifications: boolean;
  occasionNotifications: boolean;
  aiSuggestions: boolean;
  sourceDetailLevel: string;
};

const SETTINGS_KEY = "majalis-user-settings-v1";

function readSettings(): SettingsState {
  const defaults: SettingsState = {
    fontSize: "متوسط",
    interfaceLanguage: "العربية",
    direction: "rtl",
    readingTextSize: "20",
    readingSpacing: "واسع",
    readingMode: false,
    lessonNotifications: true,
    lectureNotifications: true,
    contentNotifications: true,
    updateNotifications: true,
    occasionNotifications: true,
    aiSuggestions: true,
    sourceDetailLevel: "مختصر",
  };
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

function writeSettings(settings: SettingsState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

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
  const [settings, setSettings] = useState<SettingsState>(() => readSettings());

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    writeSettings(next);
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
            <Link href="/login" className="page-action-btn">تسجيل الدخول</Link>
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
          <select name="interface-font-size" value={settings.fontSize} onChange={(e) => update("fontSize", e.target.value)}>
            <option>صغير</option>
            <option>متوسط</option>
            <option>كبير</option>
          </select>
        </label>
        <label className="settings-field">
          <span>لغة الواجهة</span>
          <select name="interface-language" value={settings.interfaceLanguage} onChange={(e) => update("interfaceLanguage", e.target.value)}>
            <option>العربية</option>
            <option disabled>English (قريباً)</option>
          </select>
        </label>
        <label className="settings-field">
          <span>اتجاه الصفحة</span>
          <select name="interface-direction" value={settings.direction} onChange={(e) => update("direction", e.target.value as "rtl" | "ltr")}>
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
            value={settings.readingTextSize}
            onChange={(e) => update("readingTextSize", e.target.value)}
          />
          <strong>{settings.readingTextSize}px</strong>
        </label>
        <label className="settings-field">
          <span>تباعد الأسطر</span>
          <select name="reading-spacing" value={settings.readingSpacing} onChange={(e) => update("readingSpacing", e.target.value)}>
            <option>متوسط</option>
            <option>واسع</option>
            <option>واسع جداً</option>
          </select>
        </label>
        <ToggleRow label="وضع القراءة الهادئ" checked={settings.readingMode} onChange={(value) => update("readingMode", value)} />
      </LegalSection>

      <LegalSection title="الإشعارات">
        <ToggleRow label="إشعارات الدروس" checked={settings.lessonNotifications} onChange={(value) => update("lessonNotifications", value)} />
        <ToggleRow label="إشعارات المحاضرات" checked={settings.lectureNotifications} onChange={(value) => update("lectureNotifications", value)} />
        <ToggleRow label="إشعارات المحتوى الجديد" checked={settings.contentNotifications} onChange={(value) => update("contentNotifications", value)} />
        <ToggleRow label="إشعارات التحديثات" checked={settings.updateNotifications} onChange={(value) => update("updateNotifications", value)} />
        <ToggleRow label="إشعارات المناسبات الإسلامية" checked={settings.occasionNotifications} onChange={(value) => update("occasionNotifications", value)} />
      </LegalSection>

      <LegalSection title="الخصوصية">
        <p>يمكنك إدارة بياناتك المحلية المحفوظة في هذا المتصفح، وتشمل تفضيلات الخط والوضع وموضع القراءة.</p>
        <div className="settings-actions">
          <button type="button" className="ui-card-btn" onClick={() => {
            const blob = new Blob([JSON.stringify({ settings, fontPreference, themePreference }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "majalis-settings.json";
            a.click();
            URL.revokeObjectURL(url);
          }}>
            تحميل البيانات
          </button>
          <button type="button" className="settings-danger-btn" onClick={() => {
            window.localStorage.removeItem(SETTINGS_KEY);
            setSettings(readSettings());
          }}>
            حذف بيانات الإعدادات المحلية
          </button>
        </div>
      </LegalSection>

      <LegalSection title="الذكاء الاصطناعي">
        <ToggleRow label="تشغيل الاقتراحات الذكية" checked={settings.aiSuggestions} onChange={(value) => update("aiSuggestions", value)} />
        <label className="settings-field">
          <span>مستوى عرض المصادر</span>
          <select name="ai-source-detail-level" value={settings.sourceDetailLevel} onChange={(e) => update("sourceDetailLevel", e.target.value)}>
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
