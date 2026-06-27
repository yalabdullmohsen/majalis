import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { getLessonById, getSheikhs } from "@/lib/supabase";
import { Loading, Empty } from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";
import { isDemoId } from "@/lib/demo-content";
import { extractLessonSchedule, hasValue } from "@/lib/lesson-display";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { OptimizedSheikhImage } from "@/components/sheikh/OptimizedSheikhImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import {
  buildLessonCopyText,
  buildLessonShareUrl,
  downloadUnifiedCalendar,
  fromDbLesson,
  fromKuwaitLesson,
  streamActionLabel,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import {
  fetchRelatedLessons,
  fetchSameSheikhLessons,
  fetchSeriesLessons,
  getUnifiedLessonById,
} from "@/lib/lessons-service";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { mapLessonRow } from "@/lib/kuwait-lessons";
import { cleanTimeText } from "@/lib/lesson-time";
import { useLessonSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { fetchLessonEngagementStats, type LessonEngagementStats } from "@/lib/lesson-stats";
import { normalizeActivityLabel } from "@/lib/activity-label";
import { resolveLessonPosterDisplayUrl } from "@/lib/lesson-image";
import { sheikhNameKey } from "@/lib/sheikh-name";
import {
  resolveKuwaitSheikhProfile,
  sheikhProfileHref,
  type KuwaitSheikhProfile,
} from "@/lib/kuwait-sheikh-profiles";

function buildMapsEmbed(url?: string, mosque?: string, region?: string) {
  if (url?.includes("google.com/maps") || url?.includes("goo.gl/maps") || url?.includes("maps.app")) {
    const query = encodeURIComponent(`${mosque || ""} ${region || ""} الكويت`.trim());
    return `https://www.google.com/maps?q=${query}&output=embed`;
  }
  if (mosque || region) {
    const query = encodeURIComponent(`${mosque || ""} ${region || ""} الكويت`.trim());
    return `https://www.google.com/maps?q=${query}&output=embed`;
  }
  return null;
}

function inferLessonLevel(category?: string): string {
  if (!category) return "عام";
  if (category === "تأصيل") return "متقدم";
  if (category === "تجويد") return "مبتدئ";
  return "عام";
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="lesson-detail-stat">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString("ar") : value}</strong>
    </div>
  );
}

export default function LessonDetailPage({
  params: paramsProp,
  initialLesson,
}: {
  params?: { id: string };
  initialLesson?: KuwaitLessonRecord | null;
}) {
  const [, routeParams] = useRoute("/lessons/:id");
  const params = paramsProp ?? routeParams ?? { id: "" };
  const [lesson, setLesson] = useState<any>(null);
  const [kuwaitLesson, setKuwaitLesson] = useState<KuwaitLessonRecord | null>(initialLesson ?? null);
  const [similar, setSimilar] = useState<KuwaitLessonRecord[]>([]);
  const [sameSheikh, setSameSheikh] = useState<KuwaitLessonRecord[]>([]);
  const [seriesLessons, setSeriesLessons] = useState<KuwaitLessonRecord[]>([]);
  const [sheikhProfile, setSheikhProfile] = useState<KuwaitSheikhProfile | null>(null);
  const [stats, setStats] = useState<LessonEngagementStats>({ views: 0, saves: 0, shares: 0 });
  const [loading, setLoading] = useState(!initialLesson);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (initialLesson) {
      Promise.all([
        fetchRelatedLessons(initialLesson),
        fetchSameSheikhLessons(initialLesson),
        fetchSeriesLessons(initialLesson),
        fetchLessonEngagementStats(initialLesson.id),
      ]).then(([related, sheikhLessons, series, engagement]) => {
        setSimilar(related);
        setSameSheikh(sheikhLessons);
        setSeriesLessons(series);
        setStats(engagement);
      }).catch(() => {
        setSimilar([]);
        setSameSheikh([]);
        setSeriesLessons([]);
      });
      return;
    }

    if (!params.id) return;

    setLoading(true);
    getUnifiedLessonById(params.id)
      .then(({ lesson: staticLesson }) => {
        if (staticLesson) {
          setKuwaitLesson(staticLesson);
          setLesson(null);
          return Promise.all([
            fetchRelatedLessons(staticLesson),
            fetchSameSheikhLessons(staticLesson),
            fetchSeriesLessons(staticLesson),
            fetchLessonEngagementStats(staticLesson.id),
          ]).then(([related, sheikhLessons, series, engagement]) => {
            setSimilar(related);
            setSameSheikh(sheikhLessons);
            setSeriesLessons(series);
            setStats(engagement);
          });
        }

        return getLessonById(params.id).then(({ lesson: dbLesson }) => {
          setLesson(dbLesson);
          setKuwaitLesson(null);
          if (!dbLesson) return undefined;
          const mapped = mapLessonRow(dbLesson);
          return Promise.all([
            fetchRelatedLessons(mapped),
            fetchSameSheikhLessons(mapped),
            fetchSeriesLessons(mapped),
            fetchLessonEngagementStats(mapped.id),
          ]).then(([related, sheikhLessons, series, engagement]) => {
            setSimilar(related);
            setSameSheikh(sheikhLessons);
            setSeriesLessons(series);
            setStats(engagement);
          });
        });
      })
      .finally(() => setLoading(false));
  }, [params.id, initialLesson]);

  useEffect(() => {
    const name = kuwaitLesson?.sheikhName || lesson?.speaker_name || lesson?.sheikhs?.name;
    if (!name) {
      setSheikhProfile(null);
      return;
    }

    const localProfile = resolveKuwaitSheikhProfile(name);
    if (localProfile) {
      setSheikhProfile(localProfile);
      return;
    }

    getSheikhs()
      .then(({ data }) => {
        const key = sheikhNameKey(name);
        const match = (data || []).find((s: { name?: string; bio?: string }) => sheikhNameKey(s.name || "") === key);
        if (match?.bio) {
          setSheikhProfile({
            id: key.replace(/\s+/g, "-"),
            name,
            fullName: match.name || name,
            country: "الكويت",
            specialties: [],
            bio: match.bio,
            needs_verification: false,
            sources: [],
          });
        } else {
          setSheikhProfile(null);
        }
      })
      .catch(() => setSheikhProfile(null));
  }, [kuwaitLesson, lesson]);

  const unified = useMemo(() => {
    if (kuwaitLesson) return fromKuwaitLesson(kuwaitLesson);
    if (lesson) return fromDbLesson(lesson);
    return null;
  }, [kuwaitLesson, lesson]);

  const seoLesson = useMemo((): KuwaitLessonRecord | null => {
    if (kuwaitLesson) return kuwaitLesson;
    if (lesson) return mapLessonRow(lesson);
    return null;
  }, [kuwaitLesson, lesson]);

  useLessonSeo(seoLesson, `/lessons/${params.id}`);
  usePageView("lesson", params.id);

  if (loading) return <Loading />;
  if (!unified) return <Empty text="لم يُعثر على الدرس." />;

  const sheikhName = unified.sheikhName;
  const sheikhImage = kuwaitLesson?.sheikhImage || resolveLessonSheikhImage(lesson);
  const hasSheikhPhoto = Boolean(sheikhImage && !sheikhImage.includes("logo"));
  const { day, time, dateLabel } = lesson ? extractLessonSchedule(lesson) : { day: unified.day, time: unified.time, dateLabel: unified.gregorianDate };
  const mapsEmbed = buildMapsEmbed(unified.mapsUrl, unified.mosque, unified.region);
  const activityLabel = normalizeActivityLabel(unified.activityType);
  const keywords = unified.keywords || [];
  const tags = [...new Set([unified.category, activityLabel, ...(keywords.slice(0, 6))].filter(Boolean))];
  const level = inferLessonLevel(unified.category);
  const addedDate = lesson?.created_at || lesson?.updated_at || unified.gregorianDate;
  const posterUrl = unified.posterDisplayUrl || resolveLessonPosterDisplayUrl(kuwaitLesson?.lessonImage || lesson?.poster_image_url);
  const organizer = kuwaitLesson?.organizer || lesson?.organizer;
  const coOrganizer = kuwaitLesson?.coOrganizer || lesson?.co_organizer;
  const hasWomenPlace =
    kuwaitLesson?.hasWomenPlace ||
    lesson?.has_women_place === true ||
    lesson?.audience === "الكل";
  const locationFull = [unified.mosque, unified.region, unified.governorate].filter(Boolean).join(" — ");

  const handleShare = async () => {
    const url = buildLessonShareUrl(unified);
    const text = buildLessonCopyText(unified);
    if (navigator.share) {
      try {
        await navigator.share({ title: unified.title, text, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("تم نسخ تفاصيل الدرس.");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildLessonShareUrl(unified));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  return (
    <div className="page-shell narrow lesson-detail-page">
      <nav className="lesson-detail-breadcrumb" aria-label="مسار التصفح">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/lessons">الدروس</Link>
        <span aria-hidden="true"> / </span>
        <span>{unified.title}</span>
      </nav>

      <Link href="/lessons" className="lesson-detail-back">
        ← العودة إلى الدروس
      </Link>

      <article className="ui-card lesson-detail-card">
        {posterUrl && (
          <div className="lesson-detail-poster">
            <img
              src={posterUrl}
              alt={`إعلان الدرس: ${unified.title}`}
              loading="eager"
              decoding="async"
              width={720}
              height={480}
            />
          </div>
        )}
        <div className={`lesson-detail-hero${hasSheikhPhoto ? "" : " lesson-detail-hero--text-only"}`}>
          {hasSheikhPhoto && (
            <OptimizedSheikhImage
              src={sheikhImage}
              name={sheikhName || "شيخ"}
              size={136}
              variant="portrait"
              priority
            />
          )}
          <div className="lesson-detail-hero__copy">
            {hasValue(sheikhName) && (
              sheikhProfile ? (
                <Link href={sheikhProfileHref(sheikhProfile)} className="lesson-card-pro__sheikh lesson-detail-sheikh-link">
                  {sheikhName}
                </Link>
              ) : (
                <p className="lesson-card-pro__sheikh">{sheikhName}</p>
              )
            )}
            <h1 className="lesson-detail-title">{unified.title}</h1>
            <div className="lesson-detail-tags">
              {hasValue(unified.category) && <span className="page-tag">{unified.category}</span>}
              <span className="page-soft-tag">{activityLabel}</span>
              <span className="page-soft-tag">المستوى: {level}</span>
              <span className="page-soft-tag">اللغة: العربية</span>
              {unified.hasLiveStream && <span className="page-soft-tag">بث مباشر</span>}
              {unified.hasRecording && <span className="page-soft-tag">تسجيل</span>}
            </div>
            {(unified.note || unified.description) && (
              <p className="lesson-detail-summary">
                {cleanDisplayText(unified.note || unified.description?.slice(0, 220) || "")}
              </p>
            )}
          </div>
        </div>

        <div className="lesson-detail-stats-row">
          <StatPill label="المشاهدات" value={stats.views} />
          <StatPill label="الحفظ" value={stats.saves} />
          {unified.sessionCount != null && unified.sessionCount > 0 && (
            <StatPill label="اللقاءات" value={unified.sessionCount} />
          )}
        </div>

        <dl className="lesson-card-pro__meta lesson-detail-meta">
          {hasValue(day) && (
            <div><dt>اليوم</dt><dd>{day}</dd></div>
          )}
          {hasValue(unified.gregorianDate || dateLabel) && (
            <div><dt>التاريخ</dt><dd>{unified.gregorianDate || dateLabel}</dd></div>
          )}
          {hasValue(unified.hijriDate) && (
            <div><dt>التاريخ الهجري</dt><dd>{unified.hijriDate}</dd></div>
          )}
          {hasValue(time || unified.time) && (
            <div><dt>الوقت</dt><dd>{cleanTimeText(time || unified.time)}</dd></div>
          )}
          {hasValue(locationFull) && (
            <div><dt>المكان</dt><dd>{locationFull}</dd></div>
          )}
          {hasValue(organizer) && (
            <div><dt>الجهة المنظمة</dt><dd>{organizer}</dd></div>
          )}
          {hasValue(coOrganizer) && (
            <div><dt>بالتعاون مع</dt><dd>{coOrganizer}</dd></div>
          )}
          <div><dt>مكان للنساء</dt><dd>{hasWomenPlace ? "نعم — يوجد مكان مخصص" : "غير محدد"}</dd></div>
          <div><dt>بث مباشر</dt><dd>{unified.hasLiveStream ? "نعم" : "لا"}</dd></div>
          {addedDate && (
            <div><dt>تاريخ الإضافة</dt><dd>{String(addedDate).slice(0, 10)}</dd></div>
          )}
        </dl>

        {hasValue(unified.description) && (
          <div className="lesson-detail-body">
            <h2>عن الدرس</h2>
            <p>{cleanDisplayText(unified.description)}</p>
          </div>
        )}

        {sheikhProfile && (
          <div className="lesson-detail-body">
            <h2>نبذة عن الشيخ</h2>
            <p>{cleanDisplayText(sheikhProfile.bio)}</p>
            {sheikhProfile.needs_verification && (
              <p className="sheikh-detail-verify-note" role="note">
                هذه المعلومات بحاجة إلى تحقق إضافي.
              </p>
            )}
            {sheikhProfile.sources.length > 0 && (
              <ul className="sheikh-detail-sources sheikh-detail-sources--inline">
                {sheikhProfile.sources.map((source) => (
                  <li key={source.source_url}>
                    <a href={source.source_url} target="_blank" rel="noopener noreferrer">
                      {source.source_title}
                    </a>
                    {source.verified && <span className="sheikh-detail-source-badge is-verified">موثّق</span>}
                  </li>
                ))}
              </ul>
            )}
            <Link href={sheikhProfileHref(sheikhProfile)} className="lesson-unified-card__btn lesson-unified-card__btn--ghost">
              الملف الكامل للشيخ
            </Link>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="lesson-detail-body">
            <h2>الكلمات المفتاحية</h2>
            <div className="lesson-detail-tags">
              {keywords.map((kw) => (
                <span key={kw} className="page-soft-tag">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="lesson-detail-body">
            <h2>الوسوم</h2>
            <div className="lesson-detail-tags">
              {tags.map((tag) => (
                <span key={tag} className="page-soft-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {unified.linkedLessons && unified.linkedLessons.length > 0 && (
          <div className="lesson-detail-body">
            <h2>الدروس المرتبطة</h2>
            <ul className="lesson-detail-linked">
              {unified.linkedLessons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {mapsEmbed && (
          <div className="lesson-detail-map">
            <h2>الموقع على الخريطة</h2>
            <iframe
              title={`خريطة ${unified.mosque}`}
              src={mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}

        <div className="lesson-detail-actions lesson-detail-actions--row">
          <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--primary" onClick={handleShare}>
            مشاركة
          </button>
          <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--secondary" onClick={handleCopyLink}>
            {linkCopied ? "تم نسخ الرابط" : "نسخ الرابط"}
          </button>
          <FavoriteButton contentType="lesson" contentId={unified.id} />
          <button
            type="button"
            className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
            onClick={() => downloadUnifiedCalendar(unified)}
          >
            إضافة للتقويم
          </button>
          {unified.streamUrl && (
            <a href={unified.streamUrl} target="_blank" rel="noopener noreferrer" className="lesson-unified-card__btn lesson-unified-card__btn--ghost">
              {streamActionLabel(unified)}
            </a>
          )}
          {unified.mapsUrl && (
            <a href={unified.mapsUrl} target="_blank" rel="noopener noreferrer" className="lesson-unified-card__btn lesson-unified-card__btn--ghost">
              فتح في Google Maps
            </a>
          )}
          {unified.siteUrl && (
            <a href={unified.siteUrl} target="_blank" rel="noopener noreferrer" className="lesson-unified-card__btn lesson-unified-card__btn--ghost">
              رابط الموقع
            </a>
          )}
          {!isDemoId(unified.id) && !unified.id.startsWith("kw-") && (
            <ContentActions contentType="lesson" contentId={unified.id} />
          )}
        </div>

        {unified.qrCodeUrl && (
          <div className="lesson-detail-qr">
            <img src={unified.qrCodeUrl} alt={`رمز QR للدرس: ${unified.title}`} title={unified.title} loading="lazy" decoding="async" />
          </div>
        )}
      </article>

      {seriesLessons.length > 0 && (
        <section className="lessons-similar-section" aria-labelledby="series-lessons-heading">
          <h2 id="series-lessons-heading">السلسلة المرتبطة</h2>
          <div className="page-card-grid lesson-unified-grid">
            {seriesLessons.map((item) => (
              <UnifiedLessonCard key={item.id} lesson={fromKuwaitLesson(item)} compact />
            ))}
          </div>
        </section>
      )}

      {sameSheikh.length > 0 && (
        <section className="lessons-similar-section" aria-labelledby="same-sheikh-heading">
          <h2 id="same-sheikh-heading">دروس الشيخ نفسه</h2>
          <div className="page-card-grid lesson-unified-grid">
            {sameSheikh.map((item) => (
              <UnifiedLessonCard key={item.id} lesson={fromKuwaitLesson(item)} compact />
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="lessons-similar-section" aria-labelledby="similar-lessons-heading">
          <h2 id="similar-lessons-heading">دروس مشابهة</h2>
          <div className="page-card-grid lesson-unified-grid">
            {similar.map((item) => (
              <UnifiedLessonCard key={item.id} lesson={fromKuwaitLesson(item)} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
