import { useMemo, useRef, useState } from "react";
import { BookOpen, Mic2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { getReciter } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import { MUSHAF_RECITER_IDS } from "./MushafAudioDock";
import { parseVerseKey } from "./mushaf-page-for-ayah";

type TabId = "tilawa" | "tafsir" | "copy" | "share" | "save";

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

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "tilawa", label: "التلاوة" },
  { id: "tafsir", label: "التفسير" },
  { id: "copy", label: "نسخ" },
  { id: "share", label: "مشاركة" },
  { id: "save", label: "حفظ" },
];

/**
 * Bottom sheet خارج نص المصحف — تبويبات التلاوة/التفسير/نسخ/مشاركة/حفظ.
 * لا يغيّر الصفحة ولا يشغّل صوتًا تلقائيًا.
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
  const [tab, setTab] = useState<TabId>("tilawa");
  const [readersOpen, setReadersOpen] = useState(false);
  const [readerQuery, setReaderQuery] = useState("");
  const dragY = useRef<number | null>(null);
  const parsed = parseVerseKey(verseKey);
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed ? `${surahName} · آية ${parsed.ayah}` : verseKey;
  const playing =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const playLabel = playing ? "إيقاف" : playerState === "paused" ? "استئناف" : "تشغيل";
  const reciters = useMemo(() => MUSHAF_RECITER_IDS.map((id) => getReciter(id)), []);
  const filtered = useMemo(() => {
    const q = readerQuery.trim();
    if (!q) return reciters;
    return reciters.filter((r) => r.nameAr.includes(q) || r.nameEn.toLowerCase().includes(q.toLowerCase()));
  }, [readerQuery, reciters]);
  const currentReciter = getReciter(reciterId);

  const handlePlayClick = () => {
    setReadersOpen(false);
    if (playing || playerState === "paused") onTogglePlay();
    else onPlay();
  };

  const selectTab = (id: TabId) => {
    setTab(id);
    if (id === "tafsir") {
      setReadersOpen(false);
      onTafsir();
    } else if (id === "copy") {
      setReadersOpen(false);
      onCopy();
    } else if (id === "share") {
      setReadersOpen(false);
      onShare();
    } else if (id === "save") {
      setReadersOpen(false);
      onBookmark();
    }
  };

  return createPortal(
    <>
      <div
        className="mm-ayah-bar ayah-action-sheet"
        data-testid="mushaf-ayah-actions"
        role="region"
        aria-label="خيارات الآية"
      >
        <button
          type="button"
          className="mm-ayah-bar__dismiss"
          aria-label="إغلاق شريط الآية"
          onClick={onClose}
        />
        <div
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
            if (e.clientY - start > 72) onClose();
          }}
          onPointerCancel={() => {
            dragY.current = null;
          }}
        >
          <div className="mm-ayah-bar__handle" aria-hidden="true" />
          <div className="mm-ayah-bar__head">
            <p className="mm-ayah-bar__title">{title}</p>
            <button type="button" className="mm-ayah-bar__close" onClick={onClose} aria-label="إغلاق">
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="ayah-action-sheet__tabs" role="tablist" aria-label="إجراءات الآية">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? "is-active" : undefined}
                onClick={() => selectTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "tilawa" ? (
            <>
              <div className="mm-ayah-bar__transport" role="group" aria-label="تحكم التلاوة">
                <button
                  type="button"
                  className="mm-ayah-bar__skip"
                  onClick={() => onPrevAyah?.()}
                  aria-label="الآية السابقة"
                  disabled={!onPrevAyah}
                >
                  <SkipBack size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="mm-ayah-bar__play-main"
                  onClick={handlePlayClick}
                  aria-label={playLabel}
                  data-testid="mushaf-ayah-play"
                >
                  {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  className="mm-ayah-bar__skip"
                  onClick={() => onNextAyah?.()}
                  aria-label="الآية التالية"
                  disabled={!onNextAyah}
                >
                  <SkipForward size={18} aria-hidden="true" />
                </button>
                <span className="mm-ayah-bar__reciter-name">{currentReciter.nameAr}</span>
                {loading ? <span className="mm-ayah-bar__loading">جاري تحميل التلاوة...</span> : null}
                {!loading && playerState === "playing" ? (
                  <span className="mm-ayah-bar__loading">يتم تشغيل التلاوة</span>
                ) : null}
              </div>

              <div className="mm-ayah-bar__actions">
                <button type="button" onClick={handlePlayClick} data-testid="mushaf-ayah-play-inline">
                  {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                  <span>{playLabel}</span>
                </button>
                <button type="button" aria-expanded={readersOpen} onClick={() => setReadersOpen(true)}>
                  <Mic2 size={16} aria-hidden="true" />
                  <span>القارئ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReadersOpen(false);
                    onPlay();
                  }}
                >
                  <Play size={16} aria-hidden="true" />
                  <span>من هذه الآية</span>
                </button>
              </div>
            </>
          ) : null}

          {tab === "tafsir" ? (
            <div className="mm-ayah-bar__actions">
              <button
                type="button"
                onClick={() => {
                  setReadersOpen(false);
                  onTafsir();
                }}
              >
                <BookOpen size={16} aria-hidden="true" />
                <span>فتح التفسير</span>
              </button>
            </div>
          ) : null}

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

          {ayahPreview && tab === "tilawa" ? (
            <p className="ayah-action-sheet__preview" dir="rtl" lang="ar">
              {ayahPreview.slice(0, 120)}
              {ayahPreview.length > 120 ? "…" : ""}
            </p>
          ) : null}
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

/** توافق البوابات القديمة */
export { AyahActionSheet as MushafAyahActions };
