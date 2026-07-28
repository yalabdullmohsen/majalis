import { useEffect, useRef, useState } from "react";
import { X, Copy, Check, Bookmark, StickyNote, Play, Pause, ChevronRight, ChevronLeft, ChevronDown, Flag, BookOpen, Mic2, Repeat, Gauge, Share2, Languages, Minus, Plus, Download, Mic } from "lucide-react";
import { copyAyahText, copyAyahTextPlain } from "@/lib/share-ayah";
import {
  addBookmark, removeBookmark, isBookmarked, getNote,
  BOOKMARK_RIBBONS, getBookmarkListForAyah, getBookmarkRibbon,
} from "@/lib/quran-personal";
import { upsertTadabbur, saveTafsirClip, saveVoiceBookmark } from "@/lib/quran-tadabbur";
import { fetchTafsirAyahs } from "@/lib/quran-api";
import { MUSHAF_TAFSIR_EDITIONS } from "@/lib/tafsir-seed";
import { QURAN_TRANSLATION_EDITIONS, fetchAyahTranslation } from "@/lib/quran-translation";
import { RECITERS } from "@/lib/quran-audio";
import { downloadSurah, isSurahDownloaded } from "@/lib/quran-audio-downloads";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { afterNextPaint, yieldToMain } from "@/lib/yield-to-main";
import { prewarmTextApis } from "@/lib/resource-prewarm";
import { MemorizationLoopPanel } from "@/components/quran/MemorizationLoopPanel";
import { ReciteRepeatPanel } from "@/components/quran/ReciteRepeatPanel";
import { AyahShareCardPanel } from "@/components/quran/AyahShareCardPanel";
import { TafsirComparePanel } from "@/components/quran/TafsirComparePanel";
import type { AyahLoopConfig } from "@/lib/ayah-loop-controller";
import type { TeachRepeatConfig } from "@/lib/teach-repeat-controller";
import type { TeachPhase } from "@/hooks/useAyahPlayer";

const TAFSIR_EDITION_KEY = "majalis-mushaf-tafsir-edition-v1";
const TRANSLATION_EDITION_KEY = "majalis-mushaf-translation-edition-v1";
const TAFSIR_FONT_KEY = "majalis-mushaf-tafsir-font-v1";

/** تفاسير سريعة في الواجهة الأمامية (الميسّر / السعدي / ابن كثير). */
const QUICK_TAFSIR_IDS = ["ar.muyassar", "ar.sadi", "en.ibnukathir"] as const;

function getStoredTafsirEdition(): string {
  try {
    const v = localStorage.getItem(TAFSIR_EDITION_KEY);
    if (v && MUSHAF_TAFSIR_EDITIONS.some((e) => e.id === v)) return v;
  } catch { /* ignore */ }
  return "ar.muyassar";
}

function getStoredTranslationEdition(): string {
  try {
    const v = localStorage.getItem(TRANSLATION_EDITION_KEY);
    if (v && QURAN_TRANSLATION_EDITIONS.some((e) => e.id === v)) return v;
  } catch { /* ignore */ }
  return "en.sahih";
}

function getStoredTafsirFont(): number {
  try {
    const n = Number(localStorage.getItem(TAFSIR_FONT_KEY));
    if (Number.isFinite(n) && n >= 14 && n <= 28) return n;
  } catch { /* ignore */ }
  return 16;
}

/**
 * ورقة إجراءات الآية — القسم "ز. التفاعل مع الآية" من مواصفة نواة المصحف
 * الرقمي. تربط أدوات كانت موجودة فعليًا لكنها غير مُستخدَمة في أي واجهة:
 * quran-personal.ts (إشارات مرجعية وملاحظات — محلي بالكامل، لا خادم) و
 * share-ayah.ts (نسخ نص، مع/دون تشكيل — أزرار المشاركة أُلغيت 2026-07-24).
 *
 * ملاحظة دمج: يستخدمه MushafPageView.tsx (قارئ /mushaf/page بنظام
 * الصفحات). قارئ /mushaf التقليدي (MushafPage.tsx) يستخدم مكوّنًا منفصلًا
 * بواجهة props مختلفة تمامًا: AyahActionSheet.tsx.
 */
type Props = {
  surahNum: number;
  surahName: string;
  ayahNum: number;
  ayahText: string;
  ayahJuz?: number;
  totalAyahs?: number;
  pageRange?: { start: number; end: number } | null;
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
  loopConfig?: AyahLoopConfig | null;
  onSetLoop?: (cfg: (Partial<AyahLoopConfig> & { startAyah: number; infinite?: boolean }) | null) => void;
  onPlayFrom?: (ayah: number) => void;
  hideVerseTest?: boolean;
  onToggleHideVerse?: () => void;
  onTadabburChanged?: () => void;
  teachConfig?: TeachRepeatConfig;
  onTeachConfigChange?: (patch: Partial<TeachRepeatConfig>) => void;
  teachPhase?: TeachPhase;
  onSkipStudentPause?: () => void;
};

export function PageAyahActionSheet({
  surahNum, surahName, ayahNum, ayahText, ayahJuz = 1, totalAyahs = 286, pageRange = null,
  isPlaying, onTogglePlay, canPlay = true, onPrev, onNext, onClose,
  reciterId, onSetReciter, playbackRate, onSetPlaybackRate, repeatOn, onToggleRepeat,
  loopConfig = null, onSetLoop, onPlayFrom, hideVerseTest = false, onToggleHideVerse, onTadabburChanged,
  teachConfig, onTeachConfigChange, teachPhase = "idle", onSkipStudentPause,
}: Props) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(surahNum, ayahNum));
  const [bookmarkList, setBookmarkList] = useState<string | null>(() => getBookmarkListForAyah(surahNum, ayahNum));
  const [ribbonOpen, setRibbonOpen] = useState(false);
  const [copiedKind, setCopiedKind] = useState<"full" | "plain" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loopOpen, setLoopOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => getNote(surahNum, ayahNum));
  const [noteSaved, setNoteSaved] = useState(false);
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [speedPickerOpen, setSpeedPickerOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [tafsirEdition, setTafsirEdition] = useState(getStoredTafsirEdition);
  const [tafsirFont, setTafsirFont] = useState(getStoredTafsirFont);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [translationText, setTranslationText] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const [translationEdition, setTranslationEdition] = useState(getStoredTranslationEdition);

  useEffect(() => {
    setBookmarked(isBookmarked(surahNum, ayahNum));
    setBookmarkList(getBookmarkListForAyah(surahNum, ayahNum));
    setRibbonOpen(false);
    setNoteText(getNote(surahNum, ayahNum));
    setCopiedKind(null);
    setNoteOpen(false);
    setNoteSaved(false);
    setShareOpen(false);
    setLoopOpen(false);
    setCompareOpen(false);
    setTafsirOpen(false);
    setTafsirText(null);
    setTafsirError(false);
    setTranslationOpen(false);
    setTranslationText(null);
    setTranslationError(false);
    setDownloadDone(false);
  }, [surahNum, ayahNum]);

  useEffect(() => {
    if (!reciterId) return;
    void isSurahDownloaded(reciterId, surahNum).then(setDownloadDone);
  }, [reciterId, surahNum]);

  const loadTafsir = async (edition: string) => {
    // Part 21 CLS shield: do NOT null committed tafsir text while loading —
    // keeps drawer height stable (zero layout shift).
    setTafsirLoading(true);
    setTafsirError(false);
    try {
      // Drawer already open — yield so open animation / press feedback paints (INP).
      await afterNextPaint();
      prewarmTextApis();
      const ayahs = await fetchTafsirAyahs(surahNum, edition);
      await yieldToMain();
      const found = ayahs.find((a) => a.numberInSurah === ayahNum);
      setTafsirText(found?.text ?? null);
      if (!found) setTafsirError(true);
    } catch {
      setTafsirError(true);
    } finally {
      setTafsirLoading(false);
    }
  };

  const handleToggleTafsir = async () => {
    const next = !tafsirOpen;
    setTafsirOpen(next);
    if (next && tafsirText === null && !tafsirLoading) {
      await loadTafsir(tafsirEdition);
    }
  };

  const handleSelectEdition = async (id: string) => {
    setTafsirEdition(id);
    try { localStorage.setItem(TAFSIR_EDITION_KEY, id); } catch { /* ignore */ }
    if (tafsirOpen) await loadTafsir(id);
  };

  const bumpTafsirFont = (delta: number) => {
    setTafsirFont((prev) => {
      const next = Math.min(28, Math.max(14, prev + delta));
      try { localStorage.setItem(TAFSIR_FONT_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const loadTranslation = async (edition: string) => {
    setTranslationLoading(true);
    setTranslationError(false);
    try {
      await afterNextPaint();
      const text = await fetchAyahTranslation(surahNum, ayahNum, edition);
      await yieldToMain();
      setTranslationText(text);
      if (!text) setTranslationError(true);
    } catch {
      setTranslationError(true);
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleToggleTranslation = async () => {
    const next = !translationOpen;
    setTranslationOpen(next);
    if (next && translationText === null && !translationLoading) {
      await loadTranslation(translationEdition);
    }
  };

  const handleSelectTranslation = async (id: string) => {
    setTranslationEdition(id);
    try { localStorage.setItem(TRANSLATION_EDITION_KEY, id); } catch { /* ignore */ }
    if (translationOpen) await loadTranslation(id);
  };

  const currentEditionMeta = MUSHAF_TAFSIR_EDITIONS.find((e) => e.id === tafsirEdition);
  const quickEditions = MUSHAF_TAFSIR_EDITIONS.filter((e) => (QUICK_TAFSIR_IDS as readonly string[]).includes(e.id));
  const moreEditions = MUSHAF_TAFSIR_EDITIONS.filter((e) => !(QUICK_TAFSIR_IDS as readonly string[]).includes(e.id));
  const currentTranslationMeta = QURAN_TRANSLATION_EDITIONS.find((e) => e.id === translationEdition);
  const activeRibbon = bookmarkList ? getBookmarkRibbon(bookmarkList) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const applyBookmarkList = (list: string) => {
    addBookmark({ surahNum, ayahNum, surahName, text: ayahText }, list);
    setBookmarked(true);
    setBookmarkList(list);
    setRibbonOpen(false);
  };

  const toggleBookmark = () => {
    if (bookmarked) {
      removeBookmark(surahNum, ayahNum);
      setBookmarked(false);
      setBookmarkList(null);
      setRibbonOpen(false);
    } else {
      setRibbonOpen(true);
    }
  };

  const handleCopy = async (plain: boolean) => {
    const ok = plain ? await copyAyahTextPlain(ayahText, surahName, ayahNum) : await copyAyahText(ayahText, surahName, ayahNum);
    if (ok) {
      setCopiedKind(plain ? "plain" : "full");
      setTimeout(() => setCopiedKind((k) => (k === (plain ? "plain" : "full") ? null : k)), 1800);
    }
  };

  const handleShareImage = async () => {
    setShareOpen((v) => !v);
  };

  const handleSaveNote = async () => {
    await upsertTadabbur({ surahNum, ayahNum, text: noteText, juz: ayahJuz });
    setNoteSaved(true);
    onTadabburChanged?.();
    setTimeout(() => setNoteSaved(false), 1500);
  };

  const handleSaveTafsirClip = async () => {
    if (!tafsirText) return;
    await saveTafsirClip(surahNum, ayahNum, tafsirText.slice(0, 500), tafsirEdition, ayahJuz);
    onTadabburChanged?.();
  };

  const handleDownloadSurah = async () => {
    if (!reciterId) return;
    setDownloadBusy(true);
    try {
      const ok = await downloadSurah(reciterId, surahNum);
      setDownloadDone(ok);
    } finally {
      setDownloadBusy(false);
    }
  };

  const handleVoiceBookmark = async () => {
    if (voiceBusy) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceBusy(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        void saveVoiceBookmark(surahNum, ayahNum, blob, ayahJuz).then(() => onTadabburChanged?.());
      };
      rec.start();
      setVoiceBusy(true);
      window.setTimeout(() => {
        if (mediaRecorderRef.current === rec && rec.state === "recording") rec.stop();
      }, 15_000);
    } catch {
      setVoiceBusy(false);
    }
  };

  const reportSubject = encodeURIComponent(`تصحيح نص قرآني — سورة ${surahName} آية ${ayahNum}`);
  const reportBody = encodeURIComponent(
    `الصفحة: ${window.location.href}\nسورة: ${surahName} (${surahNum})\nآية: ${ayahNum}\n\nالملاحظة:\n`,
  );

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="aas-sheet" onClick={onClose} role="presentation">
      <div className="aas-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`إجراءات الآية ${ayahNum}`}>
        <div className="aas-panel__handle" aria-hidden="true" />
        <div className="aas-panel__ref">
          سورة {surahName} — آية {ayahNum}
          <button type="button" onClick={onClose} aria-label="إغلاق" style={{ float: "left", marginLeft: "1rem", background: "none", border: "none", cursor: "pointer" }}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="aas-panel__text" dir="rtl">{ayahText}</p>

        {reciterId && onSetReciter && (
          <>
            <button type="button" className="ayah-sheet__reciter-toggle" onClick={() => setReciterPickerOpen((v) => !v)}>
              <Mic2 size={14} aria-hidden="true" />
              <span>القارئ: {RECITERS.find((r) => r.id === reciterId)?.nameAr ?? RECITERS[0].nameAr}</span>
              <ChevronDown size={14} aria-hidden="true" className={reciterPickerOpen ? "is-open" : ""} />
            </button>
            {reciterPickerOpen && (
              <div className="ayah-sheet__reciter-list" role="listbox" aria-label="اختيار القارئ">
                {RECITERS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={r.id === reciterId}
                    className={`ayah-sheet__reciter-item${r.id === reciterId ? " is-active" : ""}`}
                    onClick={() => { onSetReciter(r.id); setReciterPickerOpen(false); }}
                  >
                    {r.nameAr}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {playbackRate !== undefined && onSetPlaybackRate && (
          <>
            <button type="button" className="ayah-sheet__speed-toggle" onClick={() => setSpeedPickerOpen((v) => !v)}>
              <Gauge size={14} aria-hidden="true" />
              <span>سرعة التلاوة: {playbackRate}×</span>
              <ChevronDown size={14} aria-hidden="true" className={speedPickerOpen ? "is-open" : ""} />
            </button>
            {speedPickerOpen && (
              <div className="ayah-sheet__speed-list" role="listbox" aria-label="اختيار سرعة التلاوة">
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    role="option"
                    aria-selected={rate === playbackRate}
                    className={`ayah-sheet__speed-item${rate === playbackRate ? " is-active" : ""}`}
                    onClick={() => { onSetPlaybackRate(rate); setSpeedPickerOpen(false); }}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <button type="button" className="ayah-sheet__tafsir-toggle" onClick={handleToggleTafsir} aria-expanded={tafsirOpen}>
          <BookOpen size={14} aria-hidden="true" />
          <span>تفسير الآية</span>
          <ChevronDown size={14} aria-hidden="true" className={tafsirOpen ? "is-open" : ""} />
        </button>
        {tafsirOpen && (
          <div className="ayah-sheet__tafsir-body">
            <div className="ayah-sheet__tafsir-editions" role="tablist" aria-label="تفسير سريع">
              {quickEditions.map((ed) => (
                <button
                  key={ed.id}
                  type="button"
                  role="tab"
                  className={`ayah-sheet__tafsir-ed${tafsirEdition === ed.id ? " is-active" : ""}`}
                  aria-selected={tafsirEdition === ed.id}
                  onClick={() => handleSelectEdition(ed.id)}
                >
                  {ed.label}
                </button>
              ))}
            </div>
            <div className="ayah-sheet__tafsir-editions" role="tablist" aria-label="تفاسير إضافية">
              {moreEditions.map((ed) => (
                <button
                  key={ed.id}
                  type="button"
                  role="tab"
                  className={`ayah-sheet__tafsir-ed${tafsirEdition === ed.id ? " is-active" : ""}`}
                  aria-selected={tafsirEdition === ed.id}
                  onClick={() => handleSelectEdition(ed.id)}
                >
                  {ed.label}
                </button>
              ))}
            </div>
            <div className="aas-font-scale" aria-label="حجم خط التفسير">
              <button type="button" className="aas-font-scale__btn" onClick={() => bumpTafsirFont(-1)} aria-label="تصغير خط التفسير">
                <Minus size={14} aria-hidden="true" />
              </button>
              <span>{tafsirFont}px</span>
              <button type="button" className="aas-font-scale__btn" onClick={() => bumpTafsirFont(1)} aria-label="تكبير خط التفسير">
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
            {currentEditionMeta?.caution && (
              <p className="ayah-sheet__tafsir-caution">{currentEditionMeta.caution}</p>
            )}
            {tafsirLoading && !tafsirText ? (
              <p className="ayah-sheet__tafsir-status">جارٍ تحميل {currentEditionMeta?.label ?? "التفسير"}...</p>
            ) : tafsirError && !tafsirText ? (
              <p className="ayah-sheet__tafsir-status">تعذّر تحميل التفسير. تحقّق من اتصالك.</p>
            ) : tafsirText ? (
              <>
                <p className="ayah-sheet__tafsir-meta">
                  {currentEditionMeta?.label} — {currentEditionMeta?.author}
                </p>
                <p className="ayah-sheet__tafsir-text" style={{ fontSize: `${tafsirFont}px` }}>{tafsirText}</p>
                <button type="button" className="aas-action-btn is-active" style={{ width: "100%", marginTop: ".5rem" }} onClick={() => void handleSaveTafsirClip()}>
                  حفظ مقطع التفسير مع التدبّر
                </button>
              </>
            ) : (
              <p className="ayah-sheet__tafsir-status">تعذّر تحميل التفسير. تحقّق من اتصالك.</p>
            )}
          </div>
        )}

        <button type="button" className="ayah-sheet__tafsir-toggle" onClick={handleToggleTranslation} aria-expanded={translationOpen}>
          <Languages size={14} aria-hidden="true" />
          <span>ترجمة الآية</span>
          <ChevronDown size={14} aria-hidden="true" className={translationOpen ? "is-open" : ""} />
        </button>
        {translationOpen && (
          <div className="ayah-sheet__tafsir-body">
            <div className="ayah-sheet__tafsir-editions" role="tablist" aria-label="اختر الترجمة">
              {QURAN_TRANSLATION_EDITIONS.map((ed) => (
                <button
                  key={ed.id}
                  type="button"
                  role="tab"
                  className={`ayah-sheet__tafsir-ed${translationEdition === ed.id ? " is-active" : ""}`}
                  aria-selected={translationEdition === ed.id}
                  onClick={() => handleSelectTranslation(ed.id)}
                >
                  {ed.label}
                </button>
              ))}
            </div>
            {translationLoading && !translationText ? (
              <p className="ayah-sheet__tafsir-status">جارٍ تحميل الترجمة…</p>
            ) : translationError && !translationText ? (
              <p className="ayah-sheet__tafsir-status">تعذّر تحميل الترجمة.</p>
            ) : translationText ? (
              <>
                <p className="ayah-sheet__tafsir-meta">{currentTranslationMeta?.label}</p>
                <p className="ayah-sheet__tafsir-text" dir="auto" style={{ fontSize: `${tafsirFont}px` }}>{translationText}</p>
              </>
            ) : (
              <p className="ayah-sheet__tafsir-status">تعذّر تحميل الترجمة.</p>
            )}
          </div>
        )}

        {onSetLoop && onPlayFrom && onToggleHideVerse && (
          <>
            <button type="button" className="ayah-sheet__tafsir-toggle" onClick={() => setLoopOpen((v) => !v)} aria-expanded={loopOpen}>
              <Repeat size={14} aria-hidden="true" />
              <span>تكرار الحفظ المتقدّم</span>
              <ChevronDown size={14} aria-hidden="true" className={loopOpen ? "is-open" : ""} />
            </button>
            {loopOpen && (
              <MemorizationLoopPanel
                currentAyah={ayahNum}
                totalAyahs={totalAyahs}
                pageRange={pageRange}
                loopConfig={loopConfig}
                onSetLoop={onSetLoop}
                onPlayFrom={onPlayFrom}
                hideVerseTest={hideVerseTest}
                onToggleHideVerse={onToggleHideVerse}
              />
            )}
          </>
        )}

        {teachConfig && onTeachConfigChange && (
          <ReciteRepeatPanel
            config={teachConfig}
            phase={teachPhase === "student-pause" ? "student-pause" : teachPhase === "teacher" ? "teacher" : "idle"}
            onChange={onTeachConfigChange}
            onSkipPause={onSkipStudentPause}
          />
        )}

        {shareOpen && (
          <AyahShareCardPanel
            text={ayahText}
            surahName={surahName}
            ayahNum={ayahNum}
            surahNum={surahNum}
            translationText={translationText}
            tafsirSnippet={tafsirText}
          />
        )}

        <button type="button" className="ayah-sheet__tafsir-toggle" onClick={() => setCompareOpen((v) => !v)} aria-expanded={compareOpen}>
          <BookOpen size={14} aria-hidden="true" />
          <span>مقارنة التفاسير</span>
          <ChevronDown size={14} aria-hidden="true" className={compareOpen ? "is-open" : ""} />
        </button>
        <TafsirComparePanel surahNum={surahNum} ayahNum={ayahNum} open={compareOpen} />

        {ribbonOpen && (
          <div className="aas-ribbons" role="listbox" aria-label="تصنيف الإشارة المرجعية">
            {BOOKMARK_RIBBONS.map((r) => (
              <button
                key={r.id}
                type="button"
                role="option"
                className="aas-ribbon"
                style={{ ["--aas-ribbon" as string]: r.color }}
                onClick={() => applyBookmarkList(r.id)}
              >
                <span className="aas-ribbon__swatch" aria-hidden="true" />
                {r.label}
              </button>
            ))}
          </div>
        )}

        {noteOpen && (
          <div className="aas-panel__note">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="اكتب ملاحظتك على هذه الآية..."
              dir="rtl"
            />
            <button type="button" className="aas-action-btn is-active" style={{ marginTop: ".5rem", width: "100%" }} onClick={() => void handleSaveNote()}>
              {noteSaved ? <Check size={16} aria-hidden="true" /> : <StickyNote size={16} aria-hidden="true" />}
              {noteSaved ? "تم الحفظ" : "حفظ الملاحظة"}
            </button>
          </div>
        )}

        <div className="aas-panel__grid">
          <button type="button" className={`aas-action-btn ${bookmarked ? "is-active" : ""}`} onClick={toggleBookmark}>
            <Bookmark size={18} aria-hidden="true" fill={bookmarked ? "currentColor" : "none"} color={activeRibbon?.color} />
            {bookmarked ? (activeRibbon?.label ?? "محفوظة") : "إشارة مرجعية"}
          </button>
          <button type="button" className={`aas-action-btn ${noteOpen ? "is-active" : ""}`} onClick={() => setNoteOpen((v) => !v)}>
            <StickyNote size={18} aria-hidden="true" />
            ملاحظة
          </button>
          {canPlay && (
            <button type="button" className="aas-action-btn" onClick={onTogglePlay}>
              {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              {isPlaying ? "إيقاف" : "استماع"}
            </button>
          )}
          {canPlay && onToggleRepeat && (
            <button type="button" className={`aas-action-btn ${repeatOn ? "is-active" : ""}`} onClick={onToggleRepeat} aria-pressed={repeatOn}>
              <Repeat size={18} aria-hidden="true" />
              {repeatOn ? "التكرار: مُفعَّل" : "تكرار الآية"}
            </button>
          )}
          <button type="button" className="aas-action-btn" onClick={() => handleCopy(false)}>
            {copiedKind === "full" ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            نسخ بالتشكيل
          </button>
          <button type="button" className="aas-action-btn" onClick={() => handleCopy(true)}>
            {copiedKind === "plain" ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            نسخ بلا تشكيل
          </button>
          <button type="button" className={`aas-action-btn ${shareOpen ? "is-active" : ""}`} onClick={handleShareImage}>
            <Share2 size={18} aria-hidden="true" />
            بطاقة مشاركة
          </button>
          <button type="button" className={`aas-action-btn ${voiceBusy ? "is-active" : ""}`} onClick={() => void handleVoiceBookmark()}>
            <Mic size={18} aria-hidden="true" />
            {voiceBusy ? "إيقاف التسجيل" : "إشارة صوتية"}
          </button>
          {reciterId && (
            <button type="button" className={`aas-action-btn ${downloadDone ? "is-active" : ""}`} onClick={() => void handleDownloadSurah()} disabled={downloadBusy}>
              <Download size={18} aria-hidden="true" />
              {downloadBusy ? "جارٍ…" : downloadDone ? "السورة محفوظة" : "تنزيل السورة"}
            </button>
          )}
          {onPrev && (
            <button type="button" className="aas-action-btn" onClick={onPrev}>
              <ChevronRight size={18} aria-hidden="true" />
              الآية السابقة
            </button>
          )}
          {onNext && (
            <button type="button" className="aas-action-btn" onClick={onNext}>
              <ChevronLeft size={18} aria-hidden="true" />
              الآية التالية
            </button>
          )}
          <a
            className="aas-action-btn aas-action-btn--report"
            href={`mailto:${CONTACT_EMAIL}?subject=${reportSubject}&body=${reportBody}`}
          >
            <Flag size={18} aria-hidden="true" />
            إبلاغ عن خطأ
          </a>
        </div>
      </div>
    </div>
  );
}

export default PageAyahActionSheet;
