import { Download, Pause, Play, Trash2 } from "lucide-react";
import type { DownloadProgress, ReciterDownloadStatus } from "@/lib/quran-audio-downloads";
import { toArabicDigits } from "@/lib/utils";

export type BulkDownloadCardProps = {
  reciterId: string;
  reciterName: string;
  activeProgress: (DownloadProgress & { reciterId: string }) | null;
  storedStatus?: ReciterDownloadStatus;
  isPaused: boolean;
  downloadLocked?: boolean;
  onStart: () => void;
  onPause: () => void;
  onDelete?: () => void;
};

function formatStoredMb(bytes: number): string {
  return toArabicDigits((bytes / (1024 * 1024)).toFixed(0));
}

function resolveUiState(
  reciterId: string,
  activeProgress: BulkDownloadCardProps["activeProgress"],
  storedStatus: ReciterDownloadStatus | undefined,
  isPaused: boolean,
): DownloadProgress["status"] {
  if (activeProgress?.reciterId === reciterId) return activeProgress.status;
  if (isPaused) return "paused";
  if (storedStatus?.complete) return "completed";
  if (storedStatus && storedStatus.downloadedSurahs > 0) return "paused";
  return "idle";
}

function statusMessage(
  status: DownloadProgress["status"],
  progress: DownloadProgress | null,
  storedStatus: ReciterDownloadStatus | undefined,
): string {
  if (status === "downloading" && progress) {
    return `جاري تنزيل سورة ${toArabicDigits(progress.currentSurah)} من ١١٤ · ${progress.downloadedMB}/${progress.totalMB} م.ب`;
  }
  if (status === "completed") return "تم تنزيل المصحف كاملاً";
  if (status === "paused") {
    const done = storedStatus?.downloadedSurahs ?? progress?.done ?? 0;
    return done > 0 ? `متوقف مؤقتًا — ${toArabicDigits(done)}/١١٤ سورة` : "متوقف مؤقتًا";
  }
  if (status === "error") return "حدث خطأ — أعد المحاولة";
  return "جاهز لبدء التنزيل (١١٤ سورة)";
}

/** بطاقة تنزيل المصحف كاملاً لقارئ واحد — بديل BulkDownloadModal (Capacitor/ويب). */
export function BulkDownloadCard({
  reciterId,
  reciterName,
  activeProgress,
  storedStatus,
  isPaused,
  downloadLocked = false,
  onStart,
  onPause,
  onDelete,
}: BulkDownloadCardProps) {
  const isActive = activeProgress?.reciterId === reciterId;
  const progress = isActive ? activeProgress : null;
  const status = resolveUiState(reciterId, activeProgress, storedStatus, isPaused);
  const percentage = progress?.percentage ?? (storedStatus?.complete ? 100 : 0);
  const detail = statusMessage(status, progress, storedStatus);
  const canDelete =
    onDelete &&
    !isActive &&
    storedStatus &&
    storedStatus.downloadedSurahs > 0 &&
    status !== "completed";

  return (
    <article className="bdm-card" aria-labelledby={`bdm-title-${reciterId}`}>
      <header className="bdm-card__header">
        <h3 id={`bdm-title-${reciterId}`} className="bdm-card__title">
          تنزيل المصحف كاملاً دون اتصال
        </h3>
        <p className="bdm-card__reciter">القارئ: {reciterName}</p>
      </header>

      <div className="bdm-card__progress">
        <div className="bdm-card__info">
          <span>التقدم الكلي: {toArabicDigits(percentage)}٪</span>
          <span>{detail}</span>
        </div>
        <div
          className="bdm-card__bar"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`تقدّم تنزيل ${reciterName}`}
        >
          <div className="bdm-card__bar-fill" style={{ width: `${percentage}%` }} />
        </div>
        {storedStatus?.complete ? (
          <p className="bdm-card__size">الحجم: {formatStoredMb(storedStatus.totalBytes)} م.ب</p>
        ) : null}
      </div>

      <div className="bdm-card__actions">
        {status === "downloading" ? (
          <button type="button" className="bdm-card__btn bdm-card__btn--pause" onClick={onPause}>
            <Pause size={16} strokeWidth={2} aria-hidden="true" />
            إيقاف مؤقت
          </button>
        ) : status === "completed" ? (
          <button type="button" className="bdm-card__btn bdm-card__btn--done" disabled>
            المصحف محمّل بالكامل
          </button>
        ) : canDelete ? (
          <div className="bdm-card__action-row">
            <button
              type="button"
              className="bdm-card__btn bdm-card__btn--start"
              onClick={onStart}
              disabled={downloadLocked}
            >
              {isPaused ? (
                <>
                  <Play size={16} strokeWidth={2} aria-hidden="true" />
                  استئناف
                </>
              ) : (
                <>
                  <Download size={16} strokeWidth={2} aria-hidden="true" />
                  متابعة التنزيل
                </>
              )}
            </button>
            <button
              type="button"
              className="bdm-card__btn bdm-card__btn--delete"
              onClick={onDelete}
              aria-label={`حذف تنزيل ${reciterName}`}
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
              حذف
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="bdm-card__btn bdm-card__btn--start"
            onClick={onStart}
            disabled={downloadLocked}
          >
            {isPaused ? (
              <>
                <Play size={16} strokeWidth={2} aria-hidden="true" />
                استئناف التحميل
              </>
            ) : (
              <>
                <Download size={16} strokeWidth={2} aria-hidden="true" />
                بدء تحميل المصحف
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
