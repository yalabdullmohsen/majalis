import { useEffect, useMemo, useState } from "react";
import { BookOpen, Copy, Mic2, Pause, Play, RotateCcw, Share2, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { getReciter } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  MUSHAF_TAFSIR_EDITIONS,
} from "@/lib/quran-data/tafsir-editions";
import { MUSHAF_RECITER_IDS } from "./MushafAudioDock";
import { parseVerseKey } from "./mushaf-page-for-ayah";

const EDITION_TABS: Array<{ id: string; label: string }> = [
  { id: "ar-tafsir-muyassar", label: "الميسر" },
  { id: "ar-tafseer-al-saddi", label: "السعدي" },
  { id: "ar-tafsir-ibn-kathir", label: "ابن كثير" },
];

const PRIMARY_EDITIONS = MUSHAF_TAFSIR_EDITIONS.filter((e) =>
  EDITION_TABS.some((t) => t.id === e.id),
);

type SheetView = "menu" | "readers" | "tafsir";

type Props = {
  verseKey: string;
  ayahPreview?: string;
  copyStatus: string | null;
  audioError: string | null;
  playerState: PlayerState;
  reciterId: string;
  onPlay: () => void;
  onTogglePlay: () => void;
  onCopy: () => void;
  onShare: () => void;
  onReciterChange: (id: string) => void;
  onClose: () => void;
};

/** شيت سفلي ≤50vh: تشغيل / قارئ / تفسير / نسخ / مشاركة — بلا طبقة سوداء تغطي المصحف. */
export function MushafAyahActions({
  verseKey,
  ayahPreview = "",
  copyStatus,
  audioError,
  playerState,
  reciterId,
  onPlay,
  onTogglePlay,
  onCopy,
  onShare,
  onReciterChange,
  onClose,
}: Props) {
  const [view, setView] = useState<SheetView>("menu");
  const [readerQuery, setReaderQuery] = useState("");
  const [editionId, setEditionId] = useState(DEFAULT_MUSHAF_TAFSIR_EDITION);
  const [tafsirRetry, setTafsirRetry] = useState(0);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);

  const parsed = parseVerseKey(verseKey);
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed ? `${surahName} · آية ${parsed.ayah}` : verseKey;
  const playing =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const errored = Boolean(audioError) || playerState === "error";
  const reciters = useMemo(() => MUSHAF_RECITER_IDS.map((id) => getReciter(id)), []);
  const filtered = useMemo(() => {
    const q = readerQuery.trim();
    if (!q) return reciters;
    return reciters.filter(
      (r) => r.nameAr.includes(q) || r.nameEn.toLowerCase().includes(q.toLowerCase()),
    );
  }, [readerQuery, reciters]);
  const currentReciter = getReciter(reciterId);

  useEffect(() => {
    setView("menu");
    setReaderQuery("");
  }, [verseKey]);

  useEffect(() => {
    if (view !== "tafsir" || !parsed) {
      return;
    }
    const ac = new AbortController();
    setTafsirLoading(true);
    setTafsirError(null);
    setTafsirText(null);
    fetchMushafAyahTafsir(parsed.surah, parsed.ayah, editionId, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        if (!res?.text) {
          setTafsirError("تعذّر جلب التفسير. تحقّق من الاتصال ثم أعد المحاولة.");
          setTafsirText(null);
        } else {
          setTafsirText(res.text);
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) setTafsirError("تعذّر جلب التفسير. حاول لاحقًا.");
      })
      .finally(() => {
        if (!ac.signal.aborted) setTafsirLoading(false);
      });
    return () => ac.abort();
  }, [view, parsed?.surah, parsed?.ayah, editionId, tafsirRetry]);

  return createPortal(
    <div className="mm-ayah-bar" data-testid="mushaf-ayah-actions" role="region" aria-label="خيارات الآية">
      <button
        type="button"
        className="mm-ayah-bar__dismiss"
        aria-label="إغلاق شريط الآية"
        onClick={onClose}
      />
      <div className="mm-ayah-bar__panel" data-view={view}>
        <div className="mm-ayah-bar__head">
          <p className="mm-ayah-bar__title">{title}</p>
          <div className="mm-ayah-bar__head-actions">
            {view !== "menu" ? (
              <button
                type="button"
                className="mm-ayah-bar__back"
                onClick={() => setView("menu")}
              >
                رجوع
              </button>
            ) : null}
            <button type="button" className="mm-ayah-bar__close" onClick={onClose} aria-label="إغلاق">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {view === "menu" ? (
          <>
            <div className="mm-ayah-bar__transport" role="group" aria-label="تحكم التلاوة">
              <button
                type="button"
                className="mm-ayah-bar__play-main"
                onClick={() => {
                  if (playing || playerState === "paused") onTogglePlay();
                  else onPlay();
                }}
                aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
              >
                {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
              </button>
              <span className="mm-ayah-bar__reciter-name">{currentReciter.nameAr}</span>
              {loading && !errored ? <span className="mm-ayah-bar__loading">جاري التحميل…</span> : null}
            </div>

            {errored ? (
              <div className="mm-ayah-bar__error-row" role="status">
                <p className="mm-ayah-bar__status mm-ayah-bar__status--err">
                  {audioError || "تعذّر تشغيل التلاوة."}
                </p>
                <button type="button" className="mm-ayah-bar__retry" onClick={onPlay}>
                  <RotateCcw size={14} aria-hidden="true" />
                  إعادة المحاولة
                </button>
              </div>
            ) : null}
            {copyStatus ? (
              <p className="mm-ayah-bar__status" role="status">
                {copyStatus}
              </p>
            ) : null}

            <div className="mm-ayah-bar__actions">
              <button type="button" onClick={onPlay}>
                <Play size={16} aria-hidden="true" />
                <span>تشغيل</span>
              </button>
              <button type="button" aria-expanded={false} onClick={() => setView("readers")}>
                <Mic2 size={16} aria-hidden="true" />
                <span>القارئ</span>
              </button>
              <button type="button" onClick={() => setView("tafsir")}>
                <BookOpen size={16} aria-hidden="true" />
                <span>التفسير</span>
              </button>
              <button type="button" onClick={onCopy}>
                <Copy size={16} aria-hidden="true" />
                <span>نسخ</span>
              </button>
              <button type="button" onClick={onShare}>
                <Share2 size={16} aria-hidden="true" />
                <span>مشاركة</span>
              </button>
              <button type="button" onClick={onClose}>
                <X size={16} aria-hidden="true" />
                <span>إغلاق</span>
              </button>
            </div>
          </>
        ) : null}

        {view === "readers" ? (
          <div className="mm-ayah-bar__readers">
            <label className="mm-reciter-sheet__search">
              <span className="sr-only">بحث عن قارئ</span>
              <input
                type="search"
                value={readerQuery}
                onChange={(e) => setReaderQuery(e.target.value)}
                placeholder="ابحث عن قارئ…"
              />
            </label>
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
                      setView("menu");
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
        ) : null}

        {view === "tafsir" ? (
          <div className="mm-tafsir mm-tafsir--embedded" data-testid="mushaf-tafsir-sheet">
            {ayahPreview ? (
              <p className="mm-tafsir__ayah" dir="rtl" lang="ar">
                {ayahPreview}
              </p>
            ) : null}
            <div className="mm-tafsir__editions" role="tablist" aria-label="مصدر التفسير">
              {PRIMARY_EDITIONS.map((ed) => {
                const tab = EDITION_TABS.find((t) => t.id === ed.id);
                return (
                  <button
                    key={ed.id}
                    type="button"
                    role="tab"
                    aria-selected={editionId === ed.id}
                    className={editionId === ed.id ? "is-active" : undefined}
                    onClick={() => setEditionId(ed.id)}
                  >
                    {tab?.label ?? ed.label}
                  </button>
                );
              })}
            </div>
            {tafsirLoading ? <p className="mm-tafsir__status">جاري تحميل التفسير…</p> : null}
            {!tafsirLoading && tafsirError ? (
              <div className="mm-ayah-bar__error-row" role="status">
                <p className="mm-tafsir__status mm-tafsir__status--err">{tafsirError}</p>
                <button
                  type="button"
                  className="mm-ayah-bar__retry"
                  onClick={() => setTafsirRetry((n) => n + 1)}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  إعادة
                </button>
              </div>
            ) : null}
            {!tafsirLoading && tafsirText ? (
              <div className="mm-tafsir__body" dir="rtl" lang="ar">
                {tafsirText}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
