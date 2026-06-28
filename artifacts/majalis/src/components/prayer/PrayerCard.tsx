import { useState } from "react";
import type { PrayerKey, PrayerSession } from "@/lib/prayer-tracker";
import { PRAYER_LABELS } from "@/lib/prayer-tracker";
import type { PrayerSlot } from "@/lib/prayer-times";

type Props = {
  prayerKey: PrayerKey;
  time?: PrayerSlot;
  session: PrayerSession;
  isNext: boolean;
  isCurrent: boolean;
  onUpdate: (patch: Partial<PrayerSession>) => void;
};

export function PrayerCard({ prayerKey, time, session, isNext, isCurrent, onUpdate }: Props) {
  const [showNotes, setShowNotes] = useState(false);
  const statusLabel =
    session.status === "done" ? "تمت" : session.status === "missed" ? "فاتت" : "بانتظار";

  return (
    <article
      className={`ui-card prayer-action-card is-${session.status}${isNext ? " is-next" : ""}${isCurrent ? " is-current" : ""}`}
    >
      <header className="prayer-action-card__head">
        <div>
          <strong>{PRAYER_LABELS[prayerKey]}</strong>
          <span className="prayer-action-card__time">{time?.time || "—"}</span>
        </div>
        <span className={`prayer-action-card__status is-${session.status}`}>{statusLabel}</span>
      </header>

      <div className="prayer-action-card__actions">
        <button
          type="button"
          className={session.status === "done" ? "is-active" : ""}
          onClick={() => onUpdate({ status: "done" })}
        >
          تمت الصلاة
        </button>
        <button
          type="button"
          className={session.place === "mosque" ? "is-active" : ""}
          onClick={() => onUpdate({ place: "mosque", status: session.status === "pending" ? "done" : session.status })}
        >
          في المسجد
        </button>
        <button
          type="button"
          className={session.congregation ? "is-active" : ""}
          onClick={() => onUpdate({ congregation: !session.congregation, status: session.status === "pending" ? "done" : session.status })}
        >
          جماعة
        </button>
        <button
          type="button"
          className={session.isFirstTime ? "is-active" : ""}
          onClick={() => onUpdate({ isFirstTime: !session.isFirstTime, status: session.status === "pending" ? "done" : session.status })}
        >
          أول الوقت
        </button>
        <button type="button" onClick={() => setShowNotes((v) => !v)}>
          ملاحظات
        </button>
        {session.status !== "missed" && (
          <button type="button" className="is-muted" onClick={() => onUpdate({ status: "missed" })}>
            فاتت
          </button>
        )}
      </div>

      {session.pointsEarned > 0 && (
        <p className="prayer-action-card__points">+{session.pointsEarned} نقطة</p>
      )}

      {showNotes && (
        <textarea
          className="prayer-action-card__notes"
          value={session.notes}
          placeholder="ملاحظات..."
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={2}
        />
      )}
    </article>
  );
}
