import { useRef, useState } from "react";
import { Link } from "wouter";
import html2canvas from "html2canvas";
import type { CurrentLesson } from "@/lib/current-lessons";
import { downloadCalendar, sheikhAvatarUrl } from "@/lib/current-lessons";

type Props = {
  lesson: CurrentLesson;
  compact?: boolean;
  showDetailsLink?: boolean;
};

export function CurrentLessonCard({ lesson, compact = false, showDetailsLink = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const avatar = sheikhAvatarUrl(lesson.sheikhName, lesson.sheikhImage);

  const downloadAd = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `إعلان-${lesson.title}.png`;
      link.href = canvas.toDataURL("image/png", 1);
      link.click();
    } catch (err) {
      console.error("[majalis:lesson-ad]", err);
      alert("تعذر تحميل الإعلان.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className={compact ? "cl-card cl-card--compact" : "cl-card"}>
      <div ref={cardRef} className="cl-poster">
        <div className="cl-poster__ribbon">إعلان درس علمي</div>
        <div className="cl-poster__head">
          <img src={avatar} alt={lesson.sheikhName} className="cl-poster__avatar" />
          <div>
            <p className="cl-poster__sheikh">{lesson.sheikhName}</p>
            <h3 className="cl-poster__title">{lesson.title}</h3>
            {lesson.category && <span className="cl-poster__tag">{lesson.category}</span>}
          </div>
        </div>

        <p className="cl-poster__desc">{lesson.description}</p>

        <div className="cl-poster__schedule">
          <div className="cl-poster__day">
            <span>اليوم</span>
            <strong>{lesson.day}</strong>
          </div>
          <div className="cl-poster__time">
            <span>الوقت</span>
            <strong>{lesson.time}</strong>
          </div>
        </div>

        <div className="cl-poster__location">
          <p><strong>{lesson.mosque}</strong></p>
          <p>{lesson.region}</p>
          <p className="cl-poster__dates">
            من {lesson.startDate} إلى {lesson.endDate}
          </p>
        </div>

        {lesson.weeklySchedule.length > 0 && (
          <div className="cl-poster__weekly">
            <span>الجدول الأسبوعي:</span>
            {lesson.weeklySchedule.map((s) => (
              <span key={`${s.day}-${s.time}`} className="cl-poster__slot">
                {s.day} — {s.time}
              </span>
            ))}
          </div>
        )}

        {(lesson.mosqueMapQrUrl || lesson.bookQrUrl) && (
          <div className="cl-poster__qr-row">
            {lesson.mosqueMapQrUrl && (
              <div className="cl-poster__qr">
                <img src={lesson.mosqueMapQrUrl} alt="باركود موقع المسجد" />
                <span>موقع المسجد</span>
              </div>
            )}
            {lesson.bookQrUrl && (
              <div className="cl-poster__qr">
                <img src={lesson.bookQrUrl} alt="باركود الكتاب" />
                <span>الكتاب</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cl-actions">
        {showDetailsLink && (
          <Link href={`/courses#${lesson.courseId}`} className="cl-btn cl-btn--primary">
            عرض التفاصيل
          </Link>
        )}
        <button type="button" className="cl-btn cl-btn--secondary" onClick={() => downloadCalendar(lesson)}>
          إضافة إلى التقويم
        </button>
        {lesson.mapsUrl && (
          <a href={lesson.mapsUrl} target="_blank" rel="noopener noreferrer" className="cl-btn cl-btn--ghost">
            فتح الموقع على الخريطة
          </a>
        )}
        {lesson.streamUrl && (
          <a href={lesson.streamUrl} target="_blank" rel="noopener noreferrer" className="cl-btn cl-btn--ghost">
            رابط البث
          </a>
        )}
        {lesson.bookUrl && (
          <a href={lesson.bookUrl} target="_blank" rel="noopener noreferrer" className="cl-btn cl-btn--ghost">
            رابط الكتاب
          </a>
        )}
        <button type="button" className="cl-btn cl-btn--download" onClick={downloadAd} disabled={downloading}>
          {downloading ? "جارٍ التحميل..." : "تحميل الإعلان"}
        </button>
      </div>
    </article>
  );
}
