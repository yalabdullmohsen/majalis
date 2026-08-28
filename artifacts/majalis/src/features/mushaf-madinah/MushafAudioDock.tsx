import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { DEFAULT_VERIFIED_RECITER_IDS } from "@/lib/audio-registry";
import { useVerifiedReciters } from "@/hooks/useVerifiedReciters";
import { useMushafAudioClock } from "./mushaf-audio-clock-store";

/** @deprecated استخدم useVerifiedReciters — يُبقى للاختبارات والتوافق */
export const MUSHAF_RECITER_IDS = DEFAULT_VERIFIED_RECITER_IDS;

type Props = {
  open: boolean;
  verseLabel: string;
  playerState: PlayerState;
  reciterId: string;
  audioError?: string | null;
  audioStatus?: string | null;
  mini?: boolean;
  onMiniChange?: (mini: boolean) => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReciterChange: (id: string) => void;
  onClose?: () => void;
  onSeek?: (seconds: number) => void;
  onSpeed?: (rate: number) => void;
  playbackRate?: number;
};

/** شريط تلاوة مضغوط أسفل المصحف — بلا وضع حفظ. */
export function MushafAudioDock({
  open,
  verseLabel,
  playerState,
  reciterId,
  audioError = null,
  audioStatus = null,
  mini = false,
  onMiniChange,
  onTogglePlay,
  onPrev,
  onNext,
  onReciterChange,
  onClose,
  onSeek,
  onSpeed,
  playbackRate = 1,
}: Props) {
  const { currentTime, duration } = useMushafAudioClock();
  const [readersOpen, setReadersOpen] = useState(false);
  const [readerQuery, setReaderQuery] = useState("");
  const playing = playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const reciters = useVerifiedReciters();
  const activeReciter = reciters.find((r) => r.id === reciterId);
  const filtered = useMemo(() => {
    const q = readerQuery.trim();
    if (!q) return reciters;
    return reciters.filter((r) => r.nameAr.includes(q) || r.id.includes(q));
  }, [readerQuery, reciters]);
  const statusLabel =
    audioStatus ||
    (playerState === "playing"
      ? "يعمل الآن"
      : playerState === "paused"
        ? "متوقف"
        : loading
          ? "جاري التحميل"
          : playerState === "ended"
            ? "انتهت التلاوة"
            : playerState === "error"
              ? "فشل التحميل"
              : "جاهز");
  const progressMax = duration > 0 ? duration : 1;
  const progressVal = duration > 0 ? Math.min(duration, Math.max(0, currentTime)) : 0;

  return (
    <>
      <div
        className="mm-audio-dock"
        data-open={open ? "1" : "0"}
        data-mini={mini ? "1" : "0"}
        data-testid="mushaf-audio-dock"
        role="region"
        aria-label="مشغّل التلاوة"
      >
        <div className="mm-audio-dock__head">
          <div className="mm-audio-dock__meta">
            <p className="mm-audio-dock__reciter-name">{activeReciter?.nameAr ?? "اختر القارئ"}</p>
            <p className="mm-audio-dock__verse">{verseLabel}</p>
          </div>
          <div className="mm-audio-dock__head-actions">
            {mini ? null : (
              <button
                type="button"
                className="mm-audio-dock__reciter-btn"
                aria-label="اختيار القارئ"
                aria-haspopup="dialog"
                aria-expanded={readersOpen}
                onClick={() => setReadersOpen(true)}
              >
                <span>القارئ</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
            )}
            {onClose ? (
              <button type="button" className="mm-audio-dock__close" onClick={onClose} aria-label="إغلاق المشغّل">
                <X size={18} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="mm-audio-dock__mini"
                aria-pressed={mini}
                aria-label={mini ? "توسيع المشغل" : "تصغير المشغل"}
                onClick={() => onMiniChange?.(!mini)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {mini ? null : (
          <label className="mm-audio-dock__seek">
            <span className="sr-only">تقدم التلاوة</span>
            <input
              type="range"
              className="mm-audio-dock__progress"
              min={0}
              max={progressMax}
              step={0.1}
              value={progressVal}
              disabled={duration <= 0 || !onSeek}
              onChange={(e) => onSeek?.(Number(e.target.value))}
              aria-label="تقدم التلاوة"
            />
          </label>
        )}

        <div className="mm-audio-dock__controls">
          {mini ? null : (
            <button type="button" onClick={onPrev} aria-label="الآية السابقة">
              <SkipBack size={16} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="mm-audio-dock__play"
            onClick={onTogglePlay}
            aria-label={playing ? "إيقاف" : "تشغيل"}
          >
            {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
          </button>
          {mini ? null : (
            <button type="button" onClick={onNext} aria-label="الآية التالية">
              <SkipForward size={16} aria-hidden="true" />
            </button>
          )}
          {mini || !onSpeed ? null : (
            <div className="mm-audio-dock__rates" role="group" aria-label="السرعة">
              {([0.75, 1, 1.25] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  aria-pressed={Math.abs(playbackRate - rate) < 0.01}
                  onClick={() => onSpeed(rate)}
                >
                  {rate}×
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mm-audio-dock__status" role="status">
          {statusLabel}
          {loading ? " · جاري تحميل التلاوة…" : ""}
          {audioError || playerState === "error"
            ? ` · ${audioError || "تعذر تشغيل هذه الآية لهذا القارئ"}`
            : ""}
        </p>
      </div>

      {readersOpen
        ? createPortal(
            <div className="mm-reciter-sheet" role="dialog" aria-modal="true" aria-label="اختيار التلاوة">
              <button
                type="button"
                className="mm-reciter-sheet__scrim"
                aria-label="إغلاق قائمة القراء"
                onClick={() => {
                  setReadersOpen(false);
                  setReaderQuery("");
                }}
              />
              <div className="mm-reciter-sheet__panel">
                <div className="mm-reciter-sheet__head">
                  <button
                    type="button"
                    className="mm-ayah-bar__close"
                    onClick={() => {
                      setReadersOpen(false);
                      setReaderQuery("");
                    }}
                    aria-label="إغلاق"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                  <h2 className="mm-reciter-sheet__title">اختيار التلاوة</h2>
                  <span className="mm-reciter-sheet__meta" aria-hidden="true" />
                </div>
                <label className="mm-reciter-sheet__search">
                  <span className="sr-only">بحث عن قارئ</span>
                  <input
                    type="search"
                    value={readerQuery}
                    onChange={(e) => setReaderQuery(e.target.value)}
                    placeholder="بحث…"
                  />
                </label>
                <p className="mm-reciter-sheet__hint">التلاوات</p>
                <ul className="mm-reciter-sheet__list" role="listbox" aria-label="قائمة القراء">
                  {filtered.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={r.id === reciterId}
                        className={r.id === reciterId ? "is-active" : undefined}
                        onClick={() => {
                          onReciterChange(r.id);
                          setReadersOpen(false);
                          setReaderQuery("");
                        }}
                      >
                        <span>{r.nameAr}</span>
                        <span className="mm-reciter-sheet__meta">{r.qualityLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
