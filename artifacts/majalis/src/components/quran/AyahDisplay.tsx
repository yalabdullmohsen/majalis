import { useEffect, useRef, useState } from "react";
import { BookmarkCheck, PenLine } from "lucide-react";
import type { Ayah } from "@/lib/quran-api";
import type { PlayerState } from "@/hooks/useAyahPlayer";
import { copyAyahText, shareAyahAsImage } from "@/lib/share-ayah";
import { addBookmark, removeBookmark, isBookmarked, saveNote, getNote } from "@/lib/quran-personal";
import { ExploreAyahPanel } from "@/components/quran/ExploreAyahPanel";

type Props = {
  ayahs: Ayah[];
  surahNum: number;
  surahName: string;
  targetAyah: number;
  currentPlayingAyah: number | null;
  playerState: PlayerState;
  fontScale: number;
  showAyahNumbers: boolean;
  onPlayAyah: (ayah: number) => void;
  onAyahClick: (ayah: number) => void;
};

const AYAHS_PER_PAGE = 15;

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toArabic(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[+d]);
}

// ── Inline note form ──────────────────────────────────────────────────────
function NoteForm({
  surahNum,
  ayahNum,
  onClose,
}: {
  surahNum: number;
  ayahNum: number;
  onClose: () => void;
}) {
  const [text, setText] = useState(() => getNote(surahNum, ayahNum));
  return (
    <div className="ayd-note-wrap">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="أضف ملاحظتك الشخصية هنا..."
        dir="rtl"
        rows={3}
        autoFocus
        className="ayd-note-textarea"
      />
      <div className="ayd-note-actions">
        <button type="button" onClick={onClose} className="ayd-note-cancel">
          إلغاء
        </button>
        <button
          type="button"
          onClick={() => { saveNote(surahNum, ayahNum, text); onClose(); }}
          className="ayd-note-save"
        >
          حفظ
        </button>
      </div>
    </div>
  );
}

export function AyahDisplay({
  ayahs,
  surahNum,
  surahName,
  targetAyah,
  currentPlayingAyah,
  playerState,
  fontScale,
  showAyahNumbers,
  onPlayAyah,
}: Props) {
  const [page, setPage] = useState(0);
  const [contextAyah, setContextAyah] = useState<Ayah | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [exploreAyah, setExploreAyah] = useState<Ayah | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pressStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { setPage(0); }, [surahNum]);

  useEffect(() => {
    if (targetAyah > 0) {
      setPage(Math.floor((targetAyah - 1) / AYAHS_PER_PAGE));
    }
  }, [targetAyah]);

  // Update bookmarked status when context ayah changes
  useEffect(() => {
    if (!contextAyah) return;
    setBookmarked(isBookmarked(surahNum, contextAyah.numberInSurah));
  }, [contextAyah, surahNum]);

  const totalPages = Math.max(1, Math.ceil(ayahs.length / AYAHS_PER_PAGE));
  const visibleAyahs = ayahs.slice(page * AYAHS_PER_PAGE, (page + 1) * AYAHS_PER_PAGE);
  const isSurahWithoutBismillah = surahNum === 1 || surahNum === 9;

  // بيانات بصرية فقط — لا تعديل على النص
  const juzNum  = visibleAyahs[0]?.juz  ?? null;
  const pageNum = visibleAyahs[0]?.page ?? null;

  function startPress(ayah: Ayah, e: React.PointerEvent) {
    pressStartPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      setContextAyah(ayah);
      setShowNote(false);
    }, 520);
  }

  function endPress(e: React.PointerEvent) {
    clearTimeout(longPressTimer.current);
    if (pressStartPos.current) {
      const dx = Math.abs(e.clientX - pressStartPos.current.x);
      const dy = Math.abs(e.clientY - pressStartPos.current.y);
      if (dx > 10 || dy > 10) { pressStartPos.current = null; return; }
    }
    pressStartPos.current = null;
  }

  function cancelPress() {
    clearTimeout(longPressTimer.current);
    pressStartPos.current = null;
  }

  const closeContext = () => {
    setContextAyah(null);
    setShowNote(false);
  };

  async function handleContextCopy() {
    if (!contextAyah) return;
    await copyAyahText(contextAyah.text, surahName, contextAyah.numberInSurah);
    setCopied(true);
    setTimeout(() => { setCopied(false); closeContext(); }, 1500);
  }

  async function handleContextShare() {
    if (!contextAyah || sharing) return;
    setSharing(true);
    try {
      await shareAyahAsImage({
        text: contextAyah.text,
        surahName,
        ayahNum: contextAyah.numberInSurah,
        surahNum,
      });
    } finally {
      setSharing(false);
      closeContext();
    }
  }

  function handleContextPlay() {
    if (!contextAyah) return;
    onPlayAyah(contextAyah.numberInSurah);
    closeContext();
  }

  function handleToggleBookmark() {
    if (!contextAyah) return;
    if (bookmarked) {
      removeBookmark(surahNum, contextAyah.numberInSurah);
      setBookmarked(false);
    } else {
      addBookmark({
        surahNum,
        ayahNum: contextAyah.numberInSurah,
        surahName,
        text: contextAyah.text,
      });
      setBookmarked(true);
    }
  }

  return (
    <div
      className="qs-ayah-display"
      dir="rtl"
      style={{ "--qs-font-size": `${fontScale}px` } as React.CSSProperties}
    >
      {/* ── Surah header ── */}
      <header className="qs-surah-header">
        <h2 className="qs-surah-header__title" lang="ar">{surahName}</h2>
        <p className="qs-surah-header__hint">اضغط مطوّلاً على أي آية للخيارات</p>
      </header>

      {/* ── إطار المصحف الذهبي — بصري خالص — النص داخله لا يُمس مطلقاً ── */}
      <div className="qs-mushaf-frame">

        {/* زخارف الزوايا الأربع */}
        <span className="qs-mushaf-corner qs-mushaf-corner--tl" aria-hidden="true">✦</span>
        <span className="qs-mushaf-corner qs-mushaf-corner--tr" aria-hidden="true">✦</span>
        <span className="qs-mushaf-corner qs-mushaf-corner--bl" aria-hidden="true">✦</span>
        <span className="qs-mushaf-corner qs-mushaf-corner--br" aria-hidden="true">✦</span>

        {/* سطر رأس الصفحة: اسم السورة يمين + الجزء يسار */}
        {juzNum !== null && (
          <div className="qs-mushaf-header-row" aria-hidden="true" dir="rtl">
            <span>{surahName}</span>
            <span>الجزء {toArabic(juzNum)}</span>
          </div>
        )}

        {/* صندوق اسم السورة — مستطيل بحد ذهبي */}
        <div className="qs-surah-name-box" aria-hidden="true" dir="rtl">
          <span className="qs-surah-name-box__orn">❖</span>
          <span className="qs-surah-name-box__title">{surahName}</span>
          <span className="qs-surah-name-box__orn">❖</span>
        </div>

        {/* البسملة — فوق النص مباشرة، داخل الإطار */}
        {!isSurahWithoutBismillah && (
          <p className="qs-bismillah" lang="ar" dir="rtl" aria-label="بسم الله الرحمن الرحيم">
            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
          </p>
        )}

      <div
        className="qs-mushaf-body qs-mushaf-clean"
        lang="ar"
        dir="rtl"
        aria-label={`نص سورة ${surahName}`}
      >
        {visibleAyahs.map((ayah) => {
          const isPlaying = ayah.numberInSurah === currentPlayingAyah;
          const hasNote = !!getNote(surahNum, ayah.numberInSurah);
          return (
            <span
              key={ayah.numberInSurah}
              id={`ayah-${ayah.numberInSurah}`}
              className={[
                "qs-ayah-inline",
                isPlaying ? "qs-ayah-inline--playing" : "",
              ].filter(Boolean).join(" ")}
              onPointerDown={(e) => startPress(ayah, e)}
              onPointerUp={endPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
              onContextMenu={(e) => e.preventDefault()}
            >
              <span className="qs-ayah-inline__text">{ayah.text}</span>
              {showAyahNumbers && (
                <span className="qs-ayah-num" aria-hidden="true">
                  {toArabic(ayah.numberInSurah)}
                </span>
              )}
              {/* مؤشر الإشارة المرجعية */}
              {isBookmarked(surahNum, ayah.numberInSurah) && (
                <span aria-hidden="true" title="مؤشر مرجعي" className="ayd-inline-icon ayd-inline-icon--bookmark"><BookmarkCheck size={12} /></span>
              )}
              {/* مؤشر الملاحظة */}
              {hasNote && (
                <span aria-hidden="true" title="يوجد ملاحظة" className="ayd-inline-icon ayd-inline-icon--note"><PenLine size={12} /></span>
              )}
            </span>
          );
        })}
      </div>

        {/* تذييل الصفحة: رقم الصفحة + خطان زخرفيان */}
        {pageNum !== null && (
          <div className="qs-mushaf-footer-row" aria-hidden="true">
            <span className="qs-mushaf-footer-row__line" />
            <span className="qs-mushaf-footer-row__page">{toArabic(pageNum)}</span>
            <span className="qs-mushaf-footer-row__line" />
          </div>
        )}

      </div>{/* /qs-mushaf-frame */}

      {/* ── Page navigation ── */}
      {totalPages > 1 && (
        <nav className="qs-page-nav" aria-label="تنقل بين صفحات السورة">
          <button
            type="button"
            className="qs-page-nav__btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="الصفحة السابقة"
          >
            ‹ السابق
          </button>
          <span className="qs-page-nav__badge">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="qs-page-nav__btn"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            aria-label="الصفحة التالية"
          >
            التالي ›
          </button>
        </nav>
      )}

      {/* ── Now playing indicator ── */}
      {currentPlayingAyah !== null && playerState !== "idle" && (
        <div className="qs-now-playing" aria-live="polite" aria-atomic="true">
          <span className={`qs-now-playing__dot${playerState === "playing" ? " qs-now-playing__dot--active" : ""}`} />
          <span className="qs-now-playing__label">
            {playerState === "loading" && "جاري تحميل الصوت…"}
            {playerState === "playing" && `يُشغَّل الآية ${currentPlayingAyah}`}
            {playerState === "paused" && `متوقف مؤقتاً — الآية ${currentPlayingAyah}`}
            {playerState === "error" && "خطأ في تحميل الصوت"}
          </span>
        </div>
      )}

      {/* ── Long press context sheet ── */}
      {contextAyah && (
        <>
          <div
            className="qs-context-overlay"
            onClick={closeContext}
            aria-hidden="true"
          />
          <div
            className="qs-context-sheet qs-context-sheet--safe"
            role="dialog"
            aria-modal="true"
            aria-label="خيارات الآية"
          >
            <div className="qs-context-sheet__handle" aria-hidden="true" />
            <p className="qs-context-sheet__ref">
              سورة {surahName} — آية {contextAyah.numberInSurah}
            </p>

            {/* Note form inline */}
            {showNote ? (
              <NoteForm
                surahNum={surahNum}
                ayahNum={contextAyah.numberInSurah}
                onClose={() => setShowNote(false)}
              />
            ) : (
              <>
                {/* Primary: Explore */}
                <button
                  type="button"
                  className="qs-context-sheet__btn qs-context-sheet__btn--primary qs-context-sheet__btn--explore"
                  onClick={() => { setExploreAyah(contextAyah); setShowExplore(true); setContextAyah(null); }}
                >
                  <span aria-hidden="true">🔗</span> استكشف الآية
                </button>

                <button
                  type="button"
                  className="qs-context-sheet__btn qs-context-sheet__btn--primary"
                  onClick={handleContextPlay}
                >
                  <span aria-hidden="true">▶</span> استماع
                </button>

                <button
                  type="button"
                  className="qs-context-sheet__btn"
                  onClick={handleContextCopy}
                >
                  <span aria-hidden="true">⎘</span> {copied ? "تم النسخ ✓" : "نسخ الآية"}
                </button>

                <button
                  type="button"
                  className="qs-context-sheet__btn"
                  onClick={handleContextShare}
                  disabled={sharing}
                >
                  <span aria-hidden="true">🖼</span> {sharing ? "جارٍ التصدير…" : "مشاركة كصورة"}
                </button>

                <button
                  type="button"
                  className={`qs-context-sheet__btn${bookmarked ? " qs-context-sheet__btn--bookmarked" : ""}`}
                  onClick={handleToggleBookmark}
                >
                  <BookmarkCheck size={14} fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />{" "}
                  {bookmarked ? "في المفضلة" : "أضف للمفضلة"}
                </button>

                <button
                  type="button"
                  className="qs-context-sheet__btn"
                  onClick={() => setShowNote(true)}
                >
                  <PenLine size={14} aria-hidden="true" /> ملاحظة شخصية
                </button>

                <button
                  type="button"
                  className="qs-context-sheet__btn qs-context-sheet__btn--close"
                  onClick={closeContext}
                >
                  إغلاق
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Explore Ayah Panel ── */}
      {showExplore && exploreAyah && (
        <ExploreAyahPanel
          surahNum={surahNum}
          ayahNum={exploreAyah.numberInSurah}
          surahName={surahName}
          ayahText={exploreAyah.text}
          onClose={() => { setShowExplore(false); setExploreAyah(null); }}
        />
      )}
    </div>
  );
}
