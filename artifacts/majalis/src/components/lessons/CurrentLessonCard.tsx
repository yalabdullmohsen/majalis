import { useRef, useState } from "react";
import { Link } from "wouter";
import * as htmlToImage from "html-to-image";
import type { AnnouncementTemplate, CurrentLesson } from "@/lib/current-lessons";
import {
  downloadCalendar,
  formatPeriod,
  formatWeeklySchedule,
  resolveBookQr,
  resolveMosqueQr,
  resolveSheikhImage,
  shareAnnouncement,
} from "@/lib/current-lessons";
import { SheikhAvatar } from "./SheikhAvatar";

type Props = {
  lesson: CurrentLesson;
  compact?: boolean;
  showDetailsLink?: boolean;
};

function CornerOrnaments() {
  return (
    <>
      <span className="la-corner la-corner--tl" aria-hidden="true" />
      <span className="la-corner la-corner--tr" aria-hidden="true" />
      <span className="la-corner la-corner--bl" aria-hidden="true" />
      <span className="la-corner la-corner--br" aria-hidden="true" />
    </>
  );
}

function CurriculumBlock({ items }: { items: string[] }) {
  return (
    <div className="la-poster__curriculum">
      <p className="la-poster__label">محتوى الدورة</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function WeeklyBlock({ lesson }: { lesson: CurrentLesson }) {
  if (lesson.template === "weekly-schedule" || lesson.weeklySchedule.length > 0) {
    return (
      <div className="la-poster__weekly">
        <span className="la-poster__label">الجدول الأسبوعي</span>
        <p className="la-poster__weekly-text">{formatWeeklySchedule(lesson.weeklySchedule)}</p>
      </div>
    );
  }
  return null;
}

function QrBlock({ lesson }: { lesson: CurrentLesson }) {
  const mosqueQr = resolveMosqueQr(lesson);
  const bookQr = resolveBookQr(lesson);
  const liveQr = lesson.live_qr_url;

  if (!mosqueQr && !bookQr && !liveQr) return null;

  return (
    <div className="la-poster__qr-row">
      {mosqueQr && (
        <div className="la-poster__qr">
          <img src={mosqueQr} alt="موقع المسجد" />
          <span>موقع المسجد</span>
        </div>
      )}
      {bookQr && (
        <div className="la-poster__qr">
          <img src={bookQr} alt="رابط الكتاب" />
          <span>رابط الكتاب</span>
        </div>
      )}
      {liveQr && (
        <div className="la-poster__qr">
          <img src={liveQr} alt="البث المباشر" />
          <span>البث المباشر</span>
        </div>
      )}
    </div>
  );
}

function templateClass(template: AnnouncementTemplate) {
  return `la-poster la-poster--${template}`;
}

export function CurrentLessonCard({ lesson, compact = false, showDetailsLink = true }: Props) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const sheikhImage = resolveSheikhImage(lesson);

  const downloadAd = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#FAF5EA",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `إعلان-${lesson.title}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[majalis:announcement-export]", err);
      alert("تعذر تحميل الإعلان. حاول مجددًا.");
    } finally {
      setDownloading(false);
    }
  };

  const onShare = async () => {
    setSharing(true);
    try {
      await shareAnnouncement(lesson);
    } finally {
      setSharing(false);
    }
  };

  const detailsHref = lesson.courseId
    ? `/lessons?tab=courses#${lesson.courseId}`
    : "/lessons";

  return (
    <article className={compact ? "la-card la-card--compact" : "la-card"}>
      <div ref={posterRef} className={templateClass(lesson.template)}>
        <CornerOrnaments />

        <div className="la-poster__ribbon">{lesson.announcementType}</div>

        <div className="la-poster__hero">
          <div className="la-poster__avatar-col">
            <SheikhAvatar name={lesson.sheikhName} src={sheikhImage} size={compact ? 80 : 100} />
            <p className="la-poster__sheikh">الشيخ: {lesson.sheikhName}</p>
          </div>

          <div className="la-poster__body">
            <h3 className="la-poster__title">{lesson.title}</h3>
            <p className="la-poster__desc">{lesson.description}</p>
          </div>
        </div>

        <div className="la-poster__info-grid">
          <div className="la-poster__info-cell">
            <span className="la-poster__label">اليوم</span>
            <strong>{lesson.day}</strong>
          </div>
          <div className="la-poster__info-cell">
            <span className="la-poster__label">الوقت</span>
            <strong>{lesson.time}</strong>
          </div>
        </div>

        <div className="la-poster__place">
          <span className="la-poster__label">المكان</span>
          <p className="la-poster__mosque">{lesson.mosque}</p>
          <p className="la-poster__region">{lesson.region}</p>
        </div>

        <p className="la-poster__period">{formatPeriod(lesson)}</p>

        <WeeklyBlock lesson={lesson} />

        {lesson.template === "course" && lesson.curriculum && lesson.curriculum.length > 0 && (
          <CurriculumBlock items={lesson.curriculum} />
        )}

        {lesson.template === "single-lecture" && lesson.lectures?.[0] && (
          <div className="la-poster__lecture">
            <span className="la-poster__label">المحاضرة</span>
            <p>{lesson.lectures[0].title}</p>
          </div>
        )}

        <QrBlock lesson={lesson} />
      </div>

      <div className="la-actions">
        {showDetailsLink && (
          <Link href={detailsHref} className="la-btn la-btn--primary">
            عرض التفاصيل
          </Link>
        )}
        <button type="button" className="la-btn la-btn--gold" onClick={downloadAd} disabled={downloading}>
          {downloading ? "جارٍ التحميل…" : "تحميل الإعلان"}
        </button>
        <button type="button" className="la-btn la-btn--secondary" onClick={onShare} disabled={sharing}>
          {sharing ? "جارٍ المشاركة…" : "مشاركة"}
        </button>
        <button type="button" className="la-btn la-btn--secondary" onClick={() => downloadCalendar(lesson)}>
          إضافة إلى التقويم
        </button>
        {lesson.mapsUrl && (
          <a
            href={lesson.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="la-btn la-btn--ghost"
          >
            فتح الموقع على الخريطة
          </a>
        )}
      </div>
    </article>
  );
}
