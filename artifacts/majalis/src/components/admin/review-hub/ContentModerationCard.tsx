/**
 * B. Content & Tafsir moderation card with inline diff.
 */
import { useState } from "react";
import {
  CONTENT_CATEGORY_LABELS,
  type ContentReviewItem,
} from "@/lib/admin-review-hub";
import { DiffViewer } from "./DiffViewer";

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
      className={`rh-card rh-card--content${selected ? " is-selected" : ""}`}
      data-status={item.status}
    >
      <header className="rh-card__head">
        <label className="rh-card__check">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={locked}
            aria-label={`تحديد ${item.id}`}
          />
        </label>
        <div className="rh-card__meta">
          <h3 className="rh-card__title">{item.title}</h3>
          <p className="rh-card__sub">
            {item.userName} · {item.userId} ·{" "}
            {CONTENT_CATEGORY_LABELS[item.category]}
          </p>
        </div>
        <div className="rh-card__badges">
          {item.priority === "high" ? (
            <span className="rh-badge rh-badge--gold">أولوية</span>
          ) : null}
          {item.flaggedByAi ? (
            <span className="rh-badge rh-badge--rose">AI</span>
          ) : null}
          <span className={`rh-badge rh-badge--status-${item.status}`}>
            {item.status}
          </span>
        </div>
      </header>

      <DiffViewer original={item.originalText} edited={item.editedText} />

      {item.notes ? <p className="rh-card__notes">{item.notes}</p> : null}

      {!locked ? (
        <footer className="rh-card__actions">
          <button type="button" className="rh-btn rh-btn--sage" onClick={onApprove}>
            اعتماد المحتوى
          </button>
          <button
            type="button"
            className="rh-btn rh-btn--rose"
            onClick={() => setFeedbackOpen((v) => !v)}
          >
            رفض مع ملاحظة
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
