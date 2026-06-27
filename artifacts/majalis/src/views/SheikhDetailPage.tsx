import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { HomeLessonCard } from "@/components/home/HomeLessonCard";
import { OptimizedSheikhImage } from "@/components/sheikh/OptimizedSheikhImage";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import {
  KUWAIT_SHEIKH_PROFILES,
  resolveKuwaitSheikhProfile,
  type KuwaitSheikhProfile,
} from "@/lib/kuwait-sheikh-profiles";
import { sheikhNameKey } from "@/lib/sheikh-name";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function filterSheikhLessons(lessons: KuwaitLessonRecord[], profile: KuwaitSheikhProfile) {
  const keys = new Set([
    sheikhNameKey(profile.name),
    sheikhNameKey(profile.fullName),
  ]);
  return lessons.filter((lesson) => keys.has(sheikhNameKey(lesson.sheikhName)));
}

export default function SheikhDetailPage({ params: paramsProp }: { params?: { id: string } }) {
  const [, routeParams] = useRoute("/sheikhs/:id");
  const id = paramsProp?.id || routeParams?.id || "";
  const profile = useMemo(() => resolveKuwaitSheikhProfile(id), [id]);
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLessons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getUnifiedActiveLessons()
      .then(({ lessons: items }) => {
        const all = Array.isArray(items) ? items : [];
        setLessons(filterSheikhLessons(all, profile));
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [profile]);

  usePageView("sheikh", id);

  useEffect(() => {
    if (!profile) return;
    const path = `/sheikhs/${profile.id}`;
    applyPageSeo({
      path,
      title: `${profile.name} | المشايخ — المجلس العلمي`,
      description: profile.bio.slice(0, 160),
      keywords: [...profile.specialties, profile.country, "شيخ", "دروس"],
      ogType: "profile",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.fullName,
          jobTitle: profile.role,
          nationality: profile.country,
          description: profile.bio,
          url: `https://majlisilm.com${path}`,
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الدروس", path: "/lessons" },
          { name: profile.name, path },
        ]),
      ],
    });
  }, [profile]);

  if (!id) return <Empty text="معرّف الشيخ غير صالح." />;
  if (!profile) return <Empty text="لم يُعثر على هذا الشيخ." />;

  const photo = profile.photo_url;

  return (
    <div className="page-shell narrow sheikh-detail-page">
      <nav className="lesson-detail-breadcrumb" aria-label="مسار التصفح">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/lessons">الدروس</Link>
        <span aria-hidden="true"> / </span>
        <span>{profile.name}</span>
      </nav>

      <article className="ui-card sheikh-detail-card">
        <div className="sheikh-detail-hero">
          <div className="sheikh-detail-hero__main">
            {photo && (
              <OptimizedSheikhImage
                src={photo}
                name={profile.name}
                size={128}
                variant="portrait"
                priority
              />
            )}
            <div className="sheikh-detail-hero__copy">
              <div className="sheikh-detail-hero__title-row">
                <h1 className="sheikh-detail-name">{profile.fullName}</h1>
                {profile.needs_verification && (
                  <span className="sheikh-detail-badge sheikh-detail-badge--warn">بحاجة تحقق</span>
                )}
              </div>
              {profile.role && <p className="sheikh-detail-role">{profile.role}</p>}
              <div className="sheikh-detail-meta-row">
                <span className="page-soft-tag">الدولة: {profile.country}</span>
                {profile.specialties.map((tag) => (
                  <span key={tag} className="page-soft-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sheikh-detail-section">
          <h2 className="sheikh-detail-section-title">نبذة مختصرة</h2>
          <p className="sheikh-detail-bio">{profile.bio}</p>
          {profile.needs_verification && (
            <p className="sheikh-detail-verify-note" role="note">
              هذه المعلومات بحاجة إلى تحقق إضافي من مصادر مستقلة.
            </p>
          )}
        </div>

        {profile.sources.length > 0 && (
          <div className="sheikh-detail-section">
            <h2 className="sheikh-detail-section-title">مصادر المعلومات</h2>
            <ul className="sheikh-detail-sources">
              {profile.sources.map((source) => (
                <li key={source.source_url}>
                  <a href={source.source_url} target="_blank" rel="noopener noreferrer">
                    {source.source_title}
                  </a>
                  <span className={`sheikh-detail-source-badge${source.verified ? " is-verified" : ""}`}>
                    {source.verified ? "موثّق" : "غير موثّق"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sheikh-detail-section">
          <h2 className="sheikh-detail-section-title">الدروس المرتبطة</h2>
          {loading ? (
            <Loading />
          ) : lessons.length === 0 ? (
            <p className="lessons-empty-state">لا توجد دروس نشطة مرتبطة بهذا الشيخ حالياً.</p>
          ) : (
            <div className="home-kuwait-grid">
              {lessons.map((lesson) => (
                <HomeLessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

export function listKuwaitSheikhProfiles(): KuwaitSheikhProfile[] {
  return KUWAIT_SHEIKH_PROFILES;
}
