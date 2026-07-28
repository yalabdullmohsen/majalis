/**
 * A. AI & Voice Recitation Review card.
 */
import { useState } from "react";
import type { RecitationReviewItem } from "@/lib/admin-review-hub";
import { WaveformAudioPlayer } from "./WaveformAudioPlayer";

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

  return (
    <article
      className={`rh-card rh-card--rec${selected ? " is-selected" : ""}`}
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
          <h3 className="rh-card__title">{item.verseRef}</h3>
          <p className="rh-card__sub">
            {item.userName} · {item.userId} · سورة {item.surah} آية {item.ayah}
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

      <div className="rh-card__body rh-card__body--split">
        <div className="rh-card__verse">
          <p className="rh-card__label">النص القرآني المتوقع</p>
          <p className="rh-card__uthmani">{item.expectedText}</p>
          <p className="rh-card__score">
            درجة الذكاء: <strong>{displayScore}%</strong>
            {item.overriddenScore != null ? (
              <span className="rh-card__override-note"> (بعد التعديل)</span>
            ) : null}
          </p>
          {item.notes ? <p className="rh-card__notes">{item.notes}</p> : null}
        </div>
        <WaveformAudioPlayer src={item.audioUrl} peaks={item.waveform} />
      </div>

      {!locked ? (
        <footer className="rh-card__actions">
          <button type="button" className="rh-btn rh-btn--sage" onClick={onApprove}>
            اعتماد التلاوة
          </button>
          <button
            type="button"
            className="rh-btn rh-btn--rose"
            onClick={() => setFeedbackOpen((v) => !v)}
          >
            رفض مع ملاحظة
          </button>
          <button
            type="button"
            className="rh-btn rh-btn--gold"
            onClick={() => setOverrideOpen((v) => !v)}
          >
            تجاوز درجة الذكاء
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

      {item.feedback && item.status === "rejected" ? (
        <p className="rh-card__feedback">ملاحظة الرفض: {item.feedback}</p>
      ) : null}
    </article>
  );
}

export default RecitationReviewCard;
