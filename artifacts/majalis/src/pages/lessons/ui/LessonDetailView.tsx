import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { AdminInlineEdit } from "@/components/AdminInlineEdit";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { SkeletonPage } from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";
import { ContentReportButton } from "@/components/ContentReportButton";
import { isDemoId } from "@/lib/demo-id";
import { extractLessonSchedule, hasValue } from "@/lib/lesson-display";
import { FavoriteButton } from "@/components/FavoriteButton";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import {
  downloadUnifiedCalendar,
  fromDbLesson,
  fromKuwaitLesson,
  openLessonExternalUrl,
  parseLessonShareTimestamp,
} from "@/lib/unified-lesson-card";
import { ShareButtons } from "@/components/ContentActions";
import { LessonRecordingPlayer } from "@/components/lessons/LessonRecordingPlayer";
import { DetailScreen } from "@/components/design-system/screens";
import { cleanDisplayText } from "@/lib/display-text";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { formatShortLessonTime } from "@/lib/lesson-time";
import { useLessonSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import type { LessonEngagementStats } from "@/lib/lesson-stats";
import { normalizeActivityLabel } from "@/lib/activity-label";
import { stripSheikhHonorifics } from "@/lib/sheikh-name";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { KnowledgeRelatedItems } from "@/components/knowledge/KnowledgeRelatedItems";
import { ScholarFollowButton } from "@/components/ScholarFollowButton";
import { RecommendationWidget } from "@/components/recommendations/RecommendationWidget";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { canonicalizeLessonPublicId, isOrphanKuwaitLessonHashId } from "@/lib/lesson-id-aliases";
import { getLessonsModule, type LessonDbRow } from "@/features/lessons";
import { applyPageSeo } from "@/lib/seo";
import { getLessonDeliveryMode } from "@/lib/lessons/lessonNormalize";
import "@/styles/pages/not-found.css";

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

function buildAutoDescription(u: {
  sheikhName?: string | null;
  category?: string | null;
  activityType?: string | null;
  day?: string | null;
  time?: string | null;
  mosque?: string | null;
  region?: string | null;
  governorate?: string | null;
  hasLiveStream?: boolean;
  hasRecording?: boolean;
  sessionCount?: number | null;
}): string {
  const activity = normalizeActivityLabel(u.activityType) || "درس";
  const categoryPart = u.category ? ` في ${u.category}` : "";
  const sheikhPart = u.sheikhName ? ` يُلقيه ${u.sheikhName}` : "";

  const locationParts: string[] = [];
  if (u.mosque) locationParts.push(u.mosque);
  if (u.region) locationParts.push(u.region);
  if (u.governorate) locationParts.push(u.governorate);

  let schedule = "";
  if (u.day && locationParts.length > 0) {
    schedule = ` كل ${u.day} في ${locationParts.join("، ")}`;
  } else if (u.day) {
    schedule = ` كل ${u.day}`;
  } else if (locationParts.length > 0) {
    schedule = ` في ${locationParts.join("، ")}`;
  }

  const extras: string[] = [];
  if (u.hasLiveStream) extras.push("متاح بث مباشر");
  if (u.hasRecording) extras.push("يوجد تسجيل");
  if (u.sessionCount && u.sessionCount > 1) extras.push(`${u.sessionCount} لقاء`);

  const extraPart = extras.length > 0 ? ` (${extras.join(" | ")})` : "";

  return `${activity}${categoryPart}${sheikhPart}${schedule}${extraPart}.`;
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="lesson-detail-stat">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString("ar") : value}</strong>
    </div>
  );
}

function LessonUnavailable({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    applyPageSeo({
      path: `/lessons/${lessonId}`,
      title: "الدرس غير متاح | سُنّة",
      description: "هذا الدرس غير متاح أو نُقل. تصفّح فهرس الدروس أو ابحث عن درس مشابه.",
      keywords: ["درس", "غير متاح"],
      robots: "noindex, follow",
    });
  }, [lessonId]);

  return (
    <div className="nf2-page" dir="rtl" lang="ar">
      <section className="nf2-card">
        <p className="nf2-code" aria-hidden="true">—</p>
        <h1 className="nf2-title">الدرس غير متاح</h1>
        <p className="nf2-desc">
          الرابط قديم أو الدرس نُقل. يمكنك فتح فهرس الدروس، دروس الكويت، أو البحث عن عنوان مشابه.
        </p>
        <div className="nf2-actions">
          <Link href="/lessons" className="nf2-btn nf2-btn--primary">فهرس الدروس</Link>
          <Link href="/kuwait-lessons" className="nf2-btn nf2-btn--outline">دروس الكويت</Link>
          <Link href="/search" className="nf2-btn nf2-btn--outline">البحث</Link>
        </div>
      </section>
    </div>
  );
}

export default function LessonDetailPage({
  params,
  initialLesson,
}: {
  params: { id: string };
  initialLesson?: KuwaitLessonRecord | null;
}) {
  const [, setLocation] = useLocation();
  const urlSearch = useSearch();
  const [lesson, setLesson] = useState<LessonDbRow | null>(null);

  // أسماء بديلة تاريخية (kuwait-lessons-HASH) → المعرّف الكانوني kw-*
  useEffect(() => {
    if (!params.id) return;
    const canonical = canonicalizeLessonPublicId(params.id);
    if (canonical && canonical !== params.id) {
      setLocation(`/lessons/${canonical}`, { replace: true });
    }
  }, [params.id, setLocation]);

  // كانت هنا فعليًا ثلاث آليات SEO متنافسة على نفس الصفحة: (1) placeholder
  // عام بعنوان/مسار خاطئين تمامًا (`path: "/lessons"` — صفحة الفهرس لا
  // صفحة الدرس نفسها) يُطبَّق فوراً بلا انتظار البيانات، (2) نسخة تعمل فقط
  // مع مصدر `kuwaitLesson` (لا تعمل إطلاقاً للدروس القادمة من `getLessonById`
  // مباشرة عبر DB fallback) بمخطط JSON-LD "Event" مكرَّر، (3) الخُطّاف
  // الصحيح `useLessonSeo(seoLesson, ...)` أدناه (يغطي كلا المصدرين، ينتظر
  // `loading`، ويبني `lessonJsonLd` الأشمل عبر `lessonSeoMeta`). أُزيلت (1)
  // و(2) — كانتا تُنتجان "ومضة" عنوان/JSON-LD خاطئ عند كل تحميل صفحة قبل أن
  // يُصحِّحهما (3)، وتُبقيان العنوان خاطئاً بلا تصحيح أبداً لأي درس مصدره
  // DB مباشرة لا `kuwaitLesson` الثابت.
  const [kuwaitLesson, setKuwaitLesson] = useState<KuwaitLessonRecord | null>(initialLesson ?? null);
  const [similar, setSimilar] = useState<KuwaitLessonRecord[]>([]);
  const [sameSheikh, setSameSheikh] = useState<KuwaitLessonRecord[]>([]);
  const [seriesLessons, setSeriesLessons] = useState<KuwaitLessonRecord[]>([]);
  const [sheikhBio, setSheikhBio] = useState<string>("");
  const [stats, setStats] = useState<LessonEngagementStats>({ views: 0, saves: 0, shares: 0 });
  const [loading, setLoading] = useState(!initialLesson);

  useEffect(() => {
    let cancelled = false;
    setLoading(!initialLesson);

    getLessonsModule()
      .loadLessonDetail(params.id, initialLesson)
      .then((result) => {
        if (cancelled) return;
        setKuwaitLesson(result.kuwaitLesson);
        setLesson(result.dbLesson);
        setSimilar(result.similar);
        setSameSheikh(result.sameSheikh);
        setSeriesLessons(result.seriesLessons);
        setStats(result.stats);
        setSheikhBio(result.sheikhBio);
      })
      .catch(() => {
        if (cancelled) return;
        setSimilar([]);
        setSameSheikh([]);
        setSeriesLessons([]);
        setSheikhBio("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id, initialLesson]);

  const unified = useMemo(() => {
    if (kuwaitLesson) return fromKuwaitLesson(kuwaitLesson);
    if (lesson) return fromDbLesson(lesson);
    return null;
  }, [kuwaitLesson, lesson]);

  const shareStartSeconds = useMemo(
    () => parseLessonShareTimestamp(urlSearch),
    [urlSearch],
  );

  const recordingSrc =
    unified?.recordingUrl ||
    kuwaitLesson?.recordingUrl ||
    lesson?.audio_url ||
    lesson?.video_url ||
    lesson?.recording_url ||
    null;

  // بصمات kuwait-lessons يتيمة بلا alias — أعد التوجيه لفهرس الدروس بدل صفحة خطأ مفهرسة.
  useEffect(() => {
    if (!params.id || loading || unified) return;
    if (isOrphanKuwaitLessonHashId(params.id)) {
      setLocation("/lessons", { replace: true });
    }
  }, [params.id, loading, unified, setLocation]);

  const seoLesson = useMemo((): KuwaitLessonRecord | null => {
    if (kuwaitLesson) return kuwaitLesson;
    if (!lesson || !unified) return null;
    return {
      id: unified.id,
      title: unified.title,
      sheikhName: unified.sheikhName,
      governorate: unified.governorate || "",
      region: unified.region || "",
      mosque: unified.mosque || "",
      day: unified.day || "",
      time: unified.time || "",
      category: unified.category || "أخرى",
      note: unified.note,
      description: unified.description,
      keywords: Array.isArray(lesson.keywords) ? lesson.keywords : undefined,
      gregorianDate: unified.gregorianDate,
      hijriDate: unified.hijriDate,
      activityType: normalizeActivityLabel(unified.activityType) as KuwaitLessonRecord["activityType"],
      sessionCount: unified.sessionCount,
      hasLiveStream: unified.hasLiveStream,
      hasRecording: unified.hasRecording,
      sortKey: unified.sortKey,
      nextOccurrenceMs: unified.nextOccurrenceMs,
      isCourse: unified.activityType === "دورة",
    };
  }, [kuwaitLesson, lesson, unified]);

  useLessonSeo(seoLesson, `/lessons/${params.id}`, loading);
  usePageView("lesson", params.id);

  if (loading) return <SkeletonPage />;
  if (!unified) return <LessonUnavailable lessonId={params.id} />;

  const sheikhName = unified.sheikhName;
  const { day, time, dateLabel } = lesson ? extractLessonSchedule(lesson) : { day: unified.day, time: unified.time, dateLabel: unified.gregorianDate };
  const mapsEmbed = buildMapsEmbed(unified.mapsUrl, unified.mosque, unified.region);
  const activityLabel = normalizeActivityLabel(unified.activityType) || "درس";
  const deliveryLabel = getLessonDeliveryMode(unified);
  const keywords = unified.keywords || [];
  const level = inferLessonLevel(unified.category);

  return (
    <DetailScreen compose="mark">
    <div className="page-shell narrow lesson-detail-page mj-page">
      <ReadingProgressBar />
      <nav className="lesson-detail-breadcrumb" aria-label="مسار التصفح">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/lessons">الدروس</Link>
        <span aria-hidden="true"> / </span>
        <span>{unified.title}</span>
      </nav>

      <SectionErrorBoundary name="تفاصيل الدرس">
      <article className="ui-card lesson-detail-card mj-card lesson-detail-card--compact">
        <header className="lesson-detail-head">
          <h1 className="lesson-detail-title">{unified.title}</h1>
          {hasValue(sheikhName) && (
            <div className="lesson-detail-sheikh-row">
              <p className="lesson-detail-sheikh">
                المحاضر: {stripSheikhHonorifics(sheikhName) || sheikhName}
              </p>
              {lesson?.sheikhs?.id && (
                <ScholarFollowButton sheikhId={lesson.sheikhs.id} compact />
              )}
            </div>
          )}
          {hasValue(kuwaitLesson?.organizerName) &&
            stripSheikhHonorifics(kuwaitLesson?.organizerName || "") !==
              stripSheikhHonorifics(sheikhName || "") && (
            <p className="lesson-detail-organizer">تنظيم: {kuwaitLesson?.organizerName}</p>
          )}
          <div className="lesson-detail-tags" aria-label="تصنيف الدرس">
            <span className="page-soft-tag">{activityLabel}</span>
            {hasValue(unified.category) && <span className="page-tag">{unified.category}</span>}
            {deliveryLabel && <span className="page-soft-tag">{deliveryLabel}</span>}
            <span className="page-soft-tag">المستوى: {level}</span>
            {unified.hasLiveStream && <span className="page-soft-tag">بث مباشر</span>}
            {unified.hasRecording && <span className="page-soft-tag">تسجيل</span>}
          </div>
        </header>

        {recordingSrc && (
          <div className="lesson-detail-body lesson-detail-body--tight">
            <LessonRecordingPlayer
              lesson={unified}
              src={recordingSrc}
              startAtSeconds={shareStartSeconds}
            />
          </div>
        )}

        <dl className="lesson-detail-info-grid" aria-label="معلومات الدرس">
          {hasValue(day) && (
            <div><dt>اليوم</dt><dd>{day}</dd></div>
          )}
          {hasValue(unified.gregorianDate || dateLabel) && (
            <div><dt>التاريخ</dt><dd>{unified.gregorianDate || dateLabel}</dd></div>
          )}
          {hasValue(time || unified.time) && (
            <div><dt>الوقت</dt><dd>{formatShortLessonTime(time || unified.time)}</dd></div>
          )}
          {hasValue(unified.mosque) && (
            <div><dt>المكان</dt><dd>{unified.mosque}</dd></div>
          )}
          {hasValue(unified.region) && (
            <div><dt>المنطقة</dt><dd>{unified.region}</dd></div>
          )}
          {hasValue(unified.governorate) && (
            <div><dt>المحافظة</dt><dd>{unified.governorate}</dd></div>
          )}
          {deliveryLabel && (
            <div><dt>الحضور</dt><dd>{deliveryLabel}</dd></div>
          )}
          {hasValue(unified.hijriDate) && (
            <div><dt>الهجري</dt><dd>{unified.hijriDate}</dd></div>
          )}
          {unified.sessionCount != null && unified.sessionCount > 0 && (
            <div><dt>اللقاءات</dt><dd>{unified.sessionCount.toLocaleString("ar")}</dd></div>
          )}
        </dl>

        <div className="lesson-detail-actions lesson-detail-actions--row lesson-detail-actions-panel">
          <div className="lesson-detail-actions__primary">
            <FavoriteButton contentType="lesson" contentId={unified.id} />
            <button
              type="button"
              className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
              onClick={() => downloadUnifiedCalendar(unified)}
            >
              إضافة للتقويم
            </button>
            <AdminInlineEdit
              contentType="lesson"
              contentId={unified.id}
              initialData={{
                title: unified.title,
                category: unified.category,
                mosque: unified.mosque,
                region: unified.region,
                day_of_week: unified.day,
                lesson_time: unified.time,
                description: unified.description,
              }}
            />
          </div>
          <div className="lesson-detail-actions__links">
            {unified.streamUrl && (
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                onClick={() => openLessonExternalUrl(unified.streamUrl!)}
              >
                رابط البث
              </button>
            )}
            {unified.mapsUrl && (
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                onClick={() => openLessonExternalUrl(unified.mapsUrl!)}
              >
                الاتجاه للمسجد
              </button>
            )}
            {unified.siteUrl && (
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                onClick={() => openLessonExternalUrl(unified.siteUrl!)}
              >
                رابط الموقع
              </button>
            )}
          </div>
          {!isDemoId(unified.id) && !unified.id.startsWith("kw-") && (
            <ContentActions contentType="lesson" contentId={unified.id} />
          )}
        </div>

        {(unified.note || unified.description) && (
          <div className="lesson-detail-body lesson-detail-body--tight">
            <h2>عن الدرس</h2>
            <p>{cleanDisplayText(unified.note || unified.description || buildAutoDescription(unified))}</p>
          </div>
        )}

        {sheikhBio && (
          <div className="lesson-detail-body lesson-detail-body--tight">
            <h2>نبذة المحاضر</h2>
            <p>{cleanDisplayText(sheikhBio)}</p>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="lesson-detail-body lesson-detail-body--tight">
            <h2>الكلمات المفتاحية</h2>
            <div className="lesson-detail-tags">
              {keywords.map((kw) => (
                <span key={kw} className="page-soft-tag">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {unified.linkedLessons && unified.linkedLessons.length > 0 && (
          <div className="lesson-detail-body lesson-detail-body--tight">
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

        <div className="lesson-detail-stats-row" aria-label="إحصاءات">
          <StatPill label="المشاهدات" value={stats.views} />
          <StatPill label="الحفظ" value={stats.saves} />
        </div>

        <ShareButtons title={unified.title} />

        <footer className="lesson-detail-report">
          <ContentReportButton contentType="درس" contentId={unified.id} title={unified.title} />
        </footer>
      </article>
      </SectionErrorBoundary>

      {seriesLessons.length > 0 && (
        <SectionErrorBoundary name="السلسلة المرتبطة">
          <section className="lessons-similar-section" aria-labelledby="series-lessons-heading">
            <h2 id="series-lessons-heading">السلسلة المرتبطة</h2>
            <div className="page-card-grid lesson-unified-grid">
              {seriesLessons.map((item) => (
                <UnifiedLessonCard key={item.id} lesson={fromKuwaitLesson(item)} compact />
              ))}
            </div>
          </section>
        </SectionErrorBoundary>
      )}

      {sameSheikh.length > 0 && (
        <SectionErrorBoundary name="دروس الشيخ">
          <section className="lessons-similar-section" aria-labelledby="same-sheikh-heading">
            <h2 id="same-sheikh-heading">دروس الشيخ نفسه</h2>
            <div className="page-card-grid lesson-unified-grid">
              {sameSheikh.map((item) => (
                <UnifiedLessonCard key={item.id} lesson={fromKuwaitLesson(item)} compact />
              ))}
            </div>
          </section>
        </SectionErrorBoundary>
      )}

      {similar.length > 0 && (
        <SectionErrorBoundary name="دروس مشابهة">
          <section className="lessons-similar-section" aria-labelledby="similar-lessons-heading">
            <h2 id="similar-lessons-heading">دروس مشابهة</h2>
            <div className="page-card-grid lesson-unified-grid">
              {similar.map((item) => (
                <UnifiedLessonCard key={item.id} lesson={fromKuwaitLesson(item)} compact />
              ))}
            </div>
          </section>
        </SectionErrorBoundary>
      )}
      {lesson?.id && (
        <SectionErrorBoundary name="الرسم البياني المعرفي">
          <KnowledgeRelatedItems sourceType="lesson" sourceId={String(lesson.id)} />
        </SectionErrorBoundary>
      )}
      {lesson?.id && (
        <SectionErrorBoundary name="محتوى ذو صلة">
          <RecommendationWidget
            useRelated
            contentId={String(lesson.id)}
            contentType="lesson"
            context="lesson"
            limit={6}
            layout="row"
            className="mt-8"
          />
        </SectionErrorBoundary>
      )}
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz route="/lessons" title="اختبر معلوماتك في العلوم الشرعية" count={4} />
      </div>
    </div>
    </DetailScreen>
  );
}
