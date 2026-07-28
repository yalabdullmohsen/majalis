/**
 * Flutter `AudioRecitationReviewCard` — web port with live audio + decisions.
 */
import { useState } from "react";
import type { RecitationReviewItem } from "@/lib/admin-review-hub";
import { LinearAudioReviewPlayer } from "./LinearAudioReviewPlayer";

export type RecitationReviewCardProps = {
  item: RecitationReviewItem;
  selected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  onOverrideScore: (score: number) => void;
};

export function RecitationReviewCard({
  item,
  selected,
  onToggleSelect,
  onApprove,
  onReject,
  onOverrideScore,
}: RecitationReviewCardProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideVal, setOverrideVal] = useState(
    String(item.overriddenScore ?? item.aiScore),
  );

  const displayScore = item.overriddenScore ?? item.aiScore;
  const locked = item.status === "approved" || item.status === "rejected";
  const flagReason = item.notes || item.feedback;

  return (
    <article
      className={`rh-flutter-card rh-flutter-card--audio${selected ? " is-selected" : ""}`}
      data-status={item.status}
    >
      <header className="rh-flutter-card__head">
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
        <span className="rh-flutter-card__verse-badge">{item.verseRef}</span>
        <span className="rh-flutter-card__ai">
          تقييم الذكاء الاصطناعي: {displayScore}%
        </span>
      </header>

      <div className="rh-flutter-card__quran">
        <p>{item.expectedText}</p>
      </div>

      <LinearAudioReviewPlayer src={item.audioUrl} />

      {flagReason ? (
        <p className="rh-flutter-card__flag">تنبيه النظام: {flagReason}</p>
      ) : null}

      <div className="rh-flutter-card__divider" />

      {!locked ? (
        <footer className="rh-flutter-card__actions">
          <button
            type="button"
            className="rh-btn rh-btn--ghost"
            onClick={() => setOverrideOpen((v) => !v)}
          >
            تجاوز درجة الذكاء
          </button>
          <button
            type="button"
            className="rh-btn rh-btn--outline"
            onClick={() => setFeedbackOpen((v) => !v)}
          >
            رفض التلاوة
          </button>
          <button type="button" className="rh-btn rh-btn--sage" onClick={onApprove}>
            اعتماد القراءة صحيحة
          </button>
        </footer>
      ) : null}

      {feedbackOpen ? (
        <div className="rh-card__panel">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="سبب الرفض للمستخدم…"
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

      {overrideOpen ? (
        <div className="rh-card__panel">
          <label className="rh-card__override">
            الدرجة الجديدة (0–100)
            <input
              type="number"
              min={0}
              max={100}
              value={overrideVal}
              onChange={(e) => setOverrideVal(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="rh-btn rh-btn--gold"
            onClick={() => {
              onOverrideScore(Number(overrideVal));
              setOverrideOpen(false);
            }}
          >
            حفظ الدرجة
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default RecitationReviewCard;
