import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  BookOpen,
  Copy,
  MoreHorizontal,
  Pause,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { getReciter } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import { DEFAULT_MUSHAF_TAFSIR_EDITION } from "@/lib/quran-data/tafsir-editions";
import { MUSHAF_RECITER_IDS } from "./MushafAudioDock";
import { parseVerseKey } from "./mushaf-page-for-ayah";

type Props = {
  verseKey: string;
  ayahPreview?: string;
  copyStatus: string | null;
  audioError: string | null;
  audioStatus?: string | null;
  playerState: PlayerState;
  reciterId: string;
  onPlay: () => void;
  onTogglePlay: () => void;
  onPrevAyah?: () => void;
  onNextAyah?: () => void;
  onTafsir: () => void;
  onCopy: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onReciterChange: (id: string) => void;
  onClose: () => void;
};

/**
 * شيت آية معزول (portal + z-index 9999):
 * مرحلة ١ = ٣٥٪ ملخص · مرحلة ٢ = ٨٥٪ تفسير كامل.
 * أربعة إجراءات أساسية + المزيد.
 */
export function AyahActionSheet({
  verseKey,
  ayahPreview = "",
  copyStatus,
  audioError,
  audioStatus = null,
  playerState,
  reciterId,
  onPlay,
  onTogglePlay,
  onPrevAyah,
  onNextAyah,
  onTafsir,
  onCopy,
  onShare,
  onBookmark,
  onReciterChange,
  onClose,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [readersOpen, setReadersOpen] = useState(false);
  const [readerQuery, setReaderQuery] = useState("");
  const [tafsirPreview, setTafsirPreview] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dragY = useRef<number | null>(null);
  const parsed = parseVerseKey(verseKey);
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed ? `${surahName} - آية ${toArabicDigits(parsed.ayah)}` : verseKey;
  const playing =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const playLabel = playing ? "إيقاف" : playerState === "paused" ? "استئناف" : "استماع";
  const reciters = useMemo(() => MUSHAF_RECITER_IDS.map((id) => getReciter(id)), []);
  const filtered = useMemo(() => {
    const q = readerQuery.trim();
    if (!q) return reciters;
    return reciters.filter((r) => r.nameAr.includes(q) || r.nameEn.toLowerCase().includes(q.toLowerCase()));
  }, [readerQuery, reciters]);
  const currentReciter = getReciter(reciterId);

  useEffect(() => {
    setExpanded(false);
    setMoreOpen(false);
    setReadersOpen(false);
  }, [verseKey]);

  useEffect(() => {
    if (!parsed) {
      setTafsirPreview(null);
      return;
    }
    const ac = new AbortController();
    setTafsirLoading(true);
    fetchMushafAyahTafsir(parsed.surah, parsed.ayah, DEFAULT_MUSHAF_TAFSIR_EDITION, ac.signal)
      .then((res) => {
        if (!ac.signal.aborted) setTafsirPreview(res?.text?.trim() || null);
      })
      .catch((err) => {
        console.warn("[AyahActionSheet] tafsir preview failed", err);
        if (!ac.signal.aborted) setTafsirPreview(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setTafsirLoading(false);
      });
    return () => ac.abort();
  }, [parsed?.surah, parsed?.ayah]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (readersOpen) {
          setReadersOpen(false);
          return;
        }
        if (expanded) {
          setExpanded(false);
          return;
        }
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded, onClose, readersOpen]);

  const handlePlayClick = () => {
    setReadersOpen(false);
    if (playing || playerState === "paused") onTogglePlay();
    else onPlay();
  };

  const previewLines = (tafsirPreview || "").split(/\n+/).filter(Boolean).slice(0, 2).join("\n");

  return createPortal(
    <>
      <div
        className={`mm-ayah-bar ayah-action-sheet${expanded ? " is-expanded" : " is-collapsed"}`}
        data-testid="mushaf-ayah-actions"
        data-sheet-height={expanded ? "85" : "35"}
        role="dialog"
        aria-modal="true"
        aria-label="خيارات الآية"
      >
        <button
          type="button"
          className="mm-ayah-bar__dismiss"
          aria-label="إغلاق شريط الآية"
          onClick={onClose}
        />
        <div
          ref={panelRef}
          className="mm-ayah-bar__panel"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button, input, select, a, textarea")) {
              dragY.current = null;
              return;
            }
            dragY.current = e.clientY;
          }}
          onPointerUp={(e) => {
            const start = dragY.current;
            dragY.current = null;
            if (start == null) return;
            const dy = e.clientY - start;
            if (dy > 72) {
              if (expanded) setExpanded(false);
              else onClose();
              return;
            }
            if (dy < -48) setExpanded(true);
          }}
          onPointerCancel={() => {
            dragY.current = null;
          }}
        >
          <div className="mm-ayah-bar__handle" aria-hidden="true" />
          <div className="mm-ayah-bar__head">
            <div className="mm-ayah-bar__head-text">
              <p className="mm-ayah-bar__title">{title}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="mm-ayah-bar__close"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="ayah-action-sheet__primary" role="group" aria-label="إجراءات أساسية">
            <button type="button" onClick={handlePlayClick} data-testid="mushaf-ayah-play">
              {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              <span>{playLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(true);
              }}
            >
              <BookOpen size={18} aria-hidden="true" />
              <span>تفسير</span>
            </button>
            <button type="button" onClick={onCopy}>
              <Copy size={18} aria-hidden="true" />
              <span>نسخ</span>
            </button>
            <button type="button" onClick={onShare}>
              <Share2 size={18} aria-hidden="true" />
              <span>مشاركة</span>
            </button>
            <button type="button" onClick={onBookmark}>
              <BookMarked size={18} aria-hidden="true" />
              <span>إشارة</span>
            </button>
          </div>

          <button
            type="button"
            className="ayah-action-sheet__more-btn"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreHorizontal size={18} aria-hidden="true" />
            <span>المزيد</span>
          </button>

          {moreOpen ? (
            <div className="ayah-action-sheet__more" role="group" aria-label="المزيد">
              <button type="button" onClick={() => setReadersOpen(true)}>
                القارئ · {currentReciter.nameAr}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpanded(true);
                  onTafsir();
                }}
              >
                ترجمة / تفسير موسّع
              </button>
            </div>
          ) : null}

          <div className="ayah-action-sheet__tafsir">
            <p className="ayah-action-sheet__tafsir-source">تفسير الميسّر</p>
            {tafsirLoading ? (
              <p className="mm-ayah-bar__status">جاري تحميل التفسير…</p>
            ) : previewLines ? (
              <p className="ayah-action-sheet__preview" dir="rtl" lang="ar">
                {expanded ? tafsirPreview : previewLines}
              </p>
            ) : (
              <p className="mm-ayah-bar__status">لا يتوفر مقتطف تفسير حالياً.</p>
            )}
            {!expanded ? (
              <button type="button" className="ayah-action-sheet__expand" onClick={() => setExpanded(true)}>
                اسحب للأعلى أو اضغط للتوسيع
              </button>
            ) : null}
          </div>

          {audioStatus && !audioError && playerState !== "error" ? (
            <p className="mm-ayah-bar__status" role="status" data-testid="mushaf-audio-status">
              {audioStatus}
            </p>
          ) : null}
          {audioError || playerState === "error" ? (
            <p className="mm-ayah-bar__status mm-ayah-bar__status--err" role="status" data-testid="mushaf-audio-error">
              {audioError || "تعذر تحميل التلاوة، أعد المحاولة"}
            </p>
          ) : null}
          {copyStatus ? (
            <p className="mm-ayah-bar__status" role="status">
              {copyStatus}
            </p>
          ) : null}
          {loading ? <p className="mm-ayah-bar__loading">جاري تحميل التلاوة...</p> : null}
          {ayahPreview && expanded ? (
            <p className="ayah-action-sheet__ayah-preview" dir="rtl" lang="ar">
              {ayahPreview}
            </p>
          ) : null}

          <div className="mm-ayah-bar__transport" role="group" aria-label="تنقل الآيات">
            <button
              type="button"
              className="mm-ayah-bar__skip"
              onClick={() => onPrevAyah?.()}
              aria-label="الآية السابقة"
              disabled={!onPrevAyah}
            >
              <SkipBack size={18} aria-hidden="true" />
              <span>السابقة</span>
            </button>
            <button
              type="button"
              className="mm-ayah-bar__skip"
              onClick={() => onNextAyah?.()}
              aria-label="الآية التالية"
              disabled={!onNextAyah}
            >
              <SkipForward size={18} aria-hidden="true" />
              <span>التالية</span>
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
              </div>
            </div>,
            document.body,
          )
        : null}
    </>,
    document.body,
  );
}

/** توافق البوابات القديمة */
export { AyahActionSheet as MushafAyahActions };

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
