import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  Copy,
  Headphones,
  Mic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { getReciter } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import { QURAN_DATA_FEATURES } from "@/lib/quran-data/flags";
import { isAiTarteelEnabled } from "@/lib/recitation-ai/feature-flag";
import {
  displayScholarLabel,
  findTafsirAudioForAyah,
  isTafsirAudioUiEnabled,
  loadTafsirAudioCatalog,
  playTafsirAudioClip,
  stopTafsirAudio,
  type TafsirAudioClip,
} from "@/lib/quran-data/tafsir-audio";
import { useVerifiedReciters } from "@/hooks/useVerifiedReciters";
import { parseVerseKey, type RecitationRange } from "./mushaf-page-for-ayah";

const TafsirTabPanel = lazy(() =>
  import("./TafsirTabPanel").then((m) => ({ default: m.TafsirTabPanel })),
);

type SheetHeight = "collapsed" | "half" | "full";
type SheetTab = "tafsir" | "tafsir-audio" | "tilawa" | "meanings" | "tajweed";

type Props = {
  verseKey: string;
  ayahPreview?: string;
  copyStatus: string | null;
  audioError: string | null;
  audioStatus?: string | null;
  playerState: PlayerState;
  reciterId: string;
  currentTime?: number;
  duration?: number;
  playbackRate?: number;
  onPlay: () => void;
  onTogglePlay: () => void;
  onPrevAyah?: () => void;
  onNextAyah?: () => void;
  onPlayRange: (range: RecitationRange, repeatCount: number) => void;
  onSeek: (seconds: number) => void;
  onSpeed: (rate: number) => void;
  onTafsir: () => void;
  onCopy: () => void;
  onShare: () => void;
  onShareImage?: () => void;
  onBookmark: () => void;
  onReciterChange: (id: string) => void;
  onPlayReciter?: (id: string) => void;
  onClose: () => void;
};

const HEIGHT_ATTR: Record<SheetHeight, string> = {
  collapsed: "120",
  half: "50",
  full: "90",
};

/**
 * شيت آية معزول (portal + z-index 9999):
 * مطوي ≈١٤٠px · نصف ≈٥٠dvh · كامل ≈٩٠dvh.
 * شبكة 2×2: تلاوة · تفسير · نسخ · حفظ — معاني/تجويد معطّلان عبر flags.
 */
export const AyahActionSheet = memo(function AyahActionSheet({
  verseKey,
  ayahPreview = "",
  copyStatus,
  audioError,
  audioStatus = null,
  playerState,
  reciterId,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
  onPlay,
  onTogglePlay,
  onPrevAyah,
  onNextAyah,
  onPlayRange,
  onSeek,
  onSpeed,
  onTafsir,
  onCopy,
  onShare,
  onShareImage,
  onBookmark,
  onReciterChange,
  onPlayReciter,
  onClose,
}: Props) {
  const [height, setHeight] = useState<SheetHeight>("collapsed");
  const [tab, setTab] = useState<SheetTab>("tilawa");
  const [, setTafsirTabAvailable] = useState(false);
  const [readersOpen, setReadersOpen] = useState(false);
  const [readerQuery, setReaderQuery] = useState("");
  const [tafsirAudioUiEnabled, setTafsirAudioUiEnabled] = useState(false);
  const [tafsirAudioClip, setTafsirAudioClip] = useState<TafsirAudioClip | null>(null);
  const [tafsirAudioLoading, setTafsirAudioLoading] = useState(false);
  const [tafsirAudioError, setTafsirAudioError] = useState<string | null>(null);
  const [tafsirAudioActiveClipId, setTafsirAudioActiveClipId] = useState<string | null>(null);
  const [range, setRange] = useState<RecitationRange>("ayah");
  const [repeatCount, setRepeatCount] = useState(1);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dragY = useRef<number | null>(null);
  const parsed = parseVerseKey(verseKey);
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const playing =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const loading = playerState === "loading" || playerState === "buffering";
  const playLabel =
    playerState === "playing"
      ? "إيقاف مؤقت"
      : playerState === "paused"
        ? "استئناف التلاوة"
        : loading
          ? "جاري التحميل…"
          : "ابدأ التلاوة";
  const audioStateLabel =
    audioError || playerState === "error"
      ? "حدث خطأ"
      : playerState === "playing"
        ? "يعمل الآن"
        : loading
          ? "جاري التحميل"
          : playerState === "paused"
            ? "متوقف"
            : "جاهز";
  const reciters = useVerifiedReciters();
  const filtered = useMemo(() => {
    const q = readerQuery.trim();
    if (!q) return reciters;
    return reciters.filter((r) => r.nameAr.includes(q) || r.nameEn.toLowerCase().includes(q.toLowerCase()));
  }, [readerQuery, reciters]);
  const currentReciter = getReciter(reciterId);
  const expanded = height !== "collapsed";
  const tafsirAudioAvailable = Boolean(tafsirAudioClip?.enabled && tafsirAudioClip?.streamUrl);
  const tafsirAudioPlaying = Boolean(tafsirAudioAvailable && playing && tafsirAudioActiveClipId === tafsirAudioClip?.id);
  // معاني/تجويد مفصّل: معطّل حتى اعتماد مصدر موثّق (flags)
  void QURAN_DATA_FEATURES;

  useEffect(() => {
    setReadersOpen(false);
    setTafsirAudioActiveClipId(null);
    setRange("ayah");
  }, [verseKey]);

  const openTab = useCallback((next: SheetTab) => {
    setTab(next);
    setHeight((h) => (h === "collapsed" ? "half" : h));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void isTafsirAudioUiEnabled().then((on) => {
      if (!cancelled) setTafsirAudioUiEnabled(on);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!tafsirAudioUiEnabled || !parsed) {
      setTafsirAudioClip(null);
      setTafsirAudioError(null);
      setTafsirAudioLoading(false);
      setTafsirAudioActiveClipId(null);
      return;
    }

    setTafsirAudioLoading(true);
    setTafsirAudioError(null);
    setTafsirAudioClip(null);

    void loadTafsirAudioCatalog()
      .then((clips) => {
        if (cancelled) return;
        const clip = findTafsirAudioForAyah(clips, parsed.surah, parsed.ayah);
        setTafsirAudioClip(clip);
        setTafsirAudioError(clip?.enabled && clip.streamUrl ? null : "التفسير الصوتي غير متاح لهذه الآية");
      })
      .catch(() => {
        if (cancelled) return;
        setTafsirAudioClip(null);
        setTafsirAudioError("تعذّر تحميل كتالوج التفسير الصوتي");
      })
      .finally(() => {
        if (cancelled) return;
        setTafsirAudioLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tafsirAudioUiEnabled, parsed?.surah, parsed?.ayah]);

  useEffect(() => {
    if (tab !== "tafsir-audio") setTafsirAudioActiveClipId(null);
  }, [tab]);

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
        if (height === "full") {
          setHeight("half");
          return;
        }
        if (height === "half") {
          setHeight("collapsed");
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
  }, [height, onClose, readersOpen]);

  const handlePlayClick = () => {
    setReadersOpen(false);
    if (playing || playerState === "paused") onTogglePlay();
    else onPlay();
  };

  const showTajweedTab = QURAN_DATA_FEATURES.ayahTajweedTab;

  const stepHeight = (dir: "up" | "down") => {
    if (dir === "up") {
      if (height === "collapsed") setHeight("half");
      else if (height === "half") setHeight("full");
      return;
    }
    if (height === "full") setHeight("half");
    else if (height === "half") setHeight("collapsed");
    else onClose();
  };

  const dur = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const pos = dur > 0 ? Math.min(dur, Math.max(0, currentTime)) : 0;

  return createPortal(
    <>
      <div
        className={`mm-ayah-bar ayah-action-sheet quran-sheet is-${height}${expanded ? " is-expanded" : " is-collapsed"}`}
        data-testid="mushaf-ayah-actions"
        data-sheet-mode={expanded ? "details" : "quick"}
        data-sheet-height={HEIGHT_ATTR[height]}
        data-opacity="1"
        style={{ opacity: 1 }}
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
              stepHeight("down");
              return;
            }
            if (dy < -48) stepHeight("up");
          }}
          onPointerCancel={() => {
            dragY.current = null;
          }}
        >
          <div className="mm-ayah-bar__handle" aria-hidden="true" />
          <div className="mm-ayah-bar__head">
            <div className="mm-ayah-bar__head-text">
              <p className="mm-ayah-bar__surah">{surahName || "سورة"}</p>
              <p className="mm-ayah-bar__title">آية {parsed?.ayah ?? "—"}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="mm-ayah-bar__close"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div
            className="quran-quick-bar quran-quick-bar--4 ayah-action-sheet__actions-grid"
            role="tablist"
            aria-label="إجراءات الآية"
          >
            <button
              type="button"
              role="tab"
              className="quran-tab"
              aria-selected={tab === "tilawa"}
              onClick={() => openTab("tilawa")}
            >
              <Headphones size={17} aria-hidden="true" />
              <span>تلاوة</span>
            </button>
            <button
              type="button"
              role="tab"
              className="quran-tab"
              aria-selected={tab === "tafsir"}
              onClick={() => openTab("tafsir")}
            >
              <BookOpen size={17} aria-hidden="true" />
              <span>تفسير</span>
            </button>
            <button
              type="button"
              role="tab"
              className="quran-tab quran-tab--utility"
              aria-selected={false}
              onClick={onCopy}
              aria-label="نسخ الآية"
            >
              <Copy size={17} aria-hidden="true" />
              <span>نسخ</span>
            </button>
            <button
              type="button"
              role="tab"
              className="quran-tab quran-tab--utility"
              aria-selected={false}
              onClick={onBookmark}
              aria-label="حفظ الآية"
            >
              <Bookmark size={17} aria-hidden="true" />
              <span>حفظ</span>
            </button>
            {showTajweedTab ? (
              <button
                type="button"
                role="tab"
                className="quran-tab"
                aria-selected={tab === "tajweed"}
                onClick={() => openTab("tajweed")}
              >
                <Sparkles size={17} aria-hidden="true" />
                <span>تجويد</span>
              </button>
            ) : null}
          </div>

          <div className="ayah-action-sheet__scroll-region">
            <div className="ayah-action-sheet__body">
            {parsed ? (
              <div className={tab === "tafsir" ? undefined : "sr-only"} aria-hidden={tab !== "tafsir"}>
                <Suspense fallback={<p className="mm-ayah-bar__status">جاري تحميل التفسير…</p>}>
                  <TafsirTabPanel
                    surah={parsed.surah}
                    ayah={parsed.ayah}
                    expanded={expanded}
                    onCopy={onCopy}
                    onShare={onShare}
                    onShareImage={onShareImage}
                    onBookmark={onBookmark}
                    onExpand={onTafsir}
                    onAvailabilityChange={setTafsirTabAvailable}
                  />
                </Suspense>
              </div>
            ) : null}

            {tab === "tafsir-audio" ? (
              <div className="ayah-action-sheet__tafsir-audio">
                {tafsirAudioLoading ? (
                  <p className="mm-ayah-bar__status">جاري تحميل التفسير الصوتي…</p>
                ) : tafsirAudioClip ? (
                  <>
                    <div className="ayah-action-sheet__primary" role="group" aria-label="تشغيل التفسير الصوتي">
                      <button
                        type="button"
                        onClick={() => {
                          if (!tafsirAudioClip) return;
                          // إيقاف إذا كان نفس المقطع يعمل
                          if (tafsirAudioPlaying) {
                            void stopTafsirAudio().finally(() => setTafsirAudioActiveClipId(null));
                            return;
                          }

                          setTafsirAudioError(null);
                          setTafsirAudioActiveClipId(tafsirAudioClip.id);
                          void playTafsirAudioClip(tafsirAudioClip, { ayah: parsed?.ayah, resume: true }).then(
                            (r) => {
                              if (!r.ok) {
                                setTafsirAudioActiveClipId(null);
                                setTafsirAudioError(r.reason || "تعذّر تشغيل التفسير الصوتي");
                              }
                            },
                          );
                        }}
                      >
                        {tafsirAudioPlaying ? (
                          <Pause size={18} aria-hidden="true" />
                        ) : (
                          <Play size={18} aria-hidden="true" />
                        )}
                        <span>{tafsirAudioPlaying ? "إيقاف" : "تشغيل"}</span>
                      </button>
                    </div>

                    {expanded ? (
                      <div className="ayah-action-sheet__tafsir-audio-meta" role="group" aria-label="بيانات المقطع">
                        <p className="mm-ayah-bar__status">
                          {tafsirAudioClip.titleAr} — {displayScholarLabel(tafsirAudioClip)}
                        </p>
                        {tafsirAudioError ? (
                          <p className="mm-ayah-bar__status mm-ayah-bar__status--err">{tafsirAudioError}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="mm-ayah-bar__status">{tafsirAudioError ?? "التفسير الصوتي غير متاح لهذه الآية."}</p>
                )}
              </div>
            ) : null}

            {tab === "tilawa" ? (
              <div className="ayah-action-sheet__tilawa">
                <button
                  type="button"
                  className={[
                    "ayah-action-sheet__play-hero",
                    playerState === "playing" || playerState === "paused" ? "is-active" : "",
                    loading ? "is-loading" : "",
                    audioError || playerState === "error" ? "is-error" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={handlePlayClick}
                  data-testid="mushaf-ayah-play"
                  aria-label={playLabel}
                >
                  {loading ? (
                    <span className="ayah-action-sheet__play-spinner" aria-hidden="true" />
                  ) : playerState === "playing" ? (
                    <Pause size={22} aria-hidden="true" />
                  ) : (
                    <Play size={22} aria-hidden="true" />
                  )}
                  <span>{playLabel}</span>
                </button>
                <div className="ayah-action-sheet__tilawa-reader" role="group" aria-label="القارئ المختار">
                  <p className="ayah-action-sheet__tilawa-reader-name" data-testid="mushaf-active-reciter">
                    {currentReciter?.nameAr ?? "اختر القارئ"}
                  </p>
                  <button
                    type="button"
                    className="ayah-action-sheet__tilawa-reader-btn"
                    onClick={() => setReadersOpen(true)}
                  >
                    <Headphones size={18} aria-hidden="true" />
                    <span>تغيير القارئ</span>
                  </button>
                </div>
                <p className="ayah-action-sheet__audio-state" role="status" data-testid="mushaf-audio-state">
                  {audioStateLabel}
                </p>
                {expanded ? (
                  <>
                    {isAiTarteelEnabled() && parsed ? (
                      <a
                        className="ayah-action-sheet__ai-tarteel"
                        href={`/quran/recitation-test-ai?surah=${parsed.surah}`}
                        data-testid="mushaf-ayah-ai-tarteel"
                      >
                        <Mic size={18} aria-hidden="true" />
                        <span>تلاوة بالذكاء</span>
                      </a>
                    ) : null}
                    <p className="ayah-action-sheet__range-label">النطاق</p>
                    <div className="ayah-action-sheet__range" role="group" aria-label="نطاق التلاوة">
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
                    <label className="ayah-action-sheet__seek">
                      <span className="sr-only">تقدّم التلاوة</span>
                      <input
                        type="range"
                        min={0}
                        max={dur || 1}
                        step={0.1}
                        value={pos}
                        disabled={dur <= 0}
                        onChange={(e) => onSeek(Number(e.target.value))}
                      />
                    </label>
                    <div className="ayah-action-sheet__rates" role="group" aria-label="سرعة التلاوة">
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
                    <label className="ayah-action-sheet__repeat">
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
                    <button
                      type="button"
                      className="ayah-action-sheet__apply-range"
                      onClick={() => onPlayRange(range, repeatCount)}
                    >
                      تشغيل النطاق
                    </button>
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
                  </>
                ) : null}
              </div>
            ) : null}

            {showTajweedTab && tab === "tajweed" ? (
              <div className="ayah-action-sheet__tajweed" data-testid="mushaf-tajweed-empty">
                <p className="mm-ayah-bar__status">
                  لا توجد أحكام تجويد متاحة لهذه الآية حاليًا.
                </p>
                <p className="mm-ayah-bar__status" data-testid="mushaf-ayah-see-also">
                  انظر أيضًا:{" "}
                  <a href="/quran-hub/tajweed">التجويد</a>
                  {" · "}
                  <a href="/quran-hub/qiraat">القراءات العشر</a>
                  {" · "}
                  <a href="/quran-hub/seven-ahruf">الأحرف السبعة</a>
                </p>
              </div>
            ) : null}

            {audioStatus && !audioError && playerState !== "error" ? (
              <p className="mm-ayah-bar__status" role="status" data-testid="mushaf-audio-status">
                {audioStatus}
              </p>
            ) : null}
            {audioError || playerState === "error" ? (
              <p className="mm-ayah-bar__status mm-ayah-bar__status--err" role="status" data-testid="mushaf-audio-error">
                {audioError || "تعذر تشغيل هذه الآية لهذا القارئ"}
              </p>
            ) : null}
            {copyStatus ? (
              <p className="mm-ayah-bar__status" role="status">
                {copyStatus}
              </p>
            ) : null}
            {loading && !audioError ? <p className="mm-ayah-bar__loading" role="status">جاري التحميل…</p> : null}
            </div>
          </div>
        </div>
      </div>

      {readersOpen
        ? createPortal(
            <div className="mm-reciter-sheet quran-sheet" role="dialog" aria-modal="true" aria-label="اختيار القارئ">
              <button
                type="button"
                className="mm-reciter-sheet__scrim quran-sheet__scrim"
                aria-label="إغلاق قائمة القراء"
                onClick={() => setReadersOpen(false)}
              />
              <div className="mm-reciter-sheet__panel quran-sheet__panel">
                <div className="quran-sheet__handle" aria-hidden="true" />
                <div className="mm-reciter-sheet__head quran-sheet__head">
                  <h2 className="mm-reciter-sheet__title quran-sheet__title">اختر القارئ</h2>
                  <button
                    type="button"
                    className="mm-ayah-bar__close quran-sheet__close"
                    onClick={() => setReadersOpen(false)}
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
                {ayahPreview ? (
                  <p className="mm-reciter-sheet__hint">
                    {surahName} · آية {parsed?.ayah ?? verseKey}
                  </p>
                ) : null}
                <ul className="mm-reciter-sheet__list quran-reciter-list" role="listbox" aria-label="قائمة القراء">
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
                            setReadersOpen(false);
                            setReaderQuery("");
                          }}
                        >
                          {selected ? <Check size={16} aria-hidden="true" className="mm-reciter-sheet__check" /> : null}
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
                              return;
                            }
                            if (onPlayReciter) onPlayReciter(r.id);
                            else {
                              onReciterChange(r.id);
                              onPlay();
                            }
                            setReadersOpen(false);
                            setReaderQuery("");
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
    </>,
    document.body,
  );
});

/** @deprecated استخدم QuranActionSheet — الاسم الموحّد */
export { AyahActionSheet as MushafAyahActions };
/** قائمة الآية السريعة (collapsed) + التفاصيل (half/full) */
export { AyahActionSheet as QuranActionSheet };
/** شيت التفاصيل — يُفعَّل تلقائيًا عند data-sheet-mode="details" */
export { AyahActionSheet as QuranDetailsSheet };
