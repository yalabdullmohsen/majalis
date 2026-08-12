import { useEffect, useState } from "react";
import { VolumeX, X } from "lucide-react";
import { PRAYER_ALERT_EVENT_NAME, type PrayerAlertEvent } from "@/lib/prayer-alert-scheduler";
import {
  loadPrayerAlertPrefs,
  hasShownRespectReminder,
  markRespectReminderShown,
} from "@/lib/prayer-alert-preferences";

const RESPECT_MESSAGE = "اقتربت الصلاة، ضع هاتفك على الصامت وأغلقه حتى لا تُشغِل المصلين";

/** نافذة "خلال ١٠ دقائق قبل الصلاة" — أضيق من نافذة الـ١٥ دقيقة العامة
 * للمنسّق (prayer-alert-scheduler.ts)، خصيصًا لهذا التذكير الأدبي فقط، بلا
 * أي مؤقّت جديد موازٍ: نُصفّي حدث "pre-alert" الموجود فعلاً بفارق الوقت
 * الفعلي المتبقّي حتى الصلاة (من event.prayerTimeEpochMs)، فلا نعرض
 * التذكير إلا حين يتبقّى ١٠ دقائق أو أقل. */
const RESPECT_WINDOW_MINUTES = 10;

/**
 * شريط تذكير "احترام وقت الصلاة" — يبني فوق منسّق التنبيه الموجود فعلاً
 * (prayer-alert-scheduler.ts) بدل نظام موازٍ: يستمع لحدثه العام
 * (PRAYER_ALERT_EVENT_NAME) الذي كان يُطلَق فعلاً بلا أي مستهلك واجهة —
 * Live Activity والإشعار المحلي فقط كانا يستفيدان منه. مرة واحدة فقط لكل
 * صلاة فعليًا (راجع hasShownRespectReminder — localStorage لا sessionStorage).
 */
export function PrayerRespectBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PrayerAlertEvent>).detail;
      if (!detail) return;

      const prefs = loadPrayerAlertPrefs();
      if (detail.type === "pre-alert") {
        if (!prefs.preAlertEnabled) return;
        const minutesLeft = (detail.prayerTimeEpochMs - Date.now()) / 60_000;
        if (minutesLeft > RESPECT_WINDOW_MINUTES) return; // بعيد عن نافذة الـ١٠ دقائق بعد
      } else if (detail.type === "entered") {
        // "أثناء الأذان" — دخول الوقت فعليًا، حسب تفضيل "تنبيه دخول الوقت".
        if (!prefs.enterAlertEnabled) return;
      }

      if (hasShownRespectReminder(detail.prayerKey)) return;
      markRespectReminderShown(detail.prayerKey);
      setVisible(true);
    };
    window.addEventListener(PRAYER_ALERT_EVENT_NAME, handler);
    return () => window.removeEventListener(PRAYER_ALERT_EVENT_NAME, handler);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 12_000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="anb-stack" role="region" aria-label="تذكير احترام وقت الصلاة" aria-live="polite">
      <div className="anb-toast anb-toast--reminder" role="alert">
        <span className="anb-toast__emoji" aria-hidden="true">
          <VolumeX size={22} strokeWidth={2} />
        </span>
        <div className="anb-toast__body">
          <p className="anb-toast__title">اقتربت الصلاة</p>
          <p className="anb-toast__sub">{RESPECT_MESSAGE}</p>
        </div>
        <div className="anb-toast__actions">
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="anb-btn anb-btn--close"
            aria-label="إغلاق التذكير"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrayerRespectBanner;
