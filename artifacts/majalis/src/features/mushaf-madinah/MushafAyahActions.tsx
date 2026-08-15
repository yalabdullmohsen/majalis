import { useState } from "react";
import { BookOpen, Copy, Mic2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { getReciter } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import { MUSHAF_RECITER_IDS } from "./MushafAudioDock";
import { parseVerseKey } from "./mushaf-page-for-ayah";

type Props = {
  verseKey: string;
  copyStatus: string | null;
  audioError: string | null;
  playerState: PlayerState;
  reciterId: string;
  onPlay: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTafsir: () => void;
  onCopy: () => void;
  onReciterChange: (id: string) => void;
  onClose: () => void;
};

/** شريط آية سفلي فاتح — تشغيل / تفسير / قراء / نسخ دون طبقة سوداء. */
export function MushafAyahActions({
  verseKey,
  copyStatus,
  audioError,
  playerState,
  reciterId,
  onPlay,
  onTogglePlay,
  onPrev,
  onNext,
  onTafsir,
  onCopy,
  onReciterChange,
  onClose,
}: Props) {
  const [readersOpen, setReadersOpen] = useState(false);
  const parsed = parseVerseKey(verseKey);
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed ? `${surahName} · آية ${parsed.ayah}` : verseKey;
  const playing =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const reciters = MUSHAF_RECITER_IDS.map((id) => getReciter(id));
  const currentReciter = getReciter(reciterId);

  return createPortal(
    <div className="mm-ayah-bar" data-testid="mushaf-ayah-actions" role="region" aria-label="خيارات الآية">
      <button
        type="button"
        className="mm-ayah-bar__dismiss"
        aria-label="إغلاق شريط الآية"
        onClick={onClose}
      />
      <div className="mm-ayah-bar__panel">
        <div className="mm-ayah-bar__head">
          <p className="mm-ayah-bar__title">{title}</p>
          <button type="button" className="mm-ayah-bar__close" onClick={onClose} aria-label="إغلاق">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {playing || playerState === "paused" || playerState === "error" ? (
          <div className="mm-ayah-bar__transport" role="group" aria-label="تحكم التلاوة">
            <button type="button" onClick={onPrev} aria-label="الآية السابقة">
              <SkipBack size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="mm-ayah-bar__play-main"
              onClick={onTogglePlay}
              aria-label={playing ? "إيقاف" : "تشغيل"}
            >
              {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
            </button>
            <button type="button" onClick={onNext} aria-label="الآية التالية">
              <SkipForward size={18} aria-hidden="true" />
            </button>
            <span className="mm-ayah-bar__reciter-name">{currentReciter.nameAr}</span>
          </div>
        ) : null}

        {audioError || playerState === "error" ? (
          <p className="mm-ayah-bar__status mm-ayah-bar__status--err" role="status">
            {audioError || "تعذّر تشغيل التلاوة. جرّب قارئاً آخر أو أعد المحاولة."}
          </p>
        ) : null}
        {copyStatus ? (
          <p className="mm-ayah-bar__status" role="status">
            {copyStatus}
          </p>
        ) : null}

        <div className="mm-ayah-bar__actions">
          <button
            type="button"
            onClick={() => {
              setReadersOpen(false);
              onPlay();
            }}
          >
            <Play size={16} aria-hidden="true" />
            <span>تشغيل التلاوة</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setReadersOpen(false);
              onTafsir();
            }}
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>التفسير</span>
          </button>
          <button type="button" aria-expanded={readersOpen} onClick={() => setReadersOpen((v) => !v)}>
            <Mic2 size={16} aria-hidden="true" />
            <span>القراء</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setReadersOpen(false);
              onCopy();
            }}
          >
            <Copy size={16} aria-hidden="true" />
            <span>نسخ</span>
          </button>
        </div>

        {readersOpen ? (
          <ul className="mm-ayah-bar__readers" role="listbox" aria-label="اختيار القارئ">
            {reciters.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={r.id === reciterId}
                  className={r.id === reciterId ? "is-active" : undefined}
                  onClick={() => {
                    onReciterChange(r.id);
                    setReadersOpen(false);
                  }}
                >
                  {r.nameAr}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
