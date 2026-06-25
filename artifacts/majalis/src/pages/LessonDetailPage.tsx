import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getLessonById } from "@/lib/supabase";
import { Loading, Empty } from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";
import { isDemoId } from "@/lib/demo-content";
import { extractLessonSchedule, hasValue } from "@/lib/lesson-display";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import {
  buildLessonCopyText,
  buildLessonShareUrl,
  downloadUnifiedCalendar,
  fromDbLesson,
  fromKuwaitLesson,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import {
  getKuwaitLessonById,
  loadAllKuwaitLessonsSplit,
} from "@/lib/lessons-service";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { cleanTimeText } from "@/lib/lesson-time";

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

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  const [lesson, setLesson] = useState<any>(null);
  const [kuwaitLesson, setKuwaitLesson] = useState<KuwaitLessonRecord | null>(null);
  const [similar, setSimilar] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getKuwaitLessonById(params.id)
      .then((staticLesson) => {
        if (staticLesson) {
          setKuwaitLesson(staticLesson);
          setLesson(null);
          return loadAllKuwaitLessonsSplit().then(({ active }) => {
            const related = active
              .filter(
                (l) =>
                  l.id !== staticLesson.id &&
                  (l.category === staticLesson.category ||
                    l.sheikhName === staticLesson.sheikhName ||
                    l.region === staticLesson.region),
              )
              .slice(0, 3);
            setSimilar(related);
          });
        }

        return getLessonById(params.id).then(({ lesson: dbLesson }) => {
          setLesson(dbLesson);
          setKuwaitLesson(null);
          if (!dbLesson) return undefined;
          return loadAllKuwaitLessonsSplit().then(({ active }) => {
            const related = active
              .filter(
                (l) =>
                  l.id !== params.id &&
                  (l.category === dbLesson.category || l.region === dbLesson.region),
              )
              .slice(0, 3);
            setSimilar(related);
          });
        });
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const unified = useMemo(() => {
    if (kuwaitLesson) return fromKuwaitLesson(kuwaitLesson);
    if (lesson) return fromDbLesson(lesson);
    return null;
  }, [kuwaitLesson, lesson]);

  if (loading) return <Loading />;
  if (!unified) return <Empty text="لم يُعثر على الدرس." />;

  const sheikhName = unified.sheikhName;
  const { day, time, dateLabel } = lesson ? extractLessonSchedule(lesson) : { day: unified.day, time: unified.time, dateLabel: unified.gregorianDate };
  const mapsEmbed = buildMapsEmbed(unified.mapsUrl, unified.mosque, unified.region);

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

  return (
    <div className="page-shell narrow lesson-detail-page">
      <Link href="/lessons" className="lesson-detail-back">
        ← العودة إلى الدروس
      </Link>

      <article className="ui-card lesson-detail-card">
        <div className="lesson-detail-hero">
          <SheikhAvatar
            src={kuwaitLesson?.sheikhImage || resolveLessonSheikhImage(lesson)}
            name={sheikhName || "شيخ"}
            size={120}
          />
          <div className="lesson-detail-hero__copy">
            {hasValue(sheikhName) && (
              <p className="lesson-card-pro__sheikh">{sheikhName}</p>
            )}
            <h1 className="lesson-detail-title">{unified.title}</h1>
            <div className="lesson-detail-tags">
              {hasValue(unified.category) && <span className="page-tag">{unified.category}</span>}
              {unified.activityType && <span className="page-soft-tag">{unified.activityType}</span>}
              {unified.hasLiveStream && <span className="page-soft-tag">بث مباشر</span>}
              {unified.hasRecording && <span className="page-soft-tag">تسجيل</span>}
            </div>
            {unified.note && (
              <p className="lesson-detail-summary">{cleanDisplayText(unified.note)}</p>
            )}
          </div>
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
          {hasValue(unified.mosque) && (
            <div><dt>المسجد</dt><dd>{unified.mosque}</dd></div>
          )}
          {hasValue(unified.region) && (
            <div><dt>المنطقة</dt><dd>{unified.region}</dd></div>
          )}
          {hasValue(unified.governorate) && (
            <div><dt>المحافظة</dt><dd>{unified.governorate}</dd></div>
          )}
          {unified.sessionCount != null && unified.sessionCount > 0 && (
            <div><dt>عدد اللقاءات</dt><dd>{unified.sessionCount}</dd></div>
          )}
        </dl>

        {hasValue(unified.description) && (
          <div className="lesson-detail-body">
            <h2>عن الدرس</h2>
            <p>{cleanDisplayText(unified.description)}</p>
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
              رابط البث
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
            <img src={unified.qrCodeUrl} alt="QR Code" loading="lazy" decoding="async" />
          </div>
        )}
      </article>

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
