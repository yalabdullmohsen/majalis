import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Pause, Play, Repeat, Copy, Check, BookOpen, Compass, Mic2, ChevronDown, X, StickyNote,
} from "lucide-react";
import { RECITERS } from "@/lib/quran-audio";
import { copyAyahText, copyAyahTextPlain } from "@/lib/share-ayah";
import { fetchTafsirAyahs } from "@/lib/quran-api";
import { getNote, saveNote } from "@/lib/quran-personal";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ExploreAyahPanel } from "@/components/quran/ExploreAyahPanel";
import type { PlayerState } from "@/hooks/useAyahPlayer";

/**
 * Bottom Sheet مُوحَّد لفعل واحد على آية — يستبدل الأزرار الكبيرة الدائمة
 * (تشغيل/نسخ) التي كانت تظهر لكل آية في القارئ القديم (المرحلة 8). يفتح
 * عند الضغط أو الضغط المطوَّل على آية.
 *
 * الأفعال المُنفَّذة فعليًا (تُعيد استخدام بنية تحتية قائمة، لا محركات
 * موازية): استماع + اختيار قارئ (useAyahPlayer + RECITERS الموجودان)،
 * تكرار (توليف فوق useAyahPlayer)، نسخ مع/دون تشكيل (copyAyahText /
 * copyAyahTextPlain — الثانية تزيل الحركات فقط بلا توحيد همزات، مضافة
 * الآن)، حفظ (FavoriteButton بجدول bookmarks الحقيقي،
 * تحقّقتُ من RLS حيًّا)، **ملاحظة شخصية** (quran-personal.ts — كان مبنيًّا
 * فعليًا محليًا (localStorage) منذ جلسة سابقة لكن بلا أي واجهة تستخدمه؛
 * الفجوة الموثَّقة صراحة أدناه كانت "غير منفَّذ" — أُغلقت الآن)، تفسير
 * (fetchTafsirAyahs — نص حي من نفس مصدر القرآن المعتمد AlQuran Cloud،
 * إصدار "ar.muyassar" التفسير الميسّر)، واستكشاف المزيد (ExploreAyahPanel
 * الموجود مسبقًا، بحث عبر محتوى المنصة).
 *
 * لا يزال غير مُنفَّذ عمدًا (بلا مصدر is_approved محلي تحقَّقت منه): "أسباب
 * نزول ومعاني كلمات" — موثَّق في التقرير النهائي كعمل متبقٍ، لا زرًا
 * معطَّلًا وهميًا.
 *
 * ملاحظة دمج: يستخدمه MushafPage.tsx (قارئ /mushaf التقليدي بالسورة).
 * قارئ الصفحات /mushaf/page (MushafPageView.tsx) يستخدم مكوّنًا منفصلًا
 * بواجهة props مختلفة تمامًا: PageAyahActionSheet.tsx.
 */
type Props = {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  ayahText: string;
  playerState: PlayerState;
  isCurrentAyah: boolean;
  reciterId: string;
  onSetReciter: (id: string) => void;
  onTogglePlay: () => void;
  repeatOn: boolean;
  onToggleRepeat: () => void;
  onClose: () => void;
};

export function AyahActionSheet({
  surahNumber, surahName, ayahNumberInSurah, ayahText,
  playerState, isCurrentAyah, reciterId, onSetReciter, onTogglePlay,
  repeatOn, onToggleRepeat, onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedPlain, setCopiedPlain] = useState(false);
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => getNote(surahNumber, ayahNumberInSurah));
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const isPlaying = isCurrentAyah && playerState === "playing";
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  const contentId = `${surahNumber}:${ayahNumberInSurah}`;

  const handleCopy = async () => {
    const ok = await copyAyahText(ayahText, surahName, ayahNumberInSurah);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleCopyPlain = async () => {
    const ok = await copyAyahTextPlain(ayahText, surahName, ayahNumberInSurah);
    if (ok) {
      setCopiedPlain(true);
      setTimeout(() => setCopiedPlain(false), 1800);
    }
  };

  const handleSaveNote = () => {
    saveNote(surahNumber, ayahNumberInSurah, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  };

  const handleToggleTafsir = async () => {
    const next = !tafsirOpen;
    setTafsirOpen(next);
    if (next && tafsirText === null && !tafsirLoading) {
      setTafsirLoading(true);
      setTafsirError(false);
      try {
        const ayahs = await fetchTafsirAyahs(surahNumber, "ar.muyassar");
        const found = ayahs.find((a) => a.numberInSurah === ayahNumberInSurah);
        setTafsirText(found?.text ?? null);
        if (!found) setTafsirError(true);
      } catch {
        setTafsirError(true);
      } finally {
        setTafsirLoading(false);
      }
    }
  };

  if (exploreOpen) {
    return (
      <ExploreAyahPanel
        surahNum={surahNumber}
        ayahNum={ayahNumberInSurah}
        surahName={surahName}
        ayahText={ayahText}
        onClose={() => { setExploreOpen(false); onClose(); }}
      />
    );
  }

  return createPortal(
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    <div className="ayah-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="ayah-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`إجراءات الآية ${ayahNumberInSurah} من سورة ${surahName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ayah-sheet__handle" aria-hidden="true" />

        <div className="ayah-sheet__head">
          <p className="ayah-sheet__meta">سورة {surahName} · آية {ayahNumberInSurah}</p>
          <button type="button" className="ayah-sheet__close" onClick={onClose} aria-label="إغلاق">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <p dir="rtl" lang="ar" className="ayah-sheet__preview" style={{ fontFamily: "var(--font-quran)" }}>
          {ayahText}
        </p>

        {noteOpen && (
          <div className="ayah-sheet__note">
            <textarea
              className="ayah-sheet__note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="اكتب ملاحظتك على هذه الآية..."
              dir="rtl"
              rows={3}
            />
            <button type="button" className="ayah-sheet__note-save" onClick={handleSaveNote}>
              {noteSaved ? <Check size={14} aria-hidden="true" /> : <StickyNote size={14} aria-hidden="true" />}
              <span>{noteSaved ? "تم الحفظ" : "حفظ الملاحظة"}</span>
            </button>
          </div>
        )}

        <div className="ayah-sheet__actions">
          <button type="button" className={`ayah-sheet__action${isPlaying ? " is-active" : ""}`} onClick={onTogglePlay}>
            {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            <span>{isPlaying ? "إيقاف" : "استماع"}</span>
          </button>

          <button type="button" className={`ayah-sheet__action${repeatOn ? " is-active" : ""}`} onClick={onToggleRepeat} aria-pressed={repeatOn}>
            <Repeat size={18} aria-hidden="true" />
            <span>تكرار</span>
          </button>

          <button type="button" className="ayah-sheet__action" onClick={handleCopy}>
            {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            <span>{copied ? "نُسخت" : "نسخ"}</span>
          </button>

          <button type="button" className="ayah-sheet__action" onClick={handleCopyPlain}>
            {copiedPlain ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            <span>{copiedPlain ? "نُسخت" : "نسخ بلا تشكيل"}</span>
          </button>

          <div className="ayah-sheet__action ayah-sheet__action--fav">
            <FavoriteButton contentType="quran_ayah" contentId={contentId} compact />
          </div>

          <button type="button" className={`ayah-sheet__action${noteOpen ? " is-active" : ""}`} onClick={() => setNoteOpen((v) => !v)}>
            <StickyNote size={18} aria-hidden="true" />
            <span>ملاحظة</span>
          </button>

          <button type="button" className="ayah-sheet__action" onClick={() => setExploreOpen(true)}>
            <Compass size={18} aria-hidden="true" />
            <span>استكشف</span>
          </button>
        </div>

        <button type="button" className="ayah-sheet__reciter-toggle" onClick={() => setReciterPickerOpen((v) => !v)}>
          <Mic2 size={14} aria-hidden="true" />
          <span>القارئ: {reciter.nameAr}</span>
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

        <button type="button" className="ayah-sheet__tafsir-toggle" onClick={handleToggleTafsir} aria-expanded={tafsirOpen}>
          <BookOpen size={14} aria-hidden="true" />
          <span>التفسير الميسّر</span>
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
      </div>
    </div>,
    document.body,
  );
}

export default AyahActionSheet;
