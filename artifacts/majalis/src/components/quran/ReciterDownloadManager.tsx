import { useEffect, useRef, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { RECITERS } from "@/lib/quran-audio";
import {
  getAllDownloadStatuses,
  downloadReciter,
  deleteReciterDownloads,
  estimateStorageUsage,
  type ReciterDownloadStatus,
} from "@/lib/quran-audio-downloads";
import { toArabicDigits } from "@/lib/utils";

function formatMB(bytes: number): string {
  return toArabicDigits((bytes / (1024 * 1024)).toFixed(0));
}

/** إدارة تنزيل تلاوة السور كاملة لكل قارئ للاستماع دون اتصال — قائمة مدمجة
 * ضمن لوحة إعدادات قارئ المصحف، تُعيد استخدام أنماط mpv-settings-group/
 * mpv-chip القائمة بلا تكرار تصميم جديد. */
export function ReciterDownloadManager() {
  const [statuses, setStatuses] = useState<ReciterDownloadStatus[]>([]);
  const [activeDownload, setActiveDownload] = useState<{ reciterId: string; done: number; total: number } | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const cancelRef = useRef(false);

  const refresh = async () => {
    setStatuses(await getAllDownloadStatuses());
    setStorage(await estimateStorageUsage());
  };

  useEffect(() => { void refresh(); }, []);

  const handleDownload = async (reciterId: string) => {
    cancelRef.current = false;
    setActiveDownload({ reciterId, done: 0, total: 114 });
    try {
      await downloadReciter(
        reciterId,
        (p) => setActiveDownload({ reciterId, done: p.done, total: p.total }),
        () => cancelRef.current,
      );
    } catch {
      // فشل جزئي (انقطاع شبكة أثناء التنزيل) — ما نجح تنزيله يبقى محفوظًا،
      // والمستخدم يستطيع إعادة المحاولة لاحقًا فتُكمل من حيث توقفت (يتخطى
      // downloadReciter السور المحمَّلة مسبقًا).
    }
    setActiveDownload(null);
    await refresh();
  };

  const handleCancel = () => { cancelRef.current = true; };

  const handleDelete = async (reciterId: string) => {
    await deleteReciterDownloads(reciterId);
    await refresh();
  };

  return (
    <div className="mpv-settings-group">
      <span className="mpv-settings-group__label">
        تنزيل التلاوة للاستماع دون اتصال
        {storage && storage.quota > 0 && (
          <small style={{ display: "block", opacity: .65, fontWeight: 400, marginTop: ".2rem" }}>
            المساحة المستخدَمة على الجهاز: {formatMB(storage.usage)} ميغابايت
          </small>
        )}
      </span>
      <div className="rdm-list">
        {RECITERS.map((r) => {
          const status = statuses.find((s) => s.reciterId === r.id);
          const isDownloading = activeDownload?.reciterId === r.id;
          const percent = isDownloading ? Math.round((activeDownload!.done / activeDownload!.total) * 100) : 0;
          return (
            <div key={r.id} className="rdm-row">
              <div className="rdm-row__info">
                <span className="rdm-row__name">{r.nameAr}</span>
                <span className="rdm-row__status">
                  {isDownloading
                    ? `جارٍ التنزيل — ${toArabicDigits(percent)}٪`
                    : status?.complete
                      ? `مُنزَّلة كاملة — ${formatMB(status.totalBytes)} م.ب`
                      : status && status.downloadedSurahs > 0
                        ? `جزئي — ${toArabicDigits(status.downloadedSurahs)}/١١٤ سورة`
                        : "غير مُنزَّلة"}
                </span>
                {isDownloading && (
                  <div className="rdm-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="rdm-progress__fill" style={{ width: `${percent}%` }} />
                  </div>
                )}
              </div>
              {isDownloading ? (
                <button type="button" className="mpv-chip" onClick={handleCancel}>إلغاء</button>
              ) : status && status.downloadedSurahs > 0 ? (
                <button type="button" className="mpv-chip" onClick={() => handleDelete(r.id)} aria-label={`حذف تنزيل ${r.nameAr}`}>
                  <Trash2 size={14} strokeWidth={2} aria-hidden="true" /> حذف
                </button>
              ) : (
                <button type="button" className="mpv-chip" onClick={() => handleDownload(r.id)} aria-label={`تنزيل تلاوة ${r.nameAr}`} disabled={!!activeDownload}>
                  <Download size={14} strokeWidth={2} aria-hidden="true" /> تنزيل
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
