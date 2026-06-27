"use client";

import { Link } from "wouter";
import { useUserActivity } from "@/components/UserActivityProvider";
import { readFollows } from "@/lib/follows";
import { getContinueItems } from "@/lib/user-activity";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { getAllSurahStories } from "@/lib/surah-stories";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { useMemo } from "react";

function daySeed() {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
}

export function HomePersonalized({
  initialFeaturedLessons,
}: {
  initialFeaturedLessons?: import("@/lib/kuwait-lessons").KuwaitLessonRecord[];
} = {}) {
  const { activity } = useUserActivity();
  const continueItems = useMemo(() => getContinueItems().slice(0, 3), [activity]);
  const follows = useMemo(() => readFollows().slice(0, 4), [activity]);
  const storyOfDay = useMemo(() => {
    const stories = getAllSurahStories();
    return stories[daySeed() % stories.length];
  }, []);
  const featuredLesson = useMemo(() => LESSONS_SEED[daySeed() % LESSONS_SEED.length], []);

  return (
    <>
      {continueItems.length > 0 && (
        <section className="home-section home-section--compact">
          <div className="home-section-head">
            <div>
              <p className="home-section-kicker">متابعة</p>
              <h2 className="home-section-title">تابع القراءة</h2>
            </div>
            <Link href="/continue" className="home-section-link">عرض الكل</Link>
          </div>
          <div className="home-continue-strip">
            {continueItems.map((item) => (
              <Link key={`${item.kind}-${item.id}`} href={item.href} className="home-continue-chip">
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section home-section--compact">
        <div className="home-section-head">
          <div>
            <p className="home-section-kicker">اليوم</p>
            <h2 className="home-section-title">سؤال اليوم · قصة · درس</h2>
          </div>
          <Link href="/discover" className="home-section-link">اكتشف</Link>
        </div>
        <div className="home-daily-trio">
          <div className="home-daily-trio__item"><HomeDailyQuestion /></div>
          <Link href={`/quran/surah-stories/${storyOfDay.number}`} className="home-daily-trio__card">
            <span>قصة سورة اليوم</span>
            <strong>{storyOfDay.name}</strong>
          </Link>
          <Link href={`/lessons/${featuredLesson.id}`} className="home-daily-trio__card">
            <span>درس مميز</span>
            <strong>{featuredLesson.title}</strong>
          </Link>
        </div>
      </section>

      {follows.length > 0 && (
        <section className="home-section home-section--compact">
          <div className="home-section-head">
            <div>
              <p className="home-section-kicker">متابعاتك</p>
              <h2 className="home-section-title">جديد من متابعاتك</h2>
            </div>
          </div>
          <div className="home-continue-strip">
            {follows.map((f) => (
              <Link key={`${f.kind}-${f.id}`} href={f.href} className="home-continue-chip">
                {f.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section home-section--compact">
        <div className="home-section-head">
          <div>
            <p className="home-section-kicker">المحتوى</p>
            <h2 className="home-section-title">جديد المجلس العلمي</h2>
          </div>
          <Link href="/updates" className="home-section-link">آخر التحديثات</Link>
        </div>
        <HomeLatestUpdates />
      </section>

      <section className="home-section home-section--compact">
        <div className="home-section-head">
          <div>
            <p className="home-section-kicker">دروس</p>
            <h2 className="home-section-title">أحدث الدروس</h2>
          </div>
          <Link href="/lessons" className="home-section-link">كل الدروس</Link>
        </div>
        <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
      </section>

      <section className="home-section home-section--compact">
        <div className="home-section-head">
          <div>
            <p className="home-section-kicker">الأكثر زيارة</p>
            <h2 className="home-section-title">محتوى شائع</h2>
          </div>
          <Link href="/stats" className="home-section-link">الإحصائيات</Link>
        </div>
        <div className="home-popular-grid">
          <Link href="/quran" className="home-popular-card">المصحف</Link>
          <Link href="/qa" className="home-popular-card">الأسئلة</Link>
          <Link href="/quran/surah-stories" className="home-popular-card">قصص السور</Link>
          <Link href="/library" className="home-popular-card">المكتبة</Link>
        </div>
      </section>

      <section className="home-quick-links home-section--compact">
        <Link href="/profile" className="home-quick-link">لوحتي</Link>
        <Link href="/favorites" className="home-quick-link">المفضلة</Link>
        <Link href="/challenges" className="home-quick-link">التحديات</Link>
        <Link href="/continue" className="home-quick-link">واصل</Link>
      </section>
    </>
  );
}

export default HomePersonalized;
