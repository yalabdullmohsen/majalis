import type { PrayerCountdown, PrayerTimesPayload } from "@/lib/prayer-times";
import type { PrayerWindowInfo } from "@/hooks/useSmartPrayerReminders";

type Props = {
  data: PrayerTimesPayload;
  countdown: PrayerCountdown;
  windowInfo: PrayerWindowInfo | null;
};

export function NextPrayerCard({ data, countdown, windowInfo }: Props) {
  return (
    <section className="ui-card prayer-next-card">
      <p className="prayer-status-card__label">الصلاة القادمة</p>
      <h2>{countdown.next?.name || "غير محدد"}</h2>
      <p className="prayer-status-card__countdown prayer-countdown-hms" aria-live="polite">
        {countdown.remainingHms}
      </p>

      {windowInfo && countdown.current && (
        <div className="prayer-next-card__windows">
          <div><span>منذ دخول {countdown.current.name}</span><strong>{windowInfo.sinceEntry}</strong></div>
          <div><span>حتى خروج الوقت</span><strong>{windowInfo.untilExit}</strong></div>
          {windowInfo.untilIqama && (
            <div><span>حتى الإقامة (تقريبي)</span><strong>{windowInfo.untilIqama}</strong></div>
          )}
          <div><span>المتبقي للصلاة القادمة</span><strong>{windowInfo.remainingToNext}</strong></div>
        </div>
      )}

      {countdown.current && (
        <p className="prayer-status-card__current">الوقت الحالي: {countdown.current.name}</p>
      )}
      <p className="prayer-status-card__date">{data.date.readable || data.date.gregorian}</p>
    </section>
  );
}
