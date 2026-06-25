import { useState } from "react";
import { Link } from "wouter";
import {
  buildLessonCopyText,
  prominenceClass,
  type UnifiedLesson,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";

type Props = {
  lesson: UnifiedLesson;
  compact?: boolean;
  showRegister?: boolean;
  registered?: boolean;
  onToggleRegister?: () => void;
};

function MetaCell({ label, value }: { label: string; value?: string }) {
  const text = value ? cleanDisplayText(value) : "";
  if (!text) return null;
  return (
    <div className="lesson-unified-card__meta-cell">
      <span className="lesson-unified-card__meta-label">{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

export function UnifiedLessonCard({
  lesson,
  compact = false,
  showRegister,
  registered,
  onToggleRegister,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildLessonCopyText(lesson));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  };

  return (
    <article
      className={`lesson-unified-card${compact ? " lesson-unified-card--compact" : ""} ${prominenceClass(lesson.sortKey, lesson.archived)}`.trim()}
    >
      <header className="lesson-unified-card__header">
        <span className="lesson-unified-card__category">{lesson.category}</span>
        <span className="lesson-unified-card__status">{lesson.statusLabel}</span>
      </header>

      <div className="lesson-unified-card__body">
        <h3 className="lesson-unified-card__title">{lesson.title}</h3>
        {lesson.sheikhName && (
          <p className="lesson-unified-card__sheikh">{lesson.sheikhName}</p>
        )}

        <div className="lesson-unified-card__meta">
          <MetaCell label="اليوم" value={lesson.day} />
          <MetaCell label="الوقت" value={lesson.time} />
          <MetaCell label="المسجد" value={lesson.mosque} />
          <MetaCell label="المنطقة" value={lesson.region} />
        </div>

        {!compact && lesson.note && (
          <p className="lesson-unified-card__note">{lesson.note}</p>
        )}

        <div className="lesson-unified-card__actions">
          <Link href={lesson.detailsHref} className="lesson-unified-card__btn lesson-unified-card__btn--primary">
            عرض التفاصيل
          </Link>
          <button
            type="button"
            className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
            onClick={handleCopy}
          >
            {copied ? "تم النسخ" : "نسخ بيانات الدرس"}
          </button>
          {showRegister && onToggleRegister && (
            <button
              type="button"
              className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
              onClick={onToggleRegister}
            >
              {registered ? "إلغاء التسجيل" : "سجّل حضوري"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default UnifiedLessonCard;
