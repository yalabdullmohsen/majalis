"use client";

import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export default function SheikhDetailClient({
  sheikh,
  lessons,
}: {
  sheikh: any;
  lessons: KuwaitLessonRecord[];
}) {
  if (!sheikh) {
    return (
      <div className="page-shell">
        <Empty text="تعذر العثور على هذا الشيخ." />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="المشايخ"
        title={sheikh.name}
        subtitle={[sheikh.city, sheikh.ijazah].filter(Boolean).join(" · ")}
      />

      {sheikh.bio && <p className="seo-listing-intro">{sheikh.bio}</p>}

      {Array.isArray(sheikh.specialties) && sheikh.specialties.length > 0 && (
        <div className="sheikh-detail-tags" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {sheikh.specialties.map((tag: string) => (
            <span key={tag} className="ui-tag">{tag}</span>
          ))}
        </div>
      )}

      {sheikh.ijazah && (
        <p className="seo-listing-intro" style={{ marginTop: 0 }}>
          <strong>الإجازة:</strong> {sheikh.ijazah}
        </p>
      )}

      <h2 className="home-section-title">الدروس المرتبطة</h2>
      {lessons.length === 0 ? (
        <Empty text="لا توجد دروس معتمدة مرتبطة بهذا الشيخ حالياً." />
      ) : (
        <div className="seo-listing-links">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              {lesson.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
