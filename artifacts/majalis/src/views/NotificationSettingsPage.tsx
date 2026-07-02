import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  loadNotifPrefs,
  saveNotifPrefs,
  requestPermission,
  getPermissionStatus,
  sendLocalNotification,
  type NotifPrefs,
} from "@/lib/local-notifications";

type Permission = ReturnType<typeof getPermissionStatus>;

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`notif-row${disabled ? " notif-row--disabled" : ""}`}>
      <div className="notif-row__text">
        <span className="notif-row__label">{label}</span>
        {sub && <span className="notif-row__sub">{sub}</span>}
      </div>
      <div
        className={`notif-toggle${checked ? " notif-toggle--on" : ""}`}
        onClick={() => !disabled && onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !disabled && onChange(!checked)}
      >
        <span className="notif-toggle__thumb" />
      </div>
    </label>
  );
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(loadNotifPrefs);
  const [permission, setPermission] = useState<Permission>(getPermissionStatus);
  const [requesting, setRequesting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    saveNotifPrefs(prefs);
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [prefs]);

  const handleEnable = async () => {
    setRequesting(true);
    const result = await requestPermission();
    setPermission(result);
    if (result === "granted") {
      setPrefs((p) => ({ ...p, enabled: true }));
      sendLocalNotification("✅ الإشعارات مفعّلة", {
        body: "سنذكّرك بمراجعة البطاقات والدروس المتوقفة.",
      });
    }
    setRequesting(false);
  };

  const update = (patch: Partial<NotifPrefs>) =>
    setPrefs((p) => ({ ...p, ...patch }));

  const isGranted = permission === "granted";
  const isUnsupported = permission === "unsupported";
  const isDenied = permission === "denied";
  const canToggle = isGranted && prefs.enabled;

  return (
    <div className="page-shell narrow" dir="rtl">
      <PageHeader
        eyebrow="الإعدادات"
        title="🔔 الإشعارات الذكية"
        subtitle="تذكّرات مخصصة تساعدك على المثابرة في طلب العلم."
      />

      {/* Permission status */}
      {isUnsupported && (
        <div className="notif-banner notif-banner--warn">
          متصفحك لا يدعم الإشعارات. جرّب Chrome أو Firefox.
        </div>
      )}
      {isDenied && (
        <div className="notif-banner notif-banner--err">
          الإشعارات محجوبة من إعدادات المتصفح. فعّلها يدوياً من الإعدادات ثم أعد المحاولة.
        </div>
      )}

      {/* Enable toggle */}
      <div className="notif-card">
        <ToggleRow
          label="تفعيل الإشعارات"
          sub={
            isGranted
              ? "مفعّلة في هذا المتصفح"
              : isUnsupported
              ? "غير مدعوم"
              : isDenied
              ? "محجوبة — راجع إعدادات المتصفح"
              : "اضغط للسماح للمتصفح"
          }
          checked={prefs.enabled && isGranted}
          onChange={(v) => {
            if (v && !isGranted) {
              handleEnable();
            } else {
              update({ enabled: v });
            }
          }}
          disabled={isUnsupported || isDenied || requesting}
        />
      </div>

      {/* Notification types */}
      <div className="notif-card">
        <h3 className="notif-card__title">أنواع التذكّرات</h3>
        <ToggleRow
          label="📇 مراجعة البطاقات"
          sub="تذكير يومي عند وجود بطاقات مستحقة"
          checked={prefs.flashcardsReminder}
          onChange={(v) => update({ flashcardsReminder: v })}
          disabled={!canToggle}
        />
        <ToggleRow
          label="📍 تابع من حيث توقفت"
          sub="تذكير بالدرس أو الكتاب الذي لم تُكمله"
          checked={prefs.resumeReminder}
          onChange={(v) => update({ resumeReminder: v })}
          disabled={!canToggle}
        />
        <ToggleRow
          label="🕌 تنبيه الصلاة"
          sub="إشعار قبل 10 دقائق من وقت الصلاة"
          checked={prefs.prayerReminder}
          onChange={(v) => update({ prayerReminder: v })}
          disabled={!canToggle}
        />
      </div>

      {/* Time preference */}
      <div className="notif-card">
        <h3 className="notif-card__title">وقت التذكير اليومي</h3>
        <div className="notif-time">
          <label className="notif-time__label">الساعة</label>
          <input
            type="number"
            className="notif-time__input"
            min={0}
            max={23}
            value={prefs.reminderHour}
            onChange={(e) => update({ reminderHour: Math.min(23, Math.max(0, Number(e.target.value))) })}
            disabled={!canToggle}
          />
          <span className="notif-time__sep">:</span>
          <input
            type="number"
            className="notif-time__input"
            min={0}
            max={59}
            value={prefs.reminderMinute}
            onChange={(e) => update({ reminderMinute: Math.min(59, Math.max(0, Number(e.target.value))) })}
            disabled={!canToggle}
          />
        </div>
        <p className="notif-time__hint">
          التذكيرات تعمل فقط عندما يكون المتصفح مفتوحاً.
        </p>
      </div>

      {/* Test button */}
      {isGranted && (
        <div className="notif-card">
          <button
            type="button"
            className="notif-test-btn"
            onClick={() =>
              sendLocalNotification("🔔 اختبار الإشعارات", {
                body: "هذا إشعار تجريبي من منصة المجالس.",
              })
            }
          >
            إرسال إشعار تجريبي
          </button>
        </div>
      )}

      {saved && (
        <div className="notif-saved">✓ تم حفظ الإعدادات</div>
      )}

      <nav className="profile-quick-links" style={{ marginTop: "2rem" }} aria-label="روابط">
        <Link href="/flashcards" className="profile-quick-link">📇 البطاقات</Link>
        <Link href="/learning-plan" className="profile-quick-link">📚 خطة التعلّم</Link>
        <Link href="/settings" className="profile-quick-link">⚙️ الإعدادات</Link>
      </nav>
    </div>
  );
}
