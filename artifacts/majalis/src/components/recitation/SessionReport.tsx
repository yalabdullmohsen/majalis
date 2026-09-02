import { CircularProgress } from "@/components/recitation/CircularProgress";

export type RecitationSessionReportData = {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  notesCount: number;
};

export type SessionReportProps = {
  sessionData: RecitationSessionReportData;
  onRestart: () => void;
  onHome: () => void;
};

/** يحوّل نتيجة الجلسة الحية إلى بيانات التقرير — بلا قيم افتراضية وهمية. */
export function buildSessionReportData(input: {
  correct: number;
  incorrect: number;
  total: number;
  notesCount: number;
}): RecitationSessionReportData {
  return {
    totalWords: input.total,
    correctWords: input.correct,
    incorrectWords: input.incorrect,
    notesCount: input.notesCount,
  };
}

export function masteryPercentageFromReport(data: RecitationSessionReportData): number {
  if (data.totalWords <= 0) return 0;
  return Math.round((data.correctWords / data.totalWords) * 100);
}

/**
 * شاشة تقرير الجلسة النهائي — ملخص الإتقان مع CircularProgress وإحصاءات حية.
 */
export function SessionReport({ sessionData, onRestart, onHome }: SessionReportProps) {
  const { totalWords, correctWords, incorrectWords, notesCount } = sessionData;
  const masteryPercentage = masteryPercentageFromReport(sessionData);

  return (
    <div className="rai-session-report" dir="rtl">
      <header className="rai-session-report__header">
        <button type="button" className="rai-session-report__back" onClick={onHome}>
          ← رجوع
        </button>
        <h2 className="rai-session-report__title">تقرير الجلسة</h2>
        <span className="rai-session-report__spacer" aria-hidden="true" />
      </header>

      <div className="rai-report__ring-wrap">
        <CircularProgress percentage={masteryPercentage} label="نسبة الإتقان" />
      </div>

      <div className="rai-session-report__grid">
        <div className="rai-report__stat">
          <span className="rai-report__stat-val">{notesCount}</span>
          <span className="rai-report__stat-lbl">ملاحظة</span>
        </div>
        <div className="rai-report__stat">
          <span className="rai-report__stat-val rai-report__stat-val--ok">{correctWords}</span>
          <span className="rai-report__stat-lbl">كلمة صحيحة</span>
        </div>
        <div className="rai-report__stat">
          <span className="rai-report__stat-val">{totalWords}</span>
          <span className="rai-report__stat-lbl">إجمالي الكلمات</span>
        </div>
        <div className="rai-report__stat">
          <span className="rai-report__stat-val rai-report__stat-val--ok">{masteryPercentage}%</span>
          <span className="rai-report__stat-lbl">نسبة الإتقان</span>
        </div>
        {incorrectWords > 0 && (
          <div className="rai-report__stat rai-report__stat--error rai-session-report__stat-wide">
            <span className="rai-report__stat-val rai-report__stat-val--error">{incorrectWords}</span>
            <span className="rai-report__stat-lbl">كلمة تحتاج مراجعة</span>
          </div>
        )}
      </div>

      <p className="rai-session-report__disclaimer" role="note">
        هذا التحليل مساعد تقني ولا يغني عن التلقي والعرض على مقرئ متقن.
      </p>

      <button type="button" className="rai-start-btn rai-session-report__restart" onClick={onRestart}>
        + جلسة جديدة
      </button>
    </div>
  );
}

export default SessionReport;
