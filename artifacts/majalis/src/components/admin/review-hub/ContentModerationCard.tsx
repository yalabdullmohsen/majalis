/**
 * Flutter `TafsirContentReviewCard` — original (rose) vs proposed (sage).
 */
import { useState } from "react";
import {
  CONTENT_CATEGORY_LABELS,
  type ContentReviewItem,
} from "@/lib/admin-review-hub";

export type ContentModerationCardProps = {
  item: ContentReviewItem;
  selected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: (feedback: string) => void;
};

export function ContentModerationCard({
  item,
  selected,
  onToggleSelect,
  onApprove,
  onReject,
}: ContentModerationCardProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const locked = item.status === "approved" || item.status === "rejected";

  return (
    <article
      className={`rh-flutter-card rh-flutter-card--tafsir${selected ? " is-selected" : ""}`}
      data-status={item.status}
    >
      <header className="rh-flutter-card__head rh-flutter-card__head--tafsir">
        <label className="rh-card__check">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={locked}
            aria-label={`تحديد ${item.id}`}
          />
        </label>
        <p className="rh-flutter-card__user">{item.userName}</p>
        <span className="rh-flutter-card__muted">
          — {item.title || CONTENT_CATEGORY_LABELS[item.category]}
        </span>
      </header>

      <div className="rh-flutter-diff">
        <div className="rh-flutter-diff__orig">
          <p className="rh-flutter-diff__label">النص الأصلي</p>
          <p>{item.originalText || "— (مشاركة جديدة بلا أصل)"}</p>
        </div>
        <div className="rh-flutter-diff__prop">
          <p className="rh-flutter-diff__label">التعديل المقترح</p>
          <p>{item.editedText}</p>
        </div>
      </div>

      {item.notes ? (
        <p className="rh-flutter-card__flag rh-flutter-card__flag--muted">
          {item.notes}
        </p>
      ) : null}

      {!locked ? (
        <footer className="rh-flutter-card__actions">
          <button
            type="button"
            className="rh-btn rh-btn--outline"
            onClick={() => setFeedbackOpen((v) => !v)}
          >
            رفض التعديل
          </button>
          <button type="button" className="rh-btn rh-btn--brown" onClick={onApprove}>
            نشر وتعديل في المكتبة
          </button>
        </footer>
      ) : null}

      {feedbackOpen ? (
        <div className="rh-card__panel">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="سبب الرفض…"
            aria-label="ملاحظة الرفض"
          />
          <button
            type="button"
            className="rh-btn rh-btn--rose"
            onClick={() => {
              onReject(feedback);
              setFeedbackOpen(false);
            }}
          >
            تأكيد الرفض
          </button>
        </div>
      ) : null}

      {item.feedback && item.status === "rejected" ? (
        <p className="rh-card__feedback">ملاحظة الرفض: {item.feedback}</p>
      ) : null}
    </article>
  );
}

export default ContentModerationCard;
