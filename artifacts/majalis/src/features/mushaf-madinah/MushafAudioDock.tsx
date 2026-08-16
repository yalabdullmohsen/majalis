import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { getReciter } from "@/lib/quran-audio";

/** قرّاء ظاهرة في مشغّل المصحف — المطلوب أولاً ثم مصادر everyayah إضافية */
export const MUSHAF_RECITER_IDS = [
  "alafasy",
  "abdulsamad",
  "husary",
  "minshawi",
  "ghamdi",
  "maher",
  "sudais",
  "shuraim",
  "fares",
  "dosari",
] as const;

type Props = {
  open: boolean;
  verseLabel: string;
  playerState: PlayerState;
  reciterId: string;
  audioError?: string | null;
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
  onTogglePlay,
  onPrev,
  onNext,
  onReciterChange,
}: Props) {
  const playing = playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const reciters = MUSHAF_RECITER_IDS.map((id) => getReciter(id));

  return (
    <div
      className="mm-audio-dock"
      data-open={open ? "1" : "0"}
      data-testid="mushaf-audio-dock"
      role="region"
      aria-label="مشغّل التلاوة"
    >
      <div className="mm-audio-dock__meta">
        <span className="mm-audio-dock__verse">{verseLabel}</span>
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
      </div>
      {loading ? (
        <p className="mm-audio-dock__status" role="status">
          جاري تحميل التلاوة…
        </p>
      ) : null}
      {audioError || playerState === "error" ? (
        <p className="mm-audio-dock__status mm-audio-dock__status--err" role="status">
          {audioError || "تعذّر تشغيل التلاوة. جرّب قارئاً آخر."}
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
