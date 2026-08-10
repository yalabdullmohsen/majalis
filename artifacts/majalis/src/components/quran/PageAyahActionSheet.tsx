import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import {
  Copy,
  Check,
  Bookmark,
  StickyNote,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Flag,
  BookOpen,
  Mic,
  Mic2,
  Repeat,
  Gauge,
  Type,
  Languages,
  Share2,
  MoreHorizontal,
  Save,
  Timer,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  copyAyahText,
  copyAyahTextPlain,
  copyAyahWithTafsir,
  shareAyahAsText,
  shareAyahWithTafsir,
} from "@/lib/share-ayah";
import { addBookmark, removeBookmark, isBookmarked, getNote, saveNote } from "@/lib/quran-personal";
import { setMushafUnsavedWork } from "@/lib/mushaf-unsaved";
import {
  VALID_PLAYBACK_RATES,
  getReciter,
  ensureValidReciterPreference,
} from "@/lib/quran-audio";
import {
  SLEEP_TIMER_OPTIONS,
  sleepTimerLabelAr,
  type SleepTimerOption,
} from "@/lib/quran-sleep-timer";
import {
  MushafReaderOptionsSheet,
  type MushafReaderOptionsSection,
} from "@/components/quran/MushafReaderOptionsSheet";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { afterNextPaint, yieldToMain } from "@/lib/yield-to-main";
import { prewarmTextApis } from "@/lib/resource-prewarm";
import { toArabicDigits } from "@/lib/utils";
import {
  MUSHAF_TRANSLATION_EDITIONS,
  TAFSIR_FONT_SCALES,
  DEFAULT_EXTENDED_TAFSIR_EDITION,
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  fetchMushafAyahTafsir,
  fetchMushafAyahTranslation,
  getMushafTafsirEdition,
  getMushafTranslationEdition,
  readStoredTafsirEdition,
  persistTafsirEdition,
  readStoredTafsirFontScale,
  persistTafsirFontScale,
  readStoredTranslationEnabled,
  persistTranslationEnabled,
  readStoredTranslationEdition,
  persistTranslationEdition,
  type TafsirFontScale,
} from "@/features/mushaf";
import "@/styles/components/ayah-action-sheet.css";

const TafsirAudioSheetLazy = lazy(() => import("@/components/quran/TafsirAudioSheet"));

/** مختصر ظاهر مباشرة: نحو سطرين إلى أربعة */
const TAFSIR_COLLAPSE_CHARS = 280;
const TAFSIR_BRIEF_MAX_PARAS = 4;

type PanelMode = "none" | "tafsir" | "audio";

function tafsirParagraphs(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  const byBreak = cleaned.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  if (byBreak.length > 1) return byBreak;
  const soft = cleaned.split(/(?<=[.؟!。])\s+/).map((p) => p.trim()).filter(Boolean);
  return soft.length > 1 ? soft : [cleaned];
}

type Props = {
  surahNum: number;
  surahName: string;
  ayahNum: number;
  ayahText: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  canPlay?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  reciterId?: string;
  onSetReciter?: (id: string) => void;
  playbackRate?: number;
  onSetPlaybackRate?: (rate: number) => void;
  repeatOn?: boolean;
  onToggleRepeat?: () => void;
  sleepTimerOption?: SleepTimerOption;
  onSetSleepTimer?: (option: SleepTimerOption) => void;
};

export function PageAyahActionSheet({
  surahNum,
  surahName,
  ayahNum,
  ayahText,
  isPlaying,
  onTogglePlay,
  canPlay = true,
  onPrev,
  onNext,
  onClose,
  reciterId,
  onSetReciter,
  playbackRate,
  onSetPlaybackRate,
  repeatOn,
  onToggleRepeat,
  sleepTimerOption = "off",
  onSetSleepTimer,
}: Props) {
  const [, navigate] = useLocation();
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(surahNum, ayahNum));
  const [copiedKind, setCopiedKind] = useState<"full" | "plain" | null>(null);
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("tafsir");
  const [moreOpen, setMoreOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => getNote(surahNum, ayahNum));
  const [noteSaved, setNoteSaved] = useState(false);
  const [reciterSheetOpen, setReciterSheetOpen] = useState(false);
  const [optionsFocus, setOptionsFocus] = useState<MushafReaderOptionsSection>("reciters");
  const [speedPickerOpen, setSpeedPickerOpen] = useState(false);
  const [sleepPickerOpen, setSleepPickerOpen] = useState(false);
  const [editionMenuOpen, setEditionMenuOpen] = useState(false);
  const [translationMenuOpen, setTranslationMenuOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [tafsirRetryKey, setTafsirRetryKey] = useState(0);
  const [tafsirEdition, setTafsirEdition] = useState(readStoredTafsirEdition);
  const [fontScale, setFontScale] = useState<TafsirFontScale>(readStoredTafsirFontScale);
  const [tafsirExpanded, setTafsirExpanded] = useState(false);
  const [tafsirAudioMsg, setTafsirAudioMsg] = useState<string | null>(null);
  const [tafsirAudioAvailable, setTafsirAudioAvailable] = useState(false);
  const [tafsirAudioSheetOpen, setTafsirAudioSheetOpen] = useState(false);
  const [ayahPeople, setAyahPeople] = useState<{ slug: string; nameAr: string }[]>([]);
  const [showTranslation, setShowTranslation] = useState(readStoredTranslationEnabled);
  const [translationEdition, setTranslationEdition] = useState(readStoredTranslationEdition);
  const [translationText, setTranslationText] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const editionMenuRef = useRef<HTMLDivElement | null>(null);
  const translationMenuRef = useRef<HTMLDivElement | null>(null);

  const showTafsirPanel = panelMode === "tafsir";
  const showAudioTools = panelMode === "audio";

  useEffect(() => {
    const saved = getNote(surahNum, ayahNum);
    setMushafUnsavedWork(noteText !== saved);
  }, [noteText, surahNum, ayahNum]);

  useEffect(() => {
    setBookmarked(isBookmarked(surahNum, ayahNum));
    setNoteText(getNote(surahNum, ayahNum));
    setMushafUnsavedWork(false);
    setCopiedKind(null);
    setCopyMenuOpen(false);
    setNoteOpen(false);
    setNoteSaved(false);
    setEditionMenuOpen(false);
    setTranslationMenuOpen(false);
    setReciterSheetOpen(false);
    setSleepPickerOpen(false);
    setSpeedPickerOpen(false);
    setMoreOpen(false);
    setTafsirText(null);
    setTafsirError(false);
    setTafsirExpanded(false);
    setTafsirAudioMsg(null);
    setTafsirAudioAvailable(false);
    setAyahPeople([]);
    setTranslationText(null);
    setTranslationError(false);

    let cancelled = false;
    void (async () => {
      try {
        const { loadTafsirAudioCatalog, findTafsirAudioForAyah } = await import(
          "@/features/mushaf/tafsir-audio"
        );
        const clips = await loadTafsirAudioCatalog();
        if (!cancelled) {
          setTafsirAudioAvailable(Boolean(findTafsirAudioForAyah(clips, surahNum, ayahNum)));
        }
      } catch {
        if (!cancelled) setTafsirAudioAvailable(false);
      }
      try {
        const { loadQuranPeople, peopleForAyah } = await import("@/features/quran-people");
        const all = await loadQuranPeople();
        if (!cancelled) {
          setAyahPeople(
            peopleForAyah(all, surahNum, ayahNum).map((p) => ({
              slug: p.slug,
              nameAr: p.nameAr,
            })),
          );
        }
      } catch {
        if (!cancelled) setAyahPeople([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surahNum, ayahNum]);

  const handleListenTafsirAudio = () => {
    setTafsirAudioSheetOpen(true);
  };

  useEffect(() => {
    if (!showTafsirPanel) return;
    const ac = new AbortController();
    let cancelled = false;

    const load = async () => {
      setTafsirLoading(true);
      setTafsirError(false);
      try {
        await afterNextPaint();
        prewarmTextApis();
        const row = await fetchMushafAyahTafsir(surahNum, ayahNum, tafsirEdition, ac.signal);
        await yieldToMain();
        if (cancelled) return;
        setTafsirText(row?.text ?? null);
        if (!row?.text) setTafsirError(true);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setTafsirError(true);
        setTafsirText(null);
      } finally {
        if (!cancelled) setTafsirLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [surahNum, ayahNum, tafsirEdition, showTafsirPanel, tafsirRetryKey]);

  useEffect(() => {
    if (!showTafsirPanel || !showTranslation) {
      setTranslationText(null);
      setTranslationError(false);
      setTranslationLoading(false);
      return;
    }

    const ac = new AbortController();
    let cancelled = false;

    const load = async () => {
      setTranslationLoading(true);
      setTranslationError(false);
      try {
        const row = await fetchMushafAyahTranslation(
          surahNum,
          ayahNum,
          translationEdition,
          ac.signal,
        );
        if (cancelled) return;
        setTranslationText(row?.text ?? null);
        if (!row?.text) setTranslationError(true);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setTranslationError(true);
        setTranslationText(null);
      } finally {
        if (!cancelled) setTranslationLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [surahNum, ayahNum, translationEdition, showTranslation, showTafsirPanel]);

  const handleSelectEdition = (id: string) => {
    setTafsirEdition(id);
    persistTafsirEdition(id);
    setEditionMenuOpen(false);
    setTafsirExpanded(false);
  };

  const handleSelectTranslation = (id: string) => {
    setTranslationEdition(id);
    persistTranslationEdition(id);
    setTranslationMenuOpen(false);
  };

  const cycleFontScale = () => {
    const idx = TAFSIR_FONT_SCALES.indexOf(fontScale);
    const next = TAFSIR_FONT_SCALES[(idx + 1) % TAFSIR_FONT_SCALES.length]!;
    setFontScale(next);
    persistTafsirFontScale(next);
  };

  const toggleTranslation = () => {
    const next = !showTranslation;
    setShowTranslation(next);
    persistTranslationEnabled(next);
    setTranslationMenuOpen(false);
  };

  const currentEditionMeta = getMushafTafsirEdition(tafsirEdition);
  const currentTranslationMeta = getMushafTranslationEdition(translationEdition);
  const paragraphs = useMemo(
    () => (tafsirText ? tafsirParagraphs(tafsirText) : []),
    [tafsirText],
  );
  const isBriefEdition = Boolean(currentEditionMeta?.brief);
  const tafsirNeedsCollapse =
    isBriefEdition &&
    !tafsirExpanded &&
    ((tafsirText?.length ?? 0) > TAFSIR_COLLAPSE_CHARS || paragraphs.length > TAFSIR_BRIEF_MAX_PARAS);
  const visibleParagraphs =
    tafsirNeedsCollapse
      ? (() => {
          let count = 0;
          const out: string[] = [];
          for (const p of paragraphs) {
            out.push(p);
            count += p.length;
            if (out.length >= TAFSIR_BRIEF_MAX_PARAS || count >= TAFSIR_COLLAPSE_CHARS) break;
          }
          return out.length > 0 ? out : paragraphs.slice(0, 1);
        })()
      : paragraphs;

  const openExtendedTafsir = () => {
    if (isBriefEdition) {
      setTafsirEdition(DEFAULT_EXTENDED_TAFSIR_EDITION);
      persistTafsirEdition(DEFAULT_EXTENDED_TAFSIR_EDITION);
      setEditionMenuOpen(false);
    }
    setTafsirExpanded(true);
  };

  const returnToBriefTafsir = () => {
    setTafsirEdition(DEFAULT_MUSHAF_TAFSIR_EDITION);
    persistTafsirEdition(DEFAULT_MUSHAF_TAFSIR_EDITION);
    setEditionMenuOpen(false);
    setTafsirExpanded(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editionMenuOpen) setEditionMenuOpen(false);
        else if (translationMenuOpen) setTranslationMenuOpen(false);
        else if (copyMenuOpen) setCopyMenuOpen(false);
        else if (moreOpen) setMoreOpen(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, editionMenuOpen, translationMenuOpen, copyMenuOpen, moreOpen]);

  useEffect(() => {
    if (!editionMenuOpen && !translationMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (editionMenuOpen && editionMenuRef.current && !editionMenuRef.current.contains(t)) {
        setEditionMenuOpen(false);
      }
      if (
        translationMenuOpen &&
        translationMenuRef.current &&
        !translationMenuRef.current.contains(t)
      ) {
        setTranslationMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [editionMenuOpen, translationMenuOpen]);

  const toggleBookmark = () => {
    if (bookmarked) {
      removeBookmark(surahNum, ayahNum);
      setBookmarked(false);
    } else {
      addBookmark({ surahNum, ayahNum, surahName, text: ayahText });
      setBookmarked(true);
    }
  };

  const handleCopy = async (plain: boolean) => {
    const ok = plain
      ? await copyAyahTextPlain(ayahText, surahName, ayahNum)
      : await copyAyahText(ayahText, surahName, ayahNum);
    if (ok) {
      setCopiedKind(plain ? "plain" : "full");
      setCopyMenuOpen(false);
      setTimeout(() => setCopiedKind((k) => (k === (plain ? "plain" : "full") ? null : k)), 1800);
    }
  };

  const handleSaveNote = () => {
    saveNote(surahNum, ayahNum, noteText);
    setMushafUnsavedWork(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  };

  const reportSubject = encodeURIComponent(`تصحيح نص قرآني — سورة ${surahName} آية ${ayahNum}`);
  const reportBody = encodeURIComponent(
    `الصفحة: ${window.location.href}\nسورة: ${surahName} (${surahNum})\nآية: ${ayahNum}\n\nالملاحظة:\n`,
  );

  const reciterName = reciterId ? getReciter(reciterId).nameAr : "القارئ";
  const fontPercent = Math.round(fontScale * 100);

  const handleShare = async () => {
    if (tafsirText && currentEditionMeta) {
      await shareAyahWithTafsir(
        ayahText,
        surahName,
        ayahNum,
        tafsirText,
        currentEditionMeta.label,
      );
      return;
    }
    await shareAyahAsText(ayahText, surahName, ayahNum);
  };

  const handleCopyWithTafsir = async () => {
    if (!tafsirText || !currentEditionMeta) return;
    const ok = await copyAyahWithTafsir(
      ayahText,
      surahName,
      ayahNum,
      tafsirText,
      currentEditionMeta.label,
    );
    if (ok) {
      setCopiedKind("full");
      window.setTimeout(() => setCopiedKind(null), 1600);
    }
  };

  const selectPanel = (mode: PanelMode) => {
    setPanelMode((prev) => (prev === mode ? "none" : mode));
    setMoreOpen(false);
    setCopyMenuOpen(false);
    setSpeedPickerOpen(false);
    setSleepPickerOpen(false);
    setEditionMenuOpen(false);
  };

  const handleListen = () => {
    setPanelMode("audio");
    setMoreOpen(false);
    setCopyMenuOpen(false);
    if (canPlay) onTogglePlay();
  };

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="aas-sheet aas-sheet--reader aas-sheet--v3" onClick={onClose} role="presentation">
      <div
        className="aas-panel aas-panel--reader aas-panel--v3"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`سورة ${surahName} آية ${ayahNum}`}
      >
        <div className="aas-panel__handle" aria-hidden="true" />

        <header className="aas-v3__header">
          <strong>سورة {surahName}</strong>
          <span>الآية {toArabicDigits(ayahNum)}</span>
        </header>

        <div className="aas-v3__scroll">
          <div className="aas-v3__actions" role="toolbar" aria-label="إجراءات الآية">
            <button
              type="button"
              className={`aas-v3__action${showTafsirPanel ? " is-on" : ""}`}
              onClick={() => selectPanel("tafsir")}
              aria-pressed={showTafsirPanel}
            >
              <BookOpen size={20} aria-hidden="true" />
              <span>تفسير</span>
            </button>
            <button
              type="button"
              className={`aas-v3__action${showAudioTools || isPlaying ? " is-on" : ""}`}
              onClick={handleListen}
              disabled={!canPlay}
              aria-label={isPlaying ? "إيقاف التلاوة" : "استماع"}
              aria-pressed={showAudioTools || isPlaying}
            >
              {isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
              <span>استماع</span>
            </button>
            <button
              type="button"
              className={`aas-v3__action${copyMenuOpen || copiedKind ? " is-on" : ""}`}
              onClick={() => {
                setCopyMenuOpen((v) => !v);
                setMoreOpen(false);
              }}
              aria-expanded={copyMenuOpen}
            >
              {copiedKind ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
              <span>نسخ</span>
            </button>
            <button type="button" className="aas-v3__action" onClick={() => void handleShare()}>
              <Share2 size={20} aria-hidden="true" />
              <span>مشاركة</span>
            </button>
            <button
              type="button"
              className={`aas-v3__action${bookmarked ? " is-on" : ""}`}
              onClick={toggleBookmark}
              aria-pressed={bookmarked}
            >
              <Bookmark size={20} aria-hidden="true" fill={bookmarked ? "currentColor" : "none"} />
              <span>إشارة</span>
            </button>
            <button
              type="button"
              className={`aas-v3__action${moreOpen ? " is-on" : ""}`}
              onClick={() => {
                setMoreOpen((v) => !v);
                setCopyMenuOpen(false);
              }}
              aria-expanded={moreOpen}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
              <span>المزيد</span>
            </button>
          </div>

          {copyMenuOpen ? (
            <div className="aas-v3__inline-menu" role="group" aria-label="خيارات النسخ">
              <button type="button" className="aas-v3__chip" onClick={() => void handleCopy(false)}>
                <Copy size={15} aria-hidden="true" />
                نسخ بالتشكيل
              </button>
              <button type="button" className="aas-v3__chip" onClick={() => void handleCopy(true)}>
                <Copy size={15} aria-hidden="true" />
                نسخ بلا تشكيل
              </button>
            </div>
          ) : null}

          {moreOpen ? (
            <div className="aas-v3__more" role="region" aria-label="إجراءات إضافية">
              <button
                type="button"
                className="aas-v3__chip"
                onClick={() => {
                  onClose();
                  navigate(`/quran/recitation-test-ai?surah=${surahNum}`);
                }}
              >
                <Mic size={15} aria-hidden="true" />
                تسميع
              </button>
              <button
                type="button"
                className={`aas-v3__chip${noteOpen ? " is-on" : ""}`}
                onClick={() => setNoteOpen((v) => !v)}
              >
                <Save size={15} aria-hidden="true" />
                حفظ ملاحظة
              </button>
              <a
                className="aas-v3__chip"
                href={`mailto:${CONTACT_EMAIL}?subject=${reportSubject}&body=${reportBody}`}
              >
                <Flag size={15} aria-hidden="true" />
                إبلاغ عن خطأ
              </a>
            </div>
          ) : null}

          {showAudioTools ? (
            <div className="aas-v3__audio" role="toolbar" aria-label="خيارات التلاوة">
              {canPlay && onToggleRepeat ? (
                <button
                  type="button"
                  className={`aas-v3__chip${repeatOn ? " is-on" : ""}`}
                  onClick={onToggleRepeat}
                  aria-pressed={repeatOn}
                >
                  <Repeat size={15} aria-hidden="true" />
                  تكرار
                </button>
              ) : null}

              {reciterId && onSetReciter ? (
                <button
                  type="button"
                  className={`aas-v3__chip${reciterSheetOpen && optionsFocus === "reciters" ? " is-on" : ""}`}
                  onClick={() => {
                    void ensureValidReciterPreference().then((id) => {
                      if (onSetReciter && id !== reciterId) onSetReciter(id);
                    });
                    setOptionsFocus("reciters");
                    setReciterSheetOpen(true);
                    setSpeedPickerOpen(false);
                    setSleepPickerOpen(false);
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={reciterSheetOpen && optionsFocus === "reciters"}
                >
                  <Mic2 size={15} aria-hidden="true" />
                  <span className="aas-v3__chip-label">{reciterName}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
              ) : null}

              {playbackRate !== undefined && onSetPlaybackRate ? (
                <div className="aas-v3__disclosure">
                  <button
                    type="button"
                    className={`aas-v3__chip${speedPickerOpen ? " is-on" : ""}`}
                    onClick={() => {
                      setSpeedPickerOpen((v) => !v);
                      setSleepPickerOpen(false);
                    }}
                    aria-expanded={speedPickerOpen}
                  >
                    <Gauge size={15} aria-hidden="true" />
                    {playbackRate}×
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                  {speedPickerOpen ? (
                    <div className="aas-v3__inline-menu aas-v3__inline-menu--compact" role="listbox" aria-label="سرعة التلاوة">
                      {VALID_PLAYBACK_RATES.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          role="option"
                          aria-selected={rate === playbackRate}
                          className={`aas-v3__chip${rate === playbackRate ? " is-on" : ""}`}
                          onClick={() => {
                            onSetPlaybackRate(rate);
                            setSpeedPickerOpen(false);
                          }}
                        >
                          {rate}×
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {onSetSleepTimer ? (
                <div className="aas-v3__disclosure">
                  <button
                    type="button"
                    className={`aas-v3__chip${sleepTimerOption !== "off" || sleepPickerOpen ? " is-on" : ""}`}
                    onClick={() => {
                      setSleepPickerOpen((v) => !v);
                      setSpeedPickerOpen(false);
                    }}
                    aria-expanded={sleepPickerOpen}
                  >
                    <Timer size={15} aria-hidden="true" />
                    {sleepTimerLabelAr(sleepTimerOption)}
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                  {sleepPickerOpen ? (
                    <div className="aas-v3__inline-menu" role="listbox" aria-label="مؤقّت الإيقاف">
                      {SLEEP_TIMER_OPTIONS.map((opt) => (
                        <button
                          key={String(opt)}
                          type="button"
                          role="option"
                          aria-selected={opt === sleepTimerOption}
                          className={`aas-v3__chip${opt === sleepTimerOption ? " is-on" : ""}`}
                          onClick={() => {
                            onSetSleepTimer(opt);
                            setSleepPickerOpen(false);
                          }}
                        >
                          {sleepTimerLabelAr(opt)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {showTafsirPanel ? (
            <div className="aas-v3__tafsir">
              <div className="aas-v3__tafsir-tools">
                <div className="aas-v3__disclosure aas-v3__disclosure--grow" ref={editionMenuRef}>
                  <button
                    type="button"
                    className={`aas-v3__chip aas-v3__chip--wide${reciterSheetOpen && optionsFocus === "tafsir" ? " is-on" : ""}`}
                    onClick={() => {
                      setOptionsFocus("tafsir");
                      setReciterSheetOpen(true);
                      setEditionMenuOpen(false);
                      setTranslationMenuOpen(false);
                    }}
                    aria-expanded={reciterSheetOpen && optionsFocus === "tafsir"}
                    aria-haspopup="dialog"
                  >
                    <BookOpen size={15} aria-hidden="true" />
                    <span className="aas-v3__chip-meta">
                      <em>التفسير</em>
                      <strong>{currentEditionMeta?.label ?? "اختر تفسيرًا"}</strong>
                    </span>
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  className="aas-v3__chip"
                  onClick={cycleFontScale}
                  aria-label={`حجم خط التفسير ${fontPercent}٪`}
                >
                  <Type size={15} aria-hidden="true" />
                  {toArabicDigits(fontPercent)}٪
                </button>

                <button
                  type="button"
                  className={`aas-v3__chip${showTranslation ? " is-on" : ""}`}
                  onClick={toggleTranslation}
                  aria-pressed={showTranslation}
                >
                  <Languages size={15} aria-hidden="true" />
                  ترجمة
                </button>

                {tafsirAudioAvailable ? (
                  <button
                    type="button"
                    className={`aas-v3__chip${tafsirAudioSheetOpen ? " is-on" : ""}`}
                    onClick={() => handleListenTafsirAudio()}
                    aria-label="استماع للتفسير"
                  >
                    <Mic2 size={15} aria-hidden="true" />
                    تفسير صوتي
                  </button>
                ) : null}
                {ayahPeople.length > 0 ? (
                  <button
                    type="button"
                    className="aas-v3__chip"
                    onClick={() => {
                      const first = ayahPeople[0];
                      navigate(
                        ayahPeople.length === 1
                          ? `/quran/people/${first.slug}`
                          : `/quran/people`,
                      );
                      onClose();
                    }}
                    aria-label="من ذُكر في هذه الآية"
                  >
                    <Users size={15} aria-hidden="true" />
                    مَن ذُكر؟
                    {ayahPeople.length > 1
                      ? ` (${toArabicDigits(ayahPeople.length)})`
                      : ` · ${ayahPeople[0].nameAr}`}
                  </button>
                ) : null}
              </div>
              {tafsirAudioMsg ? (
                <p className="aas-reader__status" role="status">
                  {tafsirAudioMsg}
                </p>
              ) : null}

              {currentEditionMeta?.caution ? (
                <p className="aas-reader__caution" role="note">
                  {currentEditionMeta.caution}
                </p>
              ) : null}

              <section
                className="aas-reader__body"
                aria-live="polite"
                aria-busy={tafsirLoading}
                style={{ ["--aas-tafsir-scale" as string]: String(fontScale) }}
              >
                {currentEditionMeta ? (
                  <p className="aas-reader__author">
                    <span>{currentEditionMeta.author}</span>
                    {currentEditionMeta.sourceNoteAr ? (
                      <span className="aas-reader__source"> · {currentEditionMeta.sourceNoteAr}</span>
                    ) : null}
                  </p>
                ) : null}

                {tafsirLoading && !tafsirText ? (
                  <div className="aas-reader__skel" aria-label="جاري تحميل التفسير">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : tafsirError && !tafsirText ? (
                  <div className="aas-v3__error" role="alert">
                    <p>تعذّر تحميل التفسير. تحقّق من اتصالك أو جرّب المصدر المحلي إن وُجد.</p>
                    <button
                      type="button"
                      className="aas-v3__chip is-on"
                      onClick={() => setTafsirRetryKey((k) => k + 1)}
                    >
                      <RefreshCw size={15} aria-hidden="true" />
                      إعادة المحاولة
                    </button>
                  </div>
                ) : visibleParagraphs.length > 0 ? (
                  <>
                    <div
                      className={`aas-reader__prose${tafsirNeedsCollapse ? " is-collapsed" : ""}`}
                      key={tafsirEdition}
                    >
                      {visibleParagraphs.map((p, i) => (
                        <p key={`${i}-${p.slice(0, 24)}`}>{p}</p>
                      ))}
                    </div>
                    <div className="aas-v3__tafsir-actions">
                      {isBriefEdition ? (
                        <button
                          type="button"
                          className="aas-reader__expand"
                          onClick={openExtendedTafsir}
                        >
                          التفسير المطوّل
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="aas-reader__expand"
                          onClick={returnToBriefTafsir}
                        >
                          العودة للمختصر
                        </button>
                      )}
                      {tafsirText ? (
                        <button
                          type="button"
                          className="aas-v3__chip"
                          onClick={() => void handleCopyWithTafsir()}
                        >
                          <Copy size={15} aria-hidden="true" />
                          نسخ مع التفسير
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="aas-reader__status">لا يتوفر تفسير لهذه الآية في المصدر المختار.</p>
                )}
              </section>

              {showTranslation ? (
                <div className="aas-reader__translation" ref={translationMenuRef}>
                  <div className="aas-v3__disclosure">
                    <button
                      type="button"
                      className={`aas-v3__chip${translationMenuOpen ? " is-on" : ""}`}
                      onClick={() => {
                        setTranslationMenuOpen((v) => !v);
                        setEditionMenuOpen(false);
                      }}
                      aria-expanded={translationMenuOpen}
                      aria-haspopup="listbox"
                    >
                      <strong>{currentTranslationMeta?.label ?? "ترجمة"}</strong>
                      <ChevronDown size={14} aria-hidden="true" />
                    </button>
                    {translationMenuOpen ? (
                      <div className="aas-v3__inline-menu" role="listbox" aria-label="قائمة الترجمات">
                        {MUSHAF_TRANSLATION_EDITIONS.map((ed) => (
                          <button
                            key={ed.id}
                            type="button"
                            role="option"
                            aria-selected={ed.id === translationEdition}
                            className={`aas-v3__menu-row${ed.id === translationEdition ? " is-on" : ""}`}
                            onClick={() => handleSelectTranslation(ed.id)}
                          >
                            <strong>{ed.label}</strong>
                            <span>{ed.author}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="aas-reader__translation-body" aria-live="polite" aria-busy={translationLoading}>
                    {translationLoading && !translationText ? (
                      <p className="aas-reader__status">جاري تحميل الترجمة…</p>
                    ) : translationError && !translationText ? (
                      <p className="aas-reader__status">تعذّر تحميل الترجمة.</p>
                    ) : translationText ? (
                      <p
                        className="aas-reader__translation-text"
                        dir={currentTranslationMeta?.dir ?? "ltr"}
                        lang={translationEdition.startsWith("fr") ? "fr" : "en"}
                      >
                        {translationText}
                      </p>
                    ) : (
                      <p className="aas-reader__status">لا تتوفر ترجمة لهذه الآية.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {noteOpen ? (
            <div className="aas-reader__note">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="اكتب ملاحظتك على هذه الآية..."
                dir="rtl"
                aria-label="ملاحظة على الآية"
              />
              <button type="button" className="aas-v3__chip is-on" onClick={handleSaveNote}>
                {noteSaved ? <Check size={15} aria-hidden="true" /> : <StickyNote size={15} aria-hidden="true" />}
                {noteSaved ? "تم الحفظ" : "حفظ الملاحظة"}
              </button>
            </div>
          ) : null}
        </div>

        {(onPrev || onNext) ? (
          <nav className="aas-v3__nav" aria-label="التنقّل بين الآيات">
            {onPrev ? (
              <button type="button" className="aas-v3__nav-btn" onClick={onPrev}>
                <ChevronRight size={18} aria-hidden="true" />
                الآية السابقة
              </button>
            ) : (
              <span className="aas-v3__nav-spacer" />
            )}
            {onNext ? (
              <button type="button" className="aas-v3__nav-btn" onClick={onNext}>
                الآية التالية
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
            ) : (
              <span className="aas-v3__nav-spacer" />
            )}
          </nav>
        ) : null}

        <MushafReaderOptionsSheet
          open={reciterSheetOpen}
          onClose={() => setReciterSheetOpen(false)}
          focusSection={optionsFocus}
          tafsirEditionId={tafsirEdition}
          onSelectTafsir={handleSelectEdition}
          reciterId={reciterId}
          onSelectReciter={
            onSetReciter
              ? (id) => {
                  onSetReciter(id);
                }
              : undefined
          }
          reciterMode="ayah"
          tafsirAudioOptions={
            tafsirAudioAvailable
              ? [
                  {
                    id: "ayah-clip",
                    label: "تفسير صوتي لهذه الآية",
                    description: "استماع من الكتالوج المعتمد",
                  },
                ]
              : []
          }
          tafsirAudioLoading={false}
          tafsirAudioError={false}
          onSelectTafsirAudio={() => {
            setReciterSheetOpen(false);
            if (tafsirAudioAvailable) setTafsirAudioSheetOpen(true);
          }}
        />

        {tafsirAudioSheetOpen ? (
          <Suspense fallback={null}>
            <TafsirAudioSheetLazy
              open={tafsirAudioSheetOpen}
              onClose={() => setTafsirAudioSheetOpen(false)}
              surah={surahNum}
              ayah={ayahNum}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

export default PageAyahActionSheet;
