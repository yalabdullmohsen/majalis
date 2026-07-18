import { useEffect, useState } from "react";
import { X, Copy, Check, Share2, Bookmark, StickyNote, Play, Pause, ChevronRight, ChevronLeft, Flag, Image as ImageIcon } from "lucide-react";
import { copyAyahText, copyAyahTextPlain, shareAyahAsText, shareAyahAsImage } from "@/lib/share-ayah";
import { addBookmark, removeBookmark, isBookmarked, getNote, saveNote } from "@/lib/quran-personal";
import { CONTACT_EMAIL } from "@/lib/site-config";

/**
 * ورقة إجراءات الآية — القسم "ز. التفاعل مع الآية" من مواصفة نواة المصحف
 * الرقمي. تربط أدوات كانت موجودة فعليًا لكنها غير مُستخدَمة في أي واجهة:
 * quran-personal.ts (إشارات مرجعية وملاحظات — محلي بالكامل، لا خادم) و
 * share-ayah.ts (نسخ/مشاركة نص وصورة).
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
};

export function AyahActionSheet({ surahNum, surahName, ayahNum, ayahText, isPlaying, onTogglePlay, canPlay = true, onPrev, onNext, onClose }: Props) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(surahNum, ayahNum));
  const [copiedKind, setCopiedKind] = useState<"full" | "plain" | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => getNote(surahNum, ayahNum));
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(surahNum, ayahNum));
    setNoteText(getNote(surahNum, ayahNum));
    setCopiedKind(null);
    setNoteOpen(false);
    setNoteSaved(false);
  }, [surahNum, ayahNum]);

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
          <button type="button" className="aas-action-btn" onClick={() => handleCopy(false)}>
            {copiedKind === "full" ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            نسخ بالتشكيل
          </button>
          <button type="button" className="aas-action-btn" onClick={() => handleCopy(true)}>
            {copiedKind === "plain" ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            نسخ بلا تشكيل
          </button>
          <button type="button" className="aas-action-btn" onClick={() => shareAyahAsText(ayahText, surahName, ayahNum)}>
            <Share2 size={18} aria-hidden="true" />
            مشاركة نص
          </button>
          <button type="button" className="aas-action-btn" onClick={() => shareAyahAsImage({ text: ayahText, surahName, ayahNum, surahNum })}>
            <ImageIcon size={18} aria-hidden="true" />
            مشاركة صورة
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
