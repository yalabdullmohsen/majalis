import { useEffect, useState } from "react";
import { X, Copy, Check, Bookmark, StickyNote, Play, Pause, ChevronRight, ChevronLeft, ChevronDown, Flag, BookOpen, Mic2, Repeat, Gauge } from "lucide-react";
import { copyAyahText, copyAyahTextPlain } from "@/lib/share-ayah";
import { addBookmark, removeBookmark, isBookmarked, getNote, saveNote } from "@/lib/quran-personal";
import { fetchTafsirAyahs } from "@/lib/quran-api";
import { RECITERS } from "@/lib/quran-audio";
import { CONTACT_EMAIL } from "@/lib/site-config";

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
  isPlaying: boolean;
  onTogglePlay: () => void;
  /** false على الصفحات النادرة التي تضم سورتين — مشغّل الصوت مربوط بسورة واحدة فقط لكل صفحة (راجع MushafPageView). */
  canPlay?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  /** اختياريان — عند تمريرهما فقط يظهر منتقي القارئ (لا يكسر MushafPageView.tsx القائم الذي لا يمرّرهما). */
  reciterId?: string;
  onSetReciter?: (id: string) => void;
  /** اختياريان أيضًا — سرعة التلاوة (0.5x–2x) وتكرار الآية للحفظ. */
  playbackRate?: number;
  onSetPlaybackRate?: (rate: number) => void;
  repeatOn?: boolean;
  onToggleRepeat?: () => void;
};

export function PageAyahActionSheet({ surahNum, surahName, ayahNum, ayahText, isPlaying, onTogglePlay, canPlay = true, onPrev, onNext, onClose, reciterId, onSetReciter, playbackRate, onSetPlaybackRate, repeatOn, onToggleRepeat }: Props) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(surahNum, ayahNum));
  const [copiedKind, setCopiedKind] = useState<"full" | "plain" | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => getNote(surahNum, ayahNum));
  const [noteSaved, setNoteSaved] = useState(false);
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [speedPickerOpen, setSpeedPickerOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(surahNum, ayahNum));
    setNoteText(getNote(surahNum, ayahNum));
    setCopiedKind(null);
    setNoteOpen(false);
    setNoteSaved(false);
    setTafsirOpen(false);
    setTafsirText(null);
    setTafsirError(false);
  }, [surahNum, ayahNum]);

  const handleToggleTafsir = async () => {
    const next = !tafsirOpen;
    setTafsirOpen(next);
    if (next && tafsirText === null && !tafsirLoading) {
      setTafsirLoading(true);
      setTafsirError(false);
      try {
        const ayahs = await fetchTafsirAyahs(surahNum, "ar.muyassar");
        const found = ayahs.find((a) => a.numberInSurah === ayahNum);
        setTafsirText(found?.text ?? null);
        if (!found) setTafsirError(true);
      } catch {
        setTafsirError(true);
      } finally {
        setTafsirLoading(false);
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    const ok = plain ? await copyAyahTextPlain(ayahText, surahName, ayahNum) : await copyAyahText(ayahText, surahName, ayahNum);
    if (ok) {
      setCopiedKind(plain ? "plain" : "full");
      setTimeout(() => setCopiedKind((k) => (k === (plain ? "plain" : "full") ? null : k)), 1800);
    }
  };

  const handleSaveNote = () => {
    saveNote(surahNum, ayahNum, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  };

  const reportSubject = encodeURIComponent(`تصحيح نص قرآني — سورة ${surahName} آية ${ayahNum}`);
  const reportBody = encodeURIComponent(
    `الصفحة: ${window.location.href}\nسورة: ${surahName} (${surahNum})\nآية: ${ayahNum}\n\nالملاحظة:\n`,
  );

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions */
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
          <span>تفسير الآية (الميسّر)</span>
          <ChevronDown size={14} aria-hidden="true" className={tafsirOpen ? "is-open" : ""} />
        </button>
        {tafsirOpen && (
          <div className="ayah-sheet__tafsir-body">
            {tafsirLoading ? (
              <p className="ayah-sheet__tafsir-status">جارٍ التحميل...</p>
            ) : tafsirError || !tafsirText ? (
              <p className="ayah-sheet__tafsir-status">تعذّر تحميل التفسير. تحقّق من اتصالك.</p>
            ) : (
              <p className="ayah-sheet__tafsir-text">{tafsirText}</p>
            )}
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
            <button type="button" className="aas-action-btn is-active" style={{ marginTop: ".5rem", width: "100%" }} onClick={handleSaveNote}>
              {noteSaved ? <Check size={16} aria-hidden="true" /> : <StickyNote size={16} aria-hidden="true" />}
              {noteSaved ? "تم الحفظ" : "حفظ الملاحظة"}
            </button>
          </div>
        )}

        <div className="aas-panel__grid">
          <button type="button" className={`aas-action-btn ${bookmarked ? "is-active" : ""}`} onClick={toggleBookmark}>
            <Bookmark size={18} aria-hidden="true" fill={bookmarked ? "currentColor" : "none"} />
            {bookmarked ? "محفوظة" : "إشارة مرجعية"}
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
