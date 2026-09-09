import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { DEFAULT_VERIFIED_RECITER_IDS } from "@/lib/audio-registry";
import { getReciter } from "@/lib/quran-audio";
import { useVerifiedReciters } from "@/hooks/useVerifiedReciters";
import { useMushafAudioClock } from "./mushaf-audio-clock-store";
import type { RecitationRange } from "./mushaf-page-for-ayah";

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
  onPlayReciter?: (id: string) => void;
  onClose?: () => void;
  onSeek?: (seconds: number) => void;
  onSpeed?: (rate: number) => void;
  onPlayRange?: (range: RecitationRange, repeatCount: number, delayMs?: number) => void;
  readersOpen?: boolean;
  onReadersOpenChange?: (open: boolean) => void;
};

/** شريط تلاوة: مطوي = قارئ+آية+تشغيل · موسَّع = سرعة/تكرار/نطاق/حفظ. */
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
  onPlayReciter,
  onClose,
  onSeek,
  onSpeed,
  onPlayRange,
  readersOpen: readersOpenProp,
  onReadersOpenChange,
}: Props) {
  const { currentTime, duration, playbackRate } = useMushafAudioClock();
  const [readersOpenLocal, setReadersOpenLocal] = useState(false);
  const readersOpen = readersOpenProp ?? readersOpenLocal;
  const setReadersOpen = onReadersOpenChange ?? setReadersOpenLocal;
  const [readerQuery, setReaderQuery] = useState("");
  const [repeatCount, setRepeatCount] = useState(1);
  const [range, setRange] = useState<RecitationRange>("ayah");
  const [hifzOpen, setHifzOpen] = useState(false);
  const playing = playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const reciters = useVerifiedReciters();
  const activeReciter = reciters.find((r) => r.id === reciterId);
  const reciterLabel =
    activeReciter?.nameAr?.trim() ||
    (reciters.length === 0 ? "اختر القارئ" : getReciter(reciterId).nameAr?.trim()) ||
    "اختر القارئ";
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
              ? "تعذر تشغيل التلاوة الآن"
              : "جاهز");
  const progressMax = duration > 0 ? duration : 1;
  const progressVal = duration > 0 ? Math.min(duration, Math.max(0, currentTime)) : 0;

  const closeReaders = () => {
    setReadersOpen(false);
    setReaderQuery("");
  };

  return (
    <>
      <div
        className="mm-audio-dock"
        data-open={open ? "1" : "0"}
        data-mini={mini ? "1" : "0"}
        data-expanded={mini ? "0" : "1"}
        data-testid="mushaf-audio-dock"
        data-loading={loading ? "1" : "0"}
        role="region"
        aria-label="مشغّل التلاوة"
        aria-busy={loading}
      >
        <div className="mm-audio-dock__head">
          <div className="mm-audio-dock__meta">
            <button
              type="button"
              className="mm-audio-dock__reciter-btn"
              aria-label="اختيار القارئ"
              aria-haspopup="dialog"
              aria-expanded={readersOpen}
              onClick={() => setReadersOpen(true)}
            >
              <span className="mm-audio-dock__reciter-btn-name" data-testid="mushaf-dock-reciter">
                {reciterLabel}
              </span>
              {!mini && activeReciter?.qualityLabel ? (
                <span className="mm-audio-dock__reciter-btn-quality">{activeReciter.qualityLabel}</span>
              ) : null}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <p className="mm-audio-dock__verse" data-testid="mushaf-dock-verse">
              {verseLabel}
            </p>
          </div>
          <div className="mm-audio-dock__head-actions">
            {onMiniChange ? (
              <button
                type="button"
                className="mm-audio-dock__mini"
                aria-pressed={!mini}
                aria-label={mini ? "توسيع المشغل" : "طي المشغل"}
                data-testid="mushaf-dock-expand"
                onClick={() => onMiniChange(!mini)}
              >
                {mini ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                className="mm-audio-dock__close"
                onClick={onClose}
                aria-label="إغلاق المشغّل"
              >
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}
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
            data-testid="mushaf-dock-play"
          >
            {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
          </button>
          {mini ? null : (
            <button type="button" onClick={onNext} aria-label="الآية التالية">
              <SkipForward size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {mini ? null : (
          <>
            {onSpeed ? (
              <div className="mm-audio-dock__rates" role="group" aria-label="سرعة التلاوة">
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
            ) : null}

            <div className="mm-audio-dock__loop-row">
              <label className="mm-audio-dock__repeat">
                التكرار
                <select
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Number(e.target.value))}
                  aria-label="عدد التكرار"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value={0}>لا نهائي</option>
                </select>
              </label>
              <div className="mm-audio-dock__range" role="group" aria-label="من آية إلى آية">
                {(
                  [
                    ["ayah", "آية"],
                    ["passage", "مقطع"],
                    ["page", "صفحة"],
                    ["surah", "سورة"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={range === id}
                    onClick={() => setRange(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {onPlayRange ? (
              <div className="mm-audio-dock__hifz-bar">
                <button
                  type="button"
                  className={`mm-audio-dock__hifz-toggle${hifzOpen ? " is-open" : ""}`}
                  aria-expanded={hifzOpen}
                  data-testid="mushaf-dock-hifz"
                  onClick={() => setHifzOpen((v) => !v)}
                >
                  وضع الحفظ
                </button>
                <button
                  type="button"
                  className="mm-audio-dock__apply-range"
                  onClick={() => onPlayRange(range, repeatCount, hifzOpen ? 2000 : 0)}
                >
                  تطبيق النطاق
                </button>
              </div>
            ) : null}

            {hifzOpen ? (
              <p className="mm-audio-dock__hifz-hint" data-testid="mushaf-dock-hifz-panel">
                الحفظ: يكرّر النطاق المختار مع فاصل قصير بين التكرارات.
              </p>
            ) : null}
          </>
        )}

        <p className="mm-audio-dock__status" role="status">
          {statusLabel}
          {loading ? " · جاري تحميل التلاوة…" : ""}
          {audioError || playerState === "error"
            ? ` · ${audioError || "تعذر تشغيل التلاوة الآن"}`
            : ""}
        </p>
      </div>

      {readersOpen
        ? createPortal(
            <div
              className="mm-reciter-sheet quran-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="اختيار التلاوة"
              data-testid="mushaf-reciter-sheet"
            >
              <button
                type="button"
                className="mm-reciter-sheet__scrim quran-sheet__scrim"
                aria-label="إغلاق قائمة القراء"
                onClick={closeReaders}
              />
              <div className="mm-reciter-sheet__panel quran-sheet__panel">
                <div className="quran-sheet__handle" aria-hidden="true" />
                <div className="mm-reciter-sheet__head quran-sheet__head">
                  <h2 className="mm-reciter-sheet__title quran-sheet__title">اختيار التلاوة</h2>
                  <button
                    type="button"
                    className="mm-ayah-bar__close quran-sheet__close"
                    onClick={closeReaders}
                    aria-label="إغلاق"
                  >
                    <X size={18} aria-hidden="true" />
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
                <p className="mm-reciter-sheet__hint">{verseLabel || "التلاوات"}</p>
                <ul className="mm-reciter-sheet__list quran-reciter-list" role="listbox" aria-label="قائمة القراء">
                  {filtered.length === 0 ? (
                    <li className="mm-reciter-sheet__empty">لا نتائج — جرّب اسمًا آخر أو اختر القارئ من القائمة الكاملة</li>
                  ) : null}
                  {filtered.map((r) => {
                    const selected = r.id === reciterId;
                    return (
                      <li key={r.id} className={`quran-reciter-card${selected ? " is-selected" : ""}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`mm-reciter-sheet__pick quran-reciter-card__pick quran-row${selected ? " is-active" : ""}`}
                          onClick={() => {
                            onReciterChange(r.id);
                            closeReaders();
                          }}
                        >
                          {selected ? (
                            <Check size={16} aria-hidden="true" className="mm-reciter-sheet__check" />
                          ) : null}
                          <span className="mm-reciter-sheet__name">{r.nameAr}</span>
                          <span className="mm-reciter-sheet__meta">{r.qualityLabel}</span>
                        </button>
                        <button
                          type="button"
                          className="mm-reciter-sheet__play quran-reciter-card__play quran-btn quran-btn--icon"
                          aria-label={
                            selected && playing ? `إيقاف ${r.nameAr}` : `تشغيل ${r.nameAr}`
                          }
                          onClick={() => {
                            if (selected && playing) {
                              onTogglePlay();
                              closeReaders();
                              return;
                            }
                            if (onPlayReciter) onPlayReciter(r.id);
                            else {
                              onReciterChange(r.id);
                              onTogglePlay();
                            }
                            closeReaders();
                          }}
                        >
                          {selected && playing ? (
                            <Pause size={16} aria-hidden="true" />
                          ) : (
                            <Play size={16} aria-hidden="true" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
