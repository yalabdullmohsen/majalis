import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { PrayerRanksContent } from "@/views/PrayerRanksPage";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
type PrayerTrack = {
  status: "pending" | "done" | "missed";
  congregation: boolean;
  place: "mosque" | "home";
  timing: "early" | "late";
};

const TRACK_STORAGE = "majalis-prayer-tracker-v1";
const PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
}

function emptyDay(): Record<PrayerKey, PrayerTrack> {
  return Object.fromEntries(PRAYER_KEYS.map((key) => [key, {
    status: "pending",
    congregation: false,
    place: "home",
    timing: "early",
  }])) as Record<PrayerKey, PrayerTrack>;
}

function readTracker(): Record<string, Record<PrayerKey, PrayerTrack>> {
  try {
    return JSON.parse(localStorage.getItem(TRACK_STORAGE) || "{}");
  } catch {
    return {};
  }
}

function writeTracker(data: Record<string, Record<PrayerKey, PrayerTrack>>) {
  localStorage.setItem(TRACK_STORAGE, JSON.stringify(data));
}

const TABS = [
  { id: "times", label: "مواقيت الصلاة" },
  { id: "ranks", label: "مراتب الناس في الصلاة" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function PrayerTimesPage() {
  const search = useSearch();
  const initialTab: TabId = new URLSearchParams(search).get("tab") === "ranks" ? "ranks" : "times";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const { data, countdown, loading } = usePrayerCountdown();
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];
  const [store, setStore] = useState(() => readTracker());
  const dateKey = todayKey();
  const today = store[dateKey] || emptyDay();

  const updatePrayer = (key: PrayerKey, patch: Partial<PrayerTrack>) => {
    const nextDay = { ...today, [key]: { ...today[key], ...patch } };
    const next = { ...store, [dateKey]: nextDay };
    setStore(next);
    writeTracker(next);
  };

  const stats = useMemo(() => {
    const days = Object.entries(store).sort(([a], [b]) => b.localeCompare(a));
    const last7 = days.slice(0, 7).flatMap(([, day]) => Object.values(day));
    const last30 = days.slice(0, 30).flatMap(([, day]) => Object.values(day));
    const calc = (rows: PrayerTrack[]) => ({
      done: rows.filter((p) => p.status === "done").length,
      missed: rows.filter((p) => p.status === "missed").length,
      mosque: rows.filter((p) => p.place === "mosque").length,
      congregation: rows.filter((p) => p.congregation).length,
    });
    let streak = 0;
    for (const [, day] of days) {
      if (Object.values(day).every((p) => p.status === "done")) streak += 1;
      else break;
    }
    const totalToday = Object.values(today);
    return {
      todayDone: totalToday.filter((p) => p.status === "done").length,
      todayMissed: totalToday.filter((p) => p.status === "missed").length,
      week: calc(last7),
      month: calc(last30),
      streak,
    };
  }, [store, today]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="العبادة"
        title="مواقيت الصلاة"
        subtitle="مواقيت الصلاة في الكويت مع عدّاد تنازلي يتحدّث كل ثانية."
      />

      {/* Tab bar */}
      <div className="prayer-page-tabs" role="tablist" aria-label="أقسام الصلاة">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`prayer-page-tab${activeTab === tab.id ? " prayer-page-tab--active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ranks" && <PrayerRanksContent />}

      {activeTab === "times" && (loading ? (
        <Loading />
      ) : data && countdown ? (
        <>
          <div className="prayer-status-card ui-card">
            <p className="prayer-status-card__label">الصلاة القادمة</p>
            <h2>{countdown.next?.name || "غير محدد"}</h2>
            <p className="prayer-status-card__countdown prayer-countdown-hms" aria-live="polite">
              {countdown.remainingHms}
            </p>
            {countdown.current && (
              <p className="prayer-status-card__current">الوقت الحالي: {countdown.current.name}</p>
            )}
            <p className="prayer-status-card__date">{data.date.readable || data.date.gregorian}</p>
          </div>

          <div className="prayer-times-grid">
            {obligatory.map((p) => (
              <div
                key={p.key}
                className={`prayer-time-cell ui-card${countdown.next?.key === p.key ? " is-next" : ""}`}
              >
                <span>{p.name}</span>
                <strong>{p.time}</strong>
              </div>
            ))}
          </div>

          <section className="ui-card prayer-tracker-card">
            <div className="prayer-tracker-head">
              <div>
                <p className="prayer-status-card__label">متابعة الصلوات</p>
                <h2>عداد الصلوات اليومي</h2>
              </div>
              <strong>{stats.todayDone}/5</strong>
            </div>

            <div className="prayer-tracker-grid">
              {PRAYER_KEYS.map((key) => {
                const row = today[key];
                return (
                  <article key={key} className={`prayer-track-cell is-${row.status}`}>
                    <header>
                      <strong>{PRAYER_LABELS[key]}</strong>
                      <span>{row.status === "done" ? "تمت" : row.status === "missed" ? "فاتت" : "بانتظار"}</span>
                    </header>
                    <div className="prayer-track-actions">
                      <button type="button" onClick={() => updatePrayer(key, { status: "done" })}>تمت</button>
                      <button type="button" onClick={() => updatePrayer(key, { status: "missed" })}>فاتت</button>
                    </div>
                    <div className="prayer-track-options">
                      <label><input type="checkbox" checked={row.congregation} onChange={(e) => updatePrayer(key, { congregation: e.target.checked })} /> جماعة</label>
                      <select value={row.place} onChange={(e) => updatePrayer(key, { place: e.target.value as PrayerTrack["place"] })}>
                        <option value="mosque">في المسجد</option>
                        <option value="home">في البيت</option>
                      </select>
                      <select value={row.timing} onChange={(e) => updatePrayer(key, { timing: e.target.value as PrayerTrack["timing"] })}>
                        <option value="early">أول الوقت</option>
                        <option value="late">آخر الوقت</option>
                      </select>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="prayer-stat-strip">
              <span>اليوم: {stats.todayDone} تمت / {stats.todayMissed} فاتت</span>
              <span>الأسبوع: {stats.week.done} صلاة</span>
              <span>الشهر: {stats.month.done} صلاة</span>
              <span>Streak: {stats.streak} يوم</span>
            </div>
          </section>
        </>
      ) : (
        <p className="lessons-empty-state">تعذر تحميل المواقيت حالياً.</p>
      ))}
    </div>
  );
}
