import type { Metadata } from "next";
import {
  fetchHomePlatformStats,
  fetchLessonsForServer,
} from "../../lib/supabase/server-data";
import type { HomePlatformStats } from "../../lib/supabase/server-data";
import HomePage from "@/views/HomePage";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المجلس العلمي — دروس شرعية ودورات علمية",
  description:
    "منصة علمية عربية تجمع الدروس الشرعية والدورات والقرآن والأذكار والفوائد في مكان واحد لطالب العلم.",
  openGraph: {
    title: "المجلس العلمي — دروس شرعية ودورات علمية",
    description:
      "منصة علمية عربية تجمع الدروس الشرعية والدورات والقرآن والأذكار والفوائد في مكان واحد لطالب العلم.",
    locale: "ar_AR",
    type: "website",
    url: "https://majlisilm.com",
    images: [{ url: "/logo.png", alt: "المجلس العلمي" }],
  },
};

function HomeStatsBar({ stats }: { stats: HomePlatformStats }) {
  const items = [
    { label: "درس ودورة", value: stats.lessonsCount },
    { label: "شيخ وعالم", value: stats.sheikhsCount },
    { label: "مادة علمية", value: stats.libraryCount },
    { label: "سؤال شرعي", value: stats.qaCount },
    { label: "فائدة", value: stats.fawaidCount },
    { label: "مقال إعجاز", value: stats.miraclesCount },
  ];

  return (
    <section className="home-stats--v2026" aria-label="إحصائيات المنصة">
      {items.map((item) => (
        <article key={item.label} className="home-stats--v2026__item">
          <strong className="home-stats--v2026__value">{item.value.toLocaleString("ar-EG")}</strong>
          <span className="home-stats--v2026__label">{item.label}</span>
        </article>
      ))}
    </section>
  );
}

function FeaturedLessonsSeo({ lessons }: { lessons: KuwaitLessonRecord[] }) {
  if (!lessons.length) return null;

  return (
    <section className="home-container" aria-label="أحدث الدروس">
      <h2 className="home-section-title">أحدث الدروس الشرعية</h2>
      <div className="seo-listing-links">
        {lessons.map((lesson) => (
          <a key={lesson.id} href={`/lessons/${lesson.id}`}>
            {lesson.title}
            {lesson.sheikhName ? ` — ${lesson.sheikhName}` : ""}
          </a>
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const [stats, lessonsResult] = await Promise.all([
    fetchHomePlatformStats(),
    fetchLessonsForServer(),
  ]);
  const featuredLessons = lessonsResult.active.slice(0, 8);

  return (
    <>
      <HomeStatsBar stats={stats} />
      <FeaturedLessonsSeo lessons={featuredLessons} />
      <HomePage
        initialFeaturedLessons={featuredLessons}
      />
    </>
  );
}
