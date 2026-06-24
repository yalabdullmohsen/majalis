import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { getPlatformLessons } from "@/lib/platform-api";
import type { PlatformLesson } from "@/lib/platform-types";
import { FavoriteButton } from "@/components/platform/FavoriteButton";

export default function AudioLibraryPage() {
  const [lessons, setLessons] = useState<PlatformLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformLessons().then(setLessons).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="المكتبة"
        title="المكتبة الصوتية والتفريغات"
        subtitle="استماع، تحميل، تفريغ، ومراجع الدروس."
      />

      {loading && <Loading />}
      {!loading && lessons.length === 0 && <Empty text="لا توجد مواد صوتية حالياً." />}

      <div className="audio-library-grid">
        {lessons.map((lesson) => (
          <article key={lesson.id} className="ui-card audio-lesson-card">
            <h3>{lesson.title}</h3>
            <p>{lesson.sheikh_name} — {lesson.mosque_name}</p>
            {lesson.transcript && <p className="audio-transcript">{lesson.transcript.slice(0, 160)}...</p>}
            <div className="audio-lesson-actions">
              {lesson.audio_url ? (
                <a href={lesson.audio_url} target="_blank" rel="noopener noreferrer" className="ui-card-btn">استماع</a>
              ) : (
                <span className="audio-unavailable">لا يوجد ملف صوتي بعد</span>
              )}
              {lesson.audio_url && (
                <a href={lesson.audio_url} download className="ui-card-btn ui-card-btn--ghost">تحميل</a>
              )}
              {lesson.book_url && (
                <a href={lesson.book_url} target="_blank" rel="noopener noreferrer" className="ui-card-btn ui-card-btn--ghost">الكتاب</a>
              )}
              <FavoriteButton itemType="lesson" itemId={lesson.id} />
            </div>
          </article>
        ))}
      </div>

      <p className="page-note">
        <Link href="/transcribe">تفريغ المحاضرات</Link> متاح من قسم التفريغ.
      </p>
    </div>
  );
}
