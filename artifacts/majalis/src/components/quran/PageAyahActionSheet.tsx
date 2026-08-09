import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  X,
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
} from "lucide-react";
import { copyAyahText, copyAyahTextPlain, shareAyahAsText } from "@/lib/share-ayah";
import { addBookmark, removeBookmark, isBookmarked, getNote, saveNote } from "@/lib/quran-personal";
import { setMushafUnsavedWork } from "@/lib/mushaf-unsaved";
import {
  VALID_PLAYBACK_RATES,
  getReciter,
  getSelectableReciters,
  reciterInitial,
  ensureValidReciterPreference,
} from "@/lib/quran-audio";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { afterNextPaint, yieldToMain } from "@/lib/yield-to-main";
import { prewarmTextApis } from "@/lib/resource-prewarm";
import { toArabicDigits } from "@/lib/utils";
import {
  MUSHAF_TAFSIR_EDITIONS,
  MUSHAF_TRANSLATION_EDITIONS,
  TAFSIR_FONT_SCALES,
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

/** أطول من هذا يُطوى افتراضيًا مع زر «عرض المزيد» */
const TAFSIR_COLLAPSE_CHARS = 720;

/** Split long tafsir into readable paragraphs without inventing content. */
function tafsirParagraphs(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  const byBreak = cleaned.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  if (byBreak.length > 1) return byBreak;
  const soft = cleaned.split(/(?<=[.؟!。])\s+/).map((p) => p.trim()).filter(Boolean);
  return soft.length > 1 ? soft : [cleaned];
}

/**
 * ورقة إجراءات الآية — قارئ تفسير مرحلة ٢:
 * تبديل تفاسير · حجم خط · طيّ النص الطويل · ترجمة اختيارية كسولة.
 */
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
}: Props) {
  const [, navigate] = useLocation();
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(surahNum, ayahNum));
  const [copiedKind, setCopiedKind] = useState<"full" | "plain" | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [showTafsirPanel, setShowTafsirPanel] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => getNote(surahNum, ayahNum));
  const [noteSaved, setNoteSaved] = useState(false);
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [speedPickerOpen, setSpeedPickerOpen] = useState(false);
  const [editionMenuOpen, setEditionMenuOpen] = useState(false);
  const [translationMenuOpen, setTranslationMenuOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [tafsirEdition, setTafsirEdition] = useState(readStoredTafsirEdition);
  const [fontScale, setFontScale] = useState<TafsirFontScale>(readStoredTafsirFontScale);
  const [tafsirExpanded, setTafsirExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(readStoredTranslationEnabled);
  const [translationEdition, setTranslationEdition] = useState(readStoredTranslationEdition);
  const [translationText, setTranslationText] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const editionMenuRef = useRef<HTMLDivElement | null>(null);
  const translationMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = getNote(surahNum, ayahNum);
    setMushafUnsavedWork(noteText !== saved);
  }, [noteText, surahNum, ayahNum]);

  useEffect(() => {
    setBookmarked(isBookmarked(surahNum, ayahNum));
    setNoteText(getNote(surahNum, ayahNum));
    setMushafUnsavedWork(false);
    setCopiedKind(null);
    setNoteOpen(false);
    setNoteSaved(false);
    setEditionMenuOpen(false);
    setTranslationMenuOpen(false);
    setReciterPickerOpen(false);
    setSpeedPickerOpen(false);
    setTafsirText(null);
    setTafsirError(false);
    setTafsirExpanded(false);
    setTranslationText(null);
    setTranslationError(false);
  }, [surahNum, ayahNum]);

  useEffect(() => {
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
  }, [surahNum, ayahNum, tafsirEdition]);

  useEffect(() => {
    if (!showTranslation) {
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
  }, [surahNum, ayahNum, translationEdition, showTranslation]);

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
  const tafsirNeedsCollapse = (tafsirText?.length ?? 0) > TAFSIR_COLLAPSE_CHARS;
  const visibleParagraphs =
    tafsirNeedsCollapse && !tafsirExpanded
      ? (() => {
          let count = 0;
          const out: string[] = [];
          for (const p of paragraphs) {
            out.push(p);
            count += p.length;
            if (count >= TAFSIR_COLLAPSE_CHARS) break;
          }
          return out.length > 0 ? out : paragraphs.slice(0, 1);
        })()
      : paragraphs;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editionMenuOpen) setEditionMenuOpen(false);
        else if (translationMenuOpen) setTranslationMenuOpen(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, editionMenuOpen, translationMenuOpen]);

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
    await shareAyahAsText(ayahText, surahName, ayahNum);
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

        <div className="aas-v3__actions" role="toolbar" aria-label="إجراءات الآية">
          <button
            type="button"
            className={`aas-v3__action${showTafsirPanel ? " is-on" : ""}`}
            onClick={() => { setShowTafsirPanel((v) => !v); setMoreOpen(false); }}
          >
            <BookOpen size={20} aria-hidden="true" />
            <span>تفسير</span>
          </button>
          <button
            type="button"
            className={`aas-v3__action${isPlaying ? " is-on" : ""}`}
            onClick={onTogglePlay}
            disabled={!canPlay}
            aria-label={isPlaying ? "إيقاف التلاوة" : "استماع"}
          >
            {isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
            <span>استماع</span>
          </button>
          <button type="button" className="aas-v3__action" onClick={() => void handleCopy(false)}>
            {copiedKind === "full" ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
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
          >
            <Bookmark size={20} aria-hidden="true" fill={bookmarked ? "currentColor" : "none"} />
            <span>إشارة</span>
          </button>
          <button
            type="button"
            className="aas-v3__action"
            onClick={() => {
              onClose();
              navigate(`/quran/recitation-test-ai?surah=${surahNum}`);
            }}
            aria-label="تسميع هذه السورة"
          >
            <Mic size={20} aria-hidden="true" />
            <span>تسميع</span>
          </button>
          <button
            type="button"
            className={`aas-v3__action${noteOpen ? " is-on" : ""}`}
            onClick={() => { setNoteOpen((v) => !v); setMoreOpen(false); }}
          >
            <Save size={20} aria-hidden="true" />
            <span>حفظ</span>
          </button>
        </div>

        <button
          type="button"
          className={`aas-v3__more-toggle${moreOpen ? " is-on" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={18} aria-hidden="true" />
          المزيد
        </button>

        {moreOpen ? (
          <div className="aas-v3__more" role="region" aria-label="إجراءات إضافية">
            {(onPrev || onNext) ? (
              <div className="aas-v3__nav-row">
                {onPrev ? (
                  <button type="button" className="aas-v3__more-btn" onClick={onPrev}>
                    <ChevronRight size={18} aria-hidden="true" /> الآية السابقة
                  </button>
                ) : null}
                {onNext ? (
                  <button type="button" className="aas-v3__more-btn" onClick={onNext}>
                    الآية التالية <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ) : null}
            {(canPlay || (reciterId && onSetReciter) || playbackRate !== undefined) && (
          <div className="aas-reader__audio-strip" role="toolbar" aria-label="خيارات التلاوة">
            {canPlay && onToggleRepeat ? (
              <button
                type="button"
                className={`aas-reader__audio-chip${repeatOn ? " is-on" : ""}`}
                onClick={onToggleRepeat}
                aria-pressed={repeatOn}
              >
                <Repeat size={15} aria-hidden="true" />
                <span>تكرار</span>
              </button>
            ) : null}

            {reciterId && onSetReciter ? (
              <div className="aas-reader__dropdown-wrap">
                <button
                  type="button"
                  className={`aas-reader__audio-chip${reciterPickerOpen ? " is-on" : ""}`}
                  onClick={() => {
                    void ensureValidReciterPreference().then((id) => {
                      if (onSetReciter && id !== reciterId) onSetReciter(id);
                    });
                    setReciterPickerOpen((v) => !v);
                    setSpeedPickerOpen(false);
                    setEditionMenuOpen(false);
                    setTranslationMenuOpen(false);
                  }}
                  aria-expanded={reciterPickerOpen}
                >
                  <Mic2 size={15} aria-hidden="true" />
                  <span>{reciterName}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {reciterPickerOpen ? (
                  <div className="aas-reader__dropdown" role="listbox" aria-label="اختيار القارئ">
                    {getSelectableReciters("ayah").map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        role="option"
                        aria-selected={r.id === reciterId}
                        className={r.id === reciterId ? "is-active" : undefined}
                        onClick={() => {
                          onSetReciter(r.id);
                          setReciterPickerOpen(false);
                        }}
                      >
                        <span className="aas-reader__reciter-initial" aria-hidden="true">
                          {reciterInitial(r)}
                        </span>
                        <span className="aas-reader__reciter-meta">
                          <span className="aas-reader__reciter-name">{r.nameAr}</span>
                          <span className="aas-reader__reciter-sub">
                            {r.riwaya} · {r.qualityLabel}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {playbackRate !== undefined && onSetPlaybackRate ? (
              <div className="aas-reader__dropdown-wrap">
                <button
                  type="button"
                  className={`aas-reader__audio-chip${speedPickerOpen ? " is-on" : ""}`}
                  onClick={() => {
                    setSpeedPickerOpen((v) => !v);
                    setReciterPickerOpen(false);
                    setEditionMenuOpen(false);
                    setTranslationMenuOpen(false);
                  }}
                  aria-expanded={speedPickerOpen}
                >
                  <Gauge size={15} aria-hidden="true" />
                  <span>{playbackRate}×</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {speedPickerOpen ? (
                  <div className="aas-reader__dropdown aas-reader__dropdown--compact" role="listbox" aria-label="سرعة التلاوة">
                    {VALID_PLAYBACK_RATES.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        role="option"
                        aria-selected={rate === playbackRate}
                        className={rate === playbackRate ? "is-active" : undefined}
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
          </div>
        )}
            <button type="button" className="aas-v3__more-btn" onClick={() => void handleCopy(true)}>
              <Copy size={16} aria-hidden="true" /> نسخ بلا تشكيل
            </button>
            <a
              className="aas-v3__more-btn"
              href={`mailto:${CONTACT_EMAIL}?subject=${reportSubject}&body=${reportBody}`}
            >
              <Flag size={16} aria-hidden="true" /> إبلاغ عن خطأ
            </a>
          </div>
        ) : null}

        {showTafsirPanel ? (
        <div className="aas-v3__tafsir">
        <div className="aas-reader__edition-row">
          <div className="aas-reader__edition" ref={editionMenuRef}>
            <button
              type="button"
              className="aas-reader__edition-btn"
              onClick={() => {
                setEditionMenuOpen((v) => !v);
                setReciterPickerOpen(false);
                setSpeedPickerOpen(false);
                setTranslationMenuOpen(false);
              }}
              aria-expanded={editionMenuOpen}
              aria-haspopup="listbox"
            >
              <BookOpen size={16} aria-hidden="true" />
              <span className="aas-reader__edition-label">
                <em>التفسير</em>
                <strong>{currentEditionMeta?.label ?? "اختر تفسيرًا"}</strong>
              </span>
              <ChevronDown size={16} aria-hidden="true" className={editionMenuOpen ? "is-open" : undefined} />
            </button>
            {editionMenuOpen ? (
              <div className="aas-reader__edition-menu" role="listbox" aria-label="قائمة التفاسير">
                {MUSHAF_TAFSIR_EDITIONS.map((ed) => (
                  <button
                    key={ed.id}
                    type="button"
                    role="option"
                    aria-selected={ed.id === tafsirEdition}
                    className={ed.id === tafsirEdition ? "is-active" : undefined}
                    onClick={() => handleSelectEdition(ed.id)}
                  >
                    <strong>{ed.label}</strong>
                    <span>
                      {ed.author}
                      {ed.level ? ` · ${ed.level}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="aas-reader__font-btn"
            onClick={cycleFontScale}
            aria-label={`حجم خط التفسير ${fontPercent}٪`}
            title="تغيير حجم خط التفسير"
          >
            <Type size={16} aria-hidden="true" />
            <span>{toArabicDigits(fontPercent)}٪</span>
          </button>
        </div>

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
            </p>
          ) : null}

          {tafsirLoading && !tafsirText ? (
            <div className="aas-reader__skel" aria-label="جاري تحميل التفسير">
              <span />
              <span />
              <span />
            </div>
          ) : tafsirError && !tafsirText ? (
            <p className="aas-reader__status">تعذّر تحميل التفسير. تحقّق من اتصالك ثم أعد المحاولة.</p>
          ) : visibleParagraphs.length > 0 ? (
            <>
              <div
                className={`aas-reader__prose${tafsirNeedsCollapse && !tafsirExpanded ? " is-collapsed" : ""}`}
                key={tafsirEdition}
              >
                {visibleParagraphs.map((p, i) => (
                  <p key={`${i}-${p.slice(0, 24)}`}>{p}</p>
                ))}
              </div>
              {tafsirNeedsCollapse ? (
                <button
                  type="button"
                  className="aas-reader__expand"
                  onClick={() => setTafsirExpanded((v) => !v)}
                  aria-expanded={tafsirExpanded}
                >
                  {tafsirExpanded ? "عرض أقل" : "عرض المزيد"}
                </button>
              ) : null}
            </>
          ) : (
            <p className="aas-reader__status">لا يتوفر تفسير لهذه الآية في المصدر المختار.</p>
          )}
        </section>

        <div className="aas-reader__translation" ref={translationMenuRef}>
          <div className="aas-reader__translation-bar">
            <button
              type="button"
              className={`aas-reader__audio-chip${showTranslation ? " is-on" : ""}`}
              onClick={toggleTranslation}
              aria-pressed={showTranslation}
            >
              <Languages size={15} aria-hidden="true" />
              <span>ترجمة</span>
            </button>
            {showTranslation ? (
              <button
                type="button"
                className={`aas-reader__edition-btn aas-reader__edition-btn--compact${translationMenuOpen ? " is-open" : ""}`}
                onClick={() => {
                  setTranslationMenuOpen((v) => !v);
                  setEditionMenuOpen(false);
                  setReciterPickerOpen(false);
                  setSpeedPickerOpen(false);
                }}
                aria-expanded={translationMenuOpen}
                aria-haspopup="listbox"
              >
                <span className="aas-reader__edition-label">
                  <strong>{currentTranslationMeta?.label ?? "ترجمة"}</strong>
                </span>
                <ChevronDown size={14} aria-hidden="true" className={translationMenuOpen ? "is-open" : undefined} />
              </button>
            ) : null}
          </div>
          {showTranslation && translationMenuOpen ? (
            <div className="aas-reader__edition-menu aas-reader__edition-menu--translation" role="listbox" aria-label="قائمة الترجمات">
              {MUSHAF_TRANSLATION_EDITIONS.map((ed) => (
                <button
                  key={ed.id}
                  type="button"
                  role="option"
                  aria-selected={ed.id === translationEdition}
                  className={ed.id === translationEdition ? "is-active" : undefined}
                  onClick={() => handleSelectTranslation(ed.id)}
                >
                  <strong>{ed.label}</strong>
                  <span>{ed.author}</span>
                </button>
              ))}
            </div>
          ) : null}
          {showTranslation ? (
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
          ) : null}
        </div>

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
            <button type="button" className="aas-reader__note-save" onClick={handleSaveNote}>
              {noteSaved ? <Check size={16} aria-hidden="true" /> : <StickyNote size={16} aria-hidden="true" />}
              {noteSaved ? "تم الحفظ" : "حفظ الملاحظة"}
            </button>
          </div>
        ) : null}

        <button type="button" className="aas-v3__close" onClick={onClose}>
          <X size={18} aria-hidden="true" />
          إغلاق
        </button>
      </div>
    </div>
  );
}

export default PageAyahActionSheet;
