import { ChevronDown, ChevronUp, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { DEFAULT_VERIFIED_RECITER_IDS } from "@/lib/audio-registry";
import { useVerifiedReciters } from "@/hooks/useVerifiedReciters";

/** @deprecated استخدم useVerifiedReciters — يُبقى للاختبارات والتوافق */
export const MUSHAF_RECITER_IDS = DEFAULT_VERIFIED_RECITER_IDS;

type Props = {
  open: boolean;
  verseLabel: string;
  playerState: PlayerState;
  reciterId: string;
  audioError?: string | null;
  audioStatus?: string | null;
  currentTime?: number;
  duration?: number;
  mini?: boolean;
  onMiniChange?: (mini: boolean) => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReciterChange: (id: string) => void;
};

/** شريط تلاوة خفيف — تشغيل/إيقاف/سابق/تالي + اختيار القارئ. */
export function MushafAudioDock({
  open,
  verseLabel,
  playerState,
  reciterId,
  audioError = null,
  audioStatus = null,
  currentTime = 0,
  duration = 0,
  mini = false,
  onMiniChange,
  onTogglePlay,
  onPrev,
  onNext,
  onReciterChange,
}: Props) {
  const playing = playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const reciters = useVerifiedReciters();
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
    <div
      className="mm-audio-dock"
      data-open={open ? "1" : "0"}
      data-mini={mini ? "1" : "0"}
      data-testid="mushaf-audio-dock"
      role="region"
      aria-label="مشغّل التلاوة"
    >
      <div className="mm-audio-dock__meta">
        <span className="mm-audio-dock__verse">{verseLabel}</span>
        <button
          type="button"
          className="mm-audio-dock__mini"
          aria-pressed={mini}
          aria-label={mini ? "توسيع المشغل" : "تصغير المشغل"}
          onClick={() => onMiniChange?.(!mini)}
        >
          {mini ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
        {mini ? null : (
        <label className="mm-audio-dock__reciter">
          <span className="sr-only">القارئ</span>
          <select
            value={reciterId}
            onChange={(e) => onReciterChange(e.target.value)}
            aria-label="اختيار القارئ"
          >
            {reciters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameAr}
              </option>
            ))}
          </select>
        </label>
        )}
      </div>
      {mini ? null : (
      <progress className="mm-audio-dock__progress" max={progressMax} value={progressVal} aria-label="تقدم التلاوة" />
      )}
      <p className="mm-audio-dock__status" role="status">
        {statusLabel}
      </p>
      {loading ? (
        <p className="mm-audio-dock__status" role="status">
          جاري تحميل التلاوة…
        </p>
      ) : null}
      {audioError || playerState === "error" ? (
        <p className="mm-audio-dock__status mm-audio-dock__status--err" role="status">
          {audioError || "تعذر تحميل التلاوة، جرّب قارئًا آخر"}
        </p>
      ) : null}
      <div className="mm-audio-dock__controls">
        <button type="button" onClick={onPrev} aria-label="الآية السابقة">
          <SkipBack size={18} aria-hidden="true" />
        </button>
        <button type="button" className="mm-audio-dock__play" onClick={onTogglePlay} aria-label={playing ? "إيقاف" : "تشغيل"}>
          {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
        </button>
        <button type="button" onClick={onNext} aria-label="الآية التالية">
          <SkipForward size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
