import { useMemo, useState } from "react";
import { BookOpen, Copy, Mic2, Pause, Play, Share2, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { getReciter } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import { MUSHAF_RECITER_IDS } from "./MushafAudioDock";
import { parseVerseKey } from "./mushaf-page-for-ayah";

type Props = {
  verseKey: string;
  ayahPreview?: string;
  copyStatus: string | null;
  audioError: string | null;
  playerState: PlayerState;
  reciterId: string;
  onPlay: () => void;
  onTogglePlay: () => void;
  onTafsir: () => void;
  onCopy: () => void;
  onShare: () => void;
  onReciterChange: (id: string) => void;
  onClose: () => void;
};

/** شريط آية سفلي فاتح — تشغيل / قراء / تفسير / نسخ / مشاركة بلا طبقة سوداء. */
export function MushafAyahActions({
  verseKey,
  ayahPreview = "",
  copyStatus,
  audioError,
  playerState,
  reciterId,
  onPlay,
  onTogglePlay,
  onTafsir,
  onCopy,
  onShare,
  onReciterChange,
  onClose,
}: Props) {
  const [readersOpen, setReadersOpen] = useState(false);
  const [readerQuery, setReaderQuery] = useState("");
  const parsed = parseVerseKey(verseKey);
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed ? `${surahName} · آية ${parsed.ayah}` : verseKey;
  const playing =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const reciters = useMemo(() => MUSHAF_RECITER_IDS.map((id) => getReciter(id)), []);
  const filtered = useMemo(() => {
    const q = readerQuery.trim();
    if (!q) return reciters;
    return reciters.filter((r) => r.nameAr.includes(q) || r.nameEn.toLowerCase().includes(q.toLowerCase()));
  }, [readerQuery, reciters]);
  const currentReciter = getReciter(reciterId);

  return createPortal(
    <>
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
              <button
                type="button"
                className="mm-ayah-bar__play-main"
                onClick={onTogglePlay}
                aria-label={playing ? "إيقاف مؤقت" : "استئناف"}
              >
                {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
              </button>
              <span className="mm-ayah-bar__reciter-name">{currentReciter.nameAr}</span>
              {loading ? <span className="mm-ayah-bar__loading">جاري التحميل…</span> : null}
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
              <span>تشغيل</span>
            </button>
            <button
              type="button"
              aria-expanded={readersOpen}
              onClick={() => setReadersOpen(true)}
            >
              <Mic2 size={16} aria-hidden="true" />
              <span>القارئ</span>
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
            <button
              type="button"
              onClick={() => {
                setReadersOpen(false);
                onShare();
              }}
            >
              <Share2 size={16} aria-hidden="true" />
              <span>مشاركة</span>
            </button>
            <button type="button" onClick={onClose}>
              <X size={16} aria-hidden="true" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </div>

      {readersOpen
        ? createPortal(
            <div className="mm-reciter-sheet" role="dialog" aria-modal="true" aria-label="اختيار القارئ">
              <button
                type="button"
                className="mm-reciter-sheet__scrim"
                aria-label="إغلاق قائمة القراء"
                onClick={() => setReadersOpen(false)}
              />
              <div className="mm-reciter-sheet__panel">
                <div className="mm-reciter-sheet__head">
                  <h2 className="mm-reciter-sheet__title">اختر القارئ</h2>
                  <button
                    type="button"
                    className="mm-ayah-bar__close"
                    onClick={() => setReadersOpen(false)}
                    aria-label="إغلاق"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <label className="mm-reciter-sheet__search">
                  <span className="sr-only">بحث عن قارئ</span>
                  <input
                    type="search"
                    value={readerQuery}
                    onChange={(e) => setReaderQuery(e.target.value)}
                    placeholder="ابحث عن قارئ…"
                  />
                </label>
                {ayahPreview ? <p className="mm-reciter-sheet__hint">{title}</p> : null}
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
                {filtered.length === 0 ? (
                  <p className="mm-ayah-bar__status" role="status">
                    لا نتائج لهذا البحث.
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>,
    document.body,
  );
}
