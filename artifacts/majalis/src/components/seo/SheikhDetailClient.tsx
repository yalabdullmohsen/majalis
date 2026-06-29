"use client";

import { Link } from "wouter";
import { PageHeader, Empty, Card } from "@/components/ui-common";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { OptimizedSheikhImage } from "@/components/sheikh/OptimizedSheikhImage";
import { ScholarBiographySection } from "@/components/sheikh/ScholarBiographySection";
import { ScholarCollapsibleCard } from "@/components/sheikh/ScholarCollapsibleCard";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import type { ScholarProfile } from "@/lib/scholar-biography";
import { lifeStatusLabel } from "@/lib/scholar-biography";

type Props = {
  sheikh: ScholarProfile | null;
  lessons: KuwaitLessonRecord[];
  similarSheikhs?: ScholarProfile[];
};

function officialLinks(profile: ScholarProfile) {
  const links: { label: string; url: string }[] = [...(profile.links || [])];
  const add = (label: string, url?: string) => {
    if (url?.trim() && !links.some((l) => l.url === url)) links.push({ label, url: url.trim() });
  };
  add("الموقع الرسمي", profile.official_website);
  add("X", profile.twitter_url);
  add("Instagram", profile.instagram_url);
  add("YouTube", profile.youtube_url);
  add("Facebook", profile.facebook_url);
  add("Telegram", profile.telegram_url);
  return links;
}

export default function SheikhDetailClient({ sheikh, lessons, similarSheikhs = [] }: Props) {
  if (!sheikh) {
    return (
      <div className="page-shell">
        <Empty text="تعذر العثور على هذا الشيخ." />
      </div>
    );
  }

  const displayName = sheikh.fullName || sheikh.name;
  const photo = sheikh.photo_url || sheikh.image_url || "/logo.png";
  const specialties = sheikh.specialties || [];
  const mutoon = sheikh.mutoon || [];
  const subjects = sheikh.subjects || [];
  const links = officialLinks(sheikh);
  const lifeLabel = lifeStatusLabel(sheikh.life_status);
  const courses = lessons.filter((l) => l.isCourse);
  const regularLessons = lessons.filter((l) => !l.isCourse);

  const subtitleParts = [
    sheikh.kunya,
    sheikh.title || sheikh.ijazah || sheikh.role,
    sheikh.country,
    sheikh.city,
    lifeLabel,
  ].filter(Boolean);

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
            subtitle={subtitleParts.join(" · ")}
          />
          {sheikh.bio && <p className="seo-listing-intro">{sheikh.bio}</p>}
          {sheikh.is_verified && <span className="ui-tag ui-tag--verified">معتمد</span>}
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="sheikh-detail-tags">
          {specialties.map((tag) => (
            <span key={tag} className="ui-tag">{tag}</span>
          ))}
        </div>
      )}

      <ScholarBiographySection profile={sheikh} />

      {links.length > 0 && (
        <ScholarCollapsibleCard title="روابط الشيخ" count={links.length}>
          <div className="sheikh-links-row">
            {links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn--ghost ds-btn--sm">
                {link.label}
              </a>
            ))}
          </div>
        </ScholarCollapsibleCard>
      )}

      {subjects.length > 0 && (
        <ScholarCollapsibleCard title="المواد التي يشرحها" count={subjects.length}>
          <ul className="scholar-bio-list">{subjects.map((s) => <li key={s}>{s}</li>)}</ul>
        </ScholarCollapsibleCard>
      )}

      {mutoon.length > 0 && (
        <ScholarCollapsibleCard title="المتون والكتب" count={mutoon.length}>
          <ul className="scholar-bio-list">{mutoon.map((m) => <li key={m}>{m}</li>)}</ul>
        </ScholarCollapsibleCard>
      )}

      <ScholarCollapsibleCard title="الدروس" count={regularLessons.length} id="sheikh-lessons">
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
      </ScholarCollapsibleCard>

      {courses.length > 0 && (
        <ScholarCollapsibleCard title="الدورات والسلاسل" count={courses.length}>
          <div className="seo-listing-links">
            {courses.map((lesson) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                {lesson.title}
              </Link>
            ))}
          </div>
        </ScholarCollapsibleCard>
      )}

      {similarSheikhs.length > 0 && (
        <ScholarCollapsibleCard title="مشايخ مشابهون" count={similarSheikhs.length}>
          <div className="page-card-grid scholar-similar-grid">
            {similarSheikhs.map((s) => (
              <Link key={s.id} href={`/sheikhs/${s.id}`} className="page-card sheikh-card sheikh-card--compact">
                <OptimizedSheikhImage src={s.photo_url || "/logo.png"} name={s.name} className="sheikh-card-photo" />
                <p>{s.fullName || s.name}</p>
                {s.specialties?.[0] && <span className="page-meta">{s.specialties[0]}</span>}
              </Link>
            ))}
          </div>
        </ScholarCollapsibleCard>
      )}

      <RelatedKnowledge query={displayName} title="محتوى ذو صلة بالشيخ" limit={8} />
    </div>
  );
}
