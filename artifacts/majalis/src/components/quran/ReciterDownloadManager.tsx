import { useEffect, useState } from "react";
import { getSelectableReciters } from "@/lib/quran-audio";
import { getVerifiedReciters, getVerifiedRecitersSyncFallback } from "@/lib/audio-registry";
import {
  getAllDownloadStatuses,
  deleteReciterDownloads,
  estimateStorageUsage,
  MAX_FULL_OFFLINE_RECITERS,
  MAX_OFFLINE_AUDIO_BYTES,
  OfflineAudioQuotaError,
  resolveDownloadResumeHint,
  type DownloadProgress,
  type ReciterDownloadStatus,
} from "@/lib/quran-audio-downloads";
import { FullQuranDownloader } from "@/lib/full-quran-downloader";
import { BulkDownloadCard } from "@/components/quran/BulkDownloadCard";
import { toArabicDigits } from "@/lib/utils";

function formatMB(bytes: number): string {
  return toArabicDigits((bytes / (1024 * 1024)).toFixed(0));
}

type ActiveJob = DownloadProgress & { reciterId: string };

/** إدارة تنزيل تلاوة السور كاملة — بطاقة BulkDownloadCard لكل قارئ */
export function ReciterDownloadManager() {
  const [statuses, setStatuses] = useState<ReciterDownloadStatus[]>([]);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [pausedReciterId, setPausedReciterId] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [quotaMsg, setQuotaMsg] = useState<string | null>(null);
  const [verifiedReciters, setVerifiedReciters] = useState(() => getVerifiedRecitersSyncFallback());

  const refresh = async () => {
    setStatuses(await getAllDownloadStatuses());
    setStorage(await estimateStorageUsage());
  };

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const hint = await resolveDownloadResumeHint();
      if (!cancelled && hint) setPausedReciterId(hint.reciterId);
    })();
    const onHint = (e: Event) => {
      const detail = (e as CustomEvent<{ reciterId?: string }>).detail;
      if (detail?.reciterId) setPausedReciterId(detail.reciterId);
    };
    window.addEventListener("majalis:download-resume-hint", onHint);
    return () => {
      cancelled = true;
      window.removeEventListener("majalis:download-resume-hint", onHint);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await getVerifiedReciters();
      if (cancelled) return;
      setVerifiedReciters(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = async (reciterId: string) => {
    setQuotaMsg(null);
    setPausedReciterId(null);
    setActiveJob({
      reciterId,
      currentSurah: 1,
      totalSurahs: 114,
      percentage: 0,
      downloadedMB: "0.0",
      totalMB: "0.0",
      status: "downloading",
      surah: 1,
      done: 0,
      total: 114,
    });
    try {
      const result = await FullQuranDownloader.downloadFullQuran(reciterId, (p) => {
        setActiveJob({ ...p, reciterId });
      });
      if (result === "paused") {
        setPausedReciterId(reciterId);
      }
    } catch (err) {
      if (err instanceof OfflineAudioQuotaError) {
        setQuotaMsg(err.message);
      }
    }
    setActiveJob(null);
    await refresh();
  };

  const handlePause = () => {
    FullQuranDownloader.pauseDownload();
    if (activeJob) {
      setPausedReciterId(activeJob.reciterId);
      setActiveJob(null);
    }
  };

  const handleDelete = async (reciterId: string) => {
    await deleteReciterDownloads(reciterId);
    if (pausedReciterId === reciterId) setPausedReciterId(null);
    await refresh();
  };

  const verifiedIdSet = new Set(verifiedReciters.map((r) => r.id));
  const selectable = getSelectableReciters("surah");
  const filteredSelectable = selectable.filter((r) => verifiedIdSet.has(r.id));
  const visibleReciters = filteredSelectable.length > 0 ? filteredSelectable : selectable;

  return (
    <div className="mpv-settings-group">
      <span className="mpv-settings-group__label">
        تنزيل اختياري للاستماع دون اتصال (البث الحي هو الافتراضي)
        <small style={{ display: "block", opacity: .65, fontWeight: 400, marginTop: ".2rem" }}>
          سقف التطبيق: {formatMB(MAX_OFFLINE_AUDIO_BYTES)} م.ب · بحد أقصى{" "}
          {toArabicDigits(MAX_FULL_OFFLINE_RECITERS)} قرّاء كاملين
          {storage && storage.quota > 0
            ? ` · الجهاز: ${formatMB(storage.usage)} م.ب`
            : null}
        </small>
      </span>
      {quotaMsg ? (
        <p role="alert" style={{ fontSize: ".85rem", color: "var(--mj-danger, #b91c1c)", margin: "0 0 .5rem" }}>
          {quotaMsg}
        </p>
      ) : null}
      <div className="bdm-list">
        {visibleReciters.map((r) => {
          const status = statuses.find((s) => s.reciterId === r.id);
          const isPaused = pausedReciterId === r.id && activeJob?.reciterId !== r.id;
          return (
            <BulkDownloadCard
              key={r.id}
              reciterId={r.id}
              reciterName={r.nameAr}
              activeProgress={activeJob}
              storedStatus={status}
              isPaused={isPaused}
              downloadLocked={!!activeJob && activeJob.reciterId !== r.id}
              onStart={() => void handleDownload(r.id)}
              onPause={handlePause}
              onDelete={() => void handleDelete(r.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
