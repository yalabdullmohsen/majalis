import type { Metadata } from "next";
import { fetchLessonsForServer } from "../../../lib/supabase/server-data";
import LessonsPageClient from "@/components/seo/LessonsPageClient";
import { buildLessonUrl } from "@/lib/content-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { active } = await fetchLessonsForServer();
  const count = active.length;
  return {
    title: "الدروس الشرعية",
    description: `جميع الدروس والدورات الشرعية — ${count} درس ودورة معتمدة مع بحث وفلاتر للمكان والتصنيف.`,
    openGraph: {
      title: "الدروس الشرعية | المجلس العلمي",
      description: `استعرض ${count} درساً ودورة شرعية معتمدة — جداول ومواقع وروابط.`,
      locale: "ar_AR",
      type: "website",
      url: "https://majlisilm.com/lessons",
    },
  };
}

export default async function LessonsPage() {
  const { active, archived } = await fetchLessonsForServer();

  return (
    <>
      <section className="page-shell" aria-label="فهرس الدروس">
        <h1 className="home-section-title">الدروس الشرعية</h1>
        <p className="seo-listing-intro">
          {active.length.toLocaleString("ar-EG")} درس ودورة نشطة — {archived.length.toLocaleString("ar-EG")} درس في الأرشيف.
        </p>
        <div className="seo-listing-links">
          {active.slice(0, 12).map((lesson) => (
            <a key={lesson.id} href={buildLessonUrl(lesson)}>
              {lesson.title}
              {lesson.sheikhName ? ` — ${lesson.sheikhName}` : ""}
            </a>
          ))}
        </div>
      </section>
      <LessonsPageClient initialActive={active} initialArchived={archived} />
    </>
  );
}
