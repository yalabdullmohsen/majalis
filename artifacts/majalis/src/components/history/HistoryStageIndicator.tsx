import type { CSSProperties } from "react";
import type { HistoryCategory, HistoryEraMeta } from "@/data/islamic-history";

type Props = {
  /** عند المسار الكامل يُعرض ملخص عام بدل مرحلة واحدة */
  mode: "all" | "era";
  stageIndex: number;
  stageTotal: number;
  eventCount: number;
  meta?: HistoryEraMeta;
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
};

/**
 * مؤشر مرحلة داخل قسم التاريخ الإسلامي — أين المستخدم في المسار.
 */
export function HistoryStageIndicator({
  mode,
  stageIndex,
  stageTotal,
  eventCount,
  meta,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  className = "",
}: Props) {
  const progress =
    mode === "all"
      ? 0
      : Math.min(1, Math.max(0, stageTotal > 0 ? stageIndex / stageTotal : 0));
  const title = mode === "all" ? "المسار كاملاً" : (meta?.title ?? "مرحلة");
  const period = mode === "all" ? `${stageTotal} مراحل` : meta?.period;
  const kicker =
    mode === "all" ? "تصفّح كل العصور" : `المرحلة ${stageIndex} من ${stageTotal}`;

  return (
    <div
      className={`tarikh-stage${className ? ` ${className}` : ""}`}
      data-testid="history-stage-indicator"
      style={
        meta
          ? ({ ["--tarikh-accent" as string]: meta.accent } as CSSProperties)
          : undefined
      }
      aria-label={`المرحلة الحالية: ${title}`}
    >
      <div className="tarikh-stage__row">
        <button
          type="button"
          className="tarikh-stage__nav"
          onClick={onPrev}
          disabled={!onPrev}
          aria-label={prevLabel ? `المرحلة السابقة: ${prevLabel}` : "المرحلة السابقة"}
        >
          السابق
        </button>
        <div className="tarikh-stage__main">
          <p className="tarikh-stage__kicker">{kicker}</p>
          <p className="tarikh-stage__title">{title}</p>
          <p className="tarikh-stage__meta">
            {[period, `${eventCount} حدثًا`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          className="tarikh-stage__nav"
          onClick={onNext}
          disabled={!onNext}
          aria-label={nextLabel ? `المرحلة التالية: ${nextLabel}` : "المرحلة التالية"}
        >
          التالي
        </button>
      </div>
      <div
        className="tarikh-stage__progress"
        role="progressbar"
        aria-valuemin={mode === "all" ? 0 : 1}
        aria-valuemax={stageTotal}
        aria-valuenow={mode === "all" ? 0 : stageIndex}
        aria-label="تقدم المسار"
      >
        <span className="tarikh-stage__progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

export type HistoryStageCategory = HistoryCategory;
