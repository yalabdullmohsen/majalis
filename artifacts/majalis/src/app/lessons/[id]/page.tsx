import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchLessonByIdForServer,
} from "../../../../lib/supabase/server-data";
import LessonDetailClient from "@/components/seo/LessonDetailClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lesson = await fetchLessonByIdForServer(id);

  if (!lesson) {
    return {
      title: "درس غير موجود",
      robots: { index: false, follow: true },
    };
  }

  const description = [
    lesson.sheikhName ? `الشيخ: ${lesson.sheikhName}` : "",
    lesson.mosque || lesson.region ? `المكان: ${lesson.mosque || lesson.region}` : "",
    [lesson.day, lesson.time].filter(Boolean).join(" ") || "",
  ]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 160);

  return {
    title: lesson.title,
    description: description || `${lesson.title} — درس شرعي على المجلس العلمي`,
    openGraph: {
      title: `${lesson.title} | المجلس العلمي`,
      description,
      locale: "ar_AR",
      type: "article",
      url: `https://majlisilm.com/lessons/${lesson.id}`,
      images: lesson.sheikhImage
        ? [{ url: lesson.sheikhImage, alt: lesson.title }]
        : [{ url: "/logo.png", alt: lesson.title }],
    },
  };
}

export default async function LessonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lesson = await fetchLessonByIdForServer(id);

  if (!lesson) {
    notFound();
  }

  return (
    <>
      <article className="page-shell" aria-label={lesson.title}>
        <h1>{lesson.title}</h1>
        {lesson.sheikhName && <p className="seo-listing-intro">الشيخ: {lesson.sheikhName}</p>}
        {(lesson.mosque || lesson.region) && (
          <p className="seo-listing-intro">المكان: {[lesson.mosque, lesson.region].filter(Boolean).join(" — ")}</p>
        )}
        {lesson.description && <p className="seo-listing-intro">{lesson.description}</p>}
      </article>
      <LessonDetailClient lesson={lesson} />
    </>
  );
}
