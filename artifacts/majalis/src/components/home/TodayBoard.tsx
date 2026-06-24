import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { computePrayerStatus, fetchPrayerTimes, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getDailyContent, getLessonOfDay, getUpcomingLessonsCount } from "@/lib/platform-api";

export function TodayBoard() {
  const [prayer, setPrayer] = useState<PrayerTimesPayload | null>(null);
  const [hadith, setHadith] = useState<any>(null);
  const [ayah, setAyah] = useState<any>(null);
  const [lessonOfDay, setLessonOfDay] = useState<any>(null);
  const [upcoming, setUpcoming] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchPrayerTimes().catch(() => null),
      getDailyContent(),
      getLessonOfDay(),
      getUpcomingLessonsCount(),
    ])
      .then(([p, daily, lesson, count]) => {
        if (p) setPrayer(p);
        setHadith(daily.hadith);
        setAyah(daily.ayah);
        setLessonOfDay(lesson);
        setUpcoming(count);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const status = useMemo(
    () => (prayer?.prayers ? computePrayerStatus(prayer.prayers) : null),
    [prayer?.prayers, tick],
  );

  if (loading) return <Loading />;

  return (
    <section className="home-section" aria-labelledby="today-board-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">اليوم</p>
          <h2 id="today-board-heading">اليوم في المجلس</h2>
        </div>
      </div>

      <div className="today-board ui-card">
        {status && (
          <div className="today-board-prayer">
            <h3>مواقيت الصلاة — الكويت</h3>
            <div className="today-board-prayer-grid">
              <div className="today-prayer-cell is-previous">
                <span>السابقة</span>
                <strong>{status.previous?.name || "—"}</strong>
                <small>{status.previous?.time}</small>
              </div>
              <div className="today-prayer-cell is-next">
                <span>القادمة</span>
                <strong>{status.next?.name || "—"}</strong>
                <small>{status.next?.time}</small>
              </div>
              <div className="today-prayer-cell is-remaining">
                <span>الوقت المتبقي</span>
                <strong>{status.remainingLabel}</strong>
              </div>
            </div>
            {prayer && (
              <div className="today-prayer-all">
                {prayer.prayers.map((p) => (
                  <span key={p.key}>{p.name}: {p.time}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="today-board-grid">
          {hadith && (
            <article className="today-board-item">
              <h4>حديث اليوم</h4>
              <p>{hadith.content}</p>
              <small>{hadith.source}</small>
              <p className="today-board-meaning">{hadith.explanation}</p>
            </article>
          )}
          {ayah && (
            <article className="today-board-item">
              <h4>آية ومعنى</h4>
              <p className="today-ayah">{ayah.content}</p>
              <small>{ayah.source}</small>
              <p className="today-board-meaning">{ayah.explanation}</p>
            </article>
          )}
          {lessonOfDay && (
            <article className="today-board-item">
              <h4>درس اليوم</h4>
              <p><strong>{lessonOfDay.title}</strong></p>
              <small>{lessonOfDay.sheikh_name} — {lessonOfDay.mosque_name}</small>
              <Link href="/kuwait-lessons" className="ui-card-btn today-board-link">عرض التفاصيل</Link>
            </article>
          )}
          <article className="today-board-item today-board-stats">
            <h4>الدروس القادمة</h4>
            <strong className="today-upcoming-count">{upcoming}</strong>
            <Link href="/calendar" className="home-section-link">عرض التقويم</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
