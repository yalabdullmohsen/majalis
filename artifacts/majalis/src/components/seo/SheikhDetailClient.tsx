"use client";

import { Link } from "wouter";
import { PageHeader, Empty, Card } from "@/components/ui-common";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { OptimizedSheikhImage } from "@/components/sheikh/OptimizedSheikhImage";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { resolveScholarProfile } from "@/lib/kuwait-sheikhs-registry";

type SheikhRecord = {
  id: string;
  name: string;
  fullName?: string;
  bio?: string;
  city?: string;
  country?: string;
  ijazah?: string;
  role?: string;
  specialties?: string[];
  photo_url?: string;
  website_url?: string;
  links?: { label: string; url: string }[];
  subjects?: string[];
  mutoon?: string[];
  keywords?: string[];
};

export default function SheikhDetailClient({
  sheikh,
  lessons,
}: {
  sheikh: SheikhRecord | null;
  lessons: KuwaitLessonRecord[];
}) {
  if (!sheikh) {
    return (
      <div className="page-shell">
        <Empty text="تعذر العثور على هذا الشيخ." />
      </div>
    );
  }

  const profile = resolveScholarProfile(sheikh.id || sheikh.name);
  const displayName = sheikh.fullName || sheikh.name;
  const photo = sheikh.photo_url || profile?.photo_url || "/logo.png";
  const links = sheikh.links?.length ? sheikh.links : profile?.links || [];
  const specialties = sheikh.specialties?.length ? sheikh.specialties : profile?.specialties || [];
  const mutoon = sheikh.mutoon?.length ? sheikh.mutoon : profile?.mutoon || [];
  const subjects = sheikh.subjects?.length ? sheikh.subjects : profile?.subjects || [];

  const courses = lessons.filter((l) => l.isCourse);
  const regularLessons = lessons.filter((l) => !l.isCourse);

  return (
    <div className="page-shell narrow sheikh-detail-page" dir="rtl">
      <nav className="breadcrumb-nav" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        {" / "}
        <Link href="/sheikhs">المشايخ</Link>
        {" / "}
        <span>{displayName}</span>
      </nav>

      <div className="sheikh-detail-hero">
        <OptimizedSheikhImage src={photo} name={displayName} className="sheikh-detail-photo" />
        <div>
          <PageHeader
            eyebrow="الملف العلمي"
            title={displayName}
            subtitle={[sheikh.country || profile?.country, sheikh.city || profile?.city, sheikh.ijazah || sheikh.role || profile?.role]
              .filter(Boolean)
              .join(" · ")}
          />
          {sheikh.bio && <p className="seo-listing-intro">{sheikh.bio}</p>}
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="sheikh-detail-tags">
          {specialties.map((tag) => (
            <span key={tag} className="ui-tag">{tag}</span>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <Card className="sheikh-detail-links">
          <h2>روابط الشيخ</h2>
          <div className="sheikh-links-row">
            {links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn--ghost ds-btn--sm">
                {link.label}
              </a>
            ))}
          </div>
        </Card>
      )}

      {subjects.length > 0 && (
        <Card className="sheikh-detail-section">
          <h2>المواد التي يشرحها</h2>
          <ul>{subjects.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
      )}

      {mutoon.length > 0 && (
        <Card className="sheikh-detail-section">
          <h2>المتون والكتب</h2>
          <ul>{mutoon.map((m) => <li key={m}>{m}</li>)}</ul>
        </Card>
      )}

      <Card className="sheikh-detail-section">
        <h2>الدروس ({regularLessons.length})</h2>
        {regularLessons.length === 0 ? (
          <Empty text="لا توجد دروس معتمدة مرتبطة بهذا الشيخ حالياً." />
        ) : (
          <div className="seo-listing-links">
            {regularLessons.map((lesson) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                {lesson.title}
                {lesson.day && lesson.time ? ` — ${lesson.day} ${lesson.time}` : ""}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {courses.length > 0 && (
        <Card className="sheikh-detail-section">
          <h2>الدورات والسلاسل ({courses.length})</h2>
          <div className="seo-listing-links">
            {courses.map((lesson) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                {lesson.title}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <RelatedKnowledge query={displayName} title="محتوى ذو صلة بالشيخ" limit={8} />
    </div>
  );
}
