import { Link } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { PrayerSectionNav } from "@/components/prayer/PrayerSectionNav";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { usePrayerTracker } from "@/hooks/usePrayerTracker";
import { computePrayerWindowInfo, useSmartPrayerReminders } from "@/hooks/useSmartPrayerReminders";
import { PrayerRankCard } from "@/components/prayer/PrayerRankCard";
import { PrayerLevelBar } from "@/components/prayer/PrayerLevelBar";
import { PrayerStatsGrid } from "@/components/prayer/PrayerStatsGrid";
import { PrayerCommitmentRing } from "@/components/prayer/PrayerCommitmentRing";
import { PrayerCalendar } from "@/components/prayer/PrayerCalendar";
import { PrayerCard } from "@/components/prayer/PrayerCard";
import { NextPrayerCard } from "@/components/prayer/NextPrayerCard";
import { PrayerGeneralStats } from "@/components/prayer/PrayerGeneralStats";
import { SmartReminderBanner } from "@/components/prayer/SmartReminderBanner";
import {
  PRAYER_KEYS,
  PRAYER_SLOT_MAP,
  emptyDay,
  kuwaitDateKey,
  type PrayerKey,
} from "@/lib/prayer-tracker";

export default function PrayerTrackingPage() {
  const { data, countdown, loading } = usePrayerCountdown();
  const tracker = usePrayerTracker();
  const todayDay = tracker.today || emptyDay(kuwaitDateKey());

  const todayStatus = Object.fromEntries(
    PRAYER_KEYS.map((k) => [k, todayDay[k]?.status || "pending"]),
  ) as Record<PrayerKey, "pending" | "done" | "missed">;

  const { reminder, requestNotificationPermission } = useSmartPrayerReminders(data, countdown, todayStatus);
  const windowInfo = computePrayerWindowInfo(data, countdown);

  return (
    <div className="page-shell prayer-tracking-page">
      <PageHeader
        eyebrow="الصلاة"
        title="متابعة الصلوات"
        subtitle="سجّل صلواتك اليومية وراقب التزامك — واستخدم مراتب ابن القيم للمحاسبة الروحية."
      />

      <PrayerSectionNav />

      <p className="prayer-tracking-links">
        <Link href="/prayer-achievements">الإنجازات</Link>
        <span> · </span>
        <Link href="/prayer-log">سجل الصلوات</Link>
        <span> · </span>
        <Link href="/prayer-ranks">مراتب الصلاة (ابن القيم)</Link>
      </p>

      {tracker.syncNote && <p className="prayer-sync-note">{tracker.syncNote}</p>}

      <SmartReminderBanner reminder={reminder} onEnableNotifications={requestNotificationPermission} />

      <PrayerRankCard rank={tracker.rank} metrics={tracker.rankMetrics} />
      <PrayerLevelBar stats={tracker.stats} />

      {loading ? (
        <Loading />
      ) : data && countdown ? (
        <>
          <NextPrayerCard data={data} countdown={countdown} windowInfo={windowInfo} />

          <section className="prayer-tracker-section">
            <header className="prayer-tracker-head">
              <div>
                <p className="prayer-status-card__label">متابعة الصلوات</p>
                <h2>صلوات اليوم</h2>
              </div>
              <strong>{tracker.stats.todayDone}/5</strong>
            </header>

            <div className="prayer-action-cards">
              {PRAYER_KEYS.map((key) => {
                const slotKey = PRAYER_SLOT_MAP[key];
                const slot = data.prayers.find((p) => p.key === slotKey);
                const session = todayDay[key];
                return (
                  <PrayerCard
                    key={key}
                    prayerKey={key}
                    time={slot}
                    session={session}
                    isNext={countdown.next?.key === slotKey}
                    isCurrent={countdown.current?.key === slotKey}
                    onUpdate={(patch) => tracker.updatePrayer(key, patch)}
                  />
                );
              })}
            </div>
          </section>

          <div className="prayer-dashboard-row">
            <PrayerCommitmentRing pct={tracker.stats.monthlyCommitmentPct} />
          </div>

          <PrayerStatsGrid stats={tracker.stats} />
          <PrayerCalendar calendarMonth={tracker.calendarMonth} getDay={(d) => tracker.store[d]} />
          <PrayerGeneralStats stats={tracker.stats} />
        </>
      ) : (
        <p className="lessons-empty-state">تعذر تحميل المواقيت. يمكنك تسجيل الصلوات يدوياً.</p>
      )}
    </div>
  );
}
