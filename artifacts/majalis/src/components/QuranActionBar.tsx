/**
 * QuranActionBar — floating bottom sheet for a selected ayah.
 * Play · Tafseer · Bookmark · Repeat · Share
 * Wired to QuranEngineContext + DatabaseManager; Framer Motion slide-up/down.
 */
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Bookmark,
  Pause,
  Play,
  Repeat,
  Share2,
  X,
} from "lucide-react";
import { getSurahMeta, fetchTafsirAyahs } from "@/lib/quran-api";
import {
  addBookmark,
  isBookmarked,
  removeBookmark,
} from "@/lib/quran-personal";
import { shareAyahAsImage } from "@/lib/share-ayah-card";
import { getDatabaseManager } from "@/core/quran/DatabaseManager";
import { useQuranEngineCore } from "@/core/quran/QuranEngineContext";
import "@/styles/quran-action-bar.css";

export type QuranActionBarAyah = {
  surah: number;
  ayah: number;
  verseKey: string;
  page: number;
  text: string;
};

export type QuranActionBarProps = {
  ayah: QuranActionBarAyah | null;
  onClose: () => void;
};

const QUICK_TAFSIR = "ar.muyassar";

export function QuranActionBar({ ayah, onClose }: QuranActionBarProps) {
  const reduceMotion = useReducedMotion();
  const {
    updateReadingProgress,
    togglePlayAyah,
    pauseAudio,
    setRepeatMode,
    audio,
  } = useQuranEngineCore();
  const db = getDatabaseManager();

  const [playing, setPlaying] = useState(false);
  const [repeatOn, setRepeatOn] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const surahName = ayah ? getSurahMeta(ayah.surah).name : "";

  // Mirror AudioEngine state for the selected ayah
  useEffect(() => {
    return audio.on("onStateChange", (snap) => {
      if (!ayah) {
        setPlaying(false);
        return;
      }
      const isThis =
        snap.surah === ayah.surah &&
        snap.ayah === ayah.ayah &&
        (snap.playerState === "playing" ||
          snap.playerState === "buffering" ||
          snap.playerState === "loading");
      setPlaying(isThis);
      setRepeatOn(snap.repeatMode === "ayah");
      if (snap.playerState === "error") {
        setStatusMsg("تعذّر تشغيل التلاوة");
      }
    });
  }, [audio, ayah]);

  // Sync bookmark flag when ayah changes + seek audio if already playing
  useEffect(() => {
    if (!ayah) {
      setBookmarked(false);
      setTafsirOpen(false);
      setTafsirText(null);
      setTafsirError(false);
      setPlaying(false);
      return;
    }
    setBookmarked(isBookmarked(ayah.surah, ayah.ayah));
    setTafsirOpen(false);
    setTafsirText(null);
    setTafsirError(false);
    setStatusMsg(null);
    setRepeatOn(audio.getRepeatMode() === "ayah");
    void updateReadingProgress({
      surah: ayah.surah,
      ayah: ayah.ayah,
      page: ayah.page,
    });
    // Seek when playback is already active
    void audio.seekToAyah(ayah.surah, ayah.ayah).catch(() => undefined);
  }, [ayah, updateReadingProgress, audio]);

  const stopAudio = useCallback(() => {
    pauseAudio();
    setPlaying(false);
  }, [pauseAudio]);

  const togglePlay = useCallback(async () => {
    if (!ayah) return;
    try {
      await togglePlayAyah(ayah.surah, ayah.ayah);
      setStatusMsg(null);
    } catch {
      setPlaying(false);
      setStatusMsg("تعذّر تشغيل التلاوة");
    }
  }, [ayah, togglePlayAyah]);

  const openTafsir = useCallback(async () => {
    if (!ayah) return;
    setTafsirOpen(true);
    if (tafsirText) return;
    setTafsirLoading(true);
    setTafsirError(false);
    try {
      const rows = await fetchTafsirAyahs(ayah.surah, QUICK_TAFSIR);
      const hit = rows.find((r) => r.numberInSurah === ayah.ayah);
      const text = hit?.text?.trim() || null;
      setTafsirText(text);
      if (!text) setTafsirError(true);
    } catch {
      setTafsirError(true);
      setTafsirText(null);
    } finally {
      setTafsirLoading(false);
    }
  }, [ayah, tafsirText]);

  const toggleBookmark = useCallback(async () => {
    if (!ayah) return;
    try {
      if (bookmarked) {
        removeBookmark(ayah.surah, ayah.ayah);
        await db.deleteReflection(`bk:${ayah.surah}:${ayah.ayah}`);
        setBookmarked(false);
        setStatusMsg("أُزيلت الإشارة");
      } else {
        addBookmark({
          surahNum: ayah.surah,
          ayahNum: ayah.ayah,
          surahName,
          text: ayah.text,
        });
        await db.upsertReflection({
          id: `bk:${ayah.surah}:${ayah.ayah}`,
          surah_id: ayah.surah,
          ayah_id: ayah.ayah,
          note_text: ayah.text,
          bookmark_color: "#B08D2E",
          tags: ["bookmark", "المفضلة"],
          sync_status: "pending",
        });
        setBookmarked(true);
        setStatusMsg("حُفظت الإشارة");
      }
    } catch {
      setStatusMsg("تعذّر حفظ الإشارة");
    }
  }, [ayah, bookmarked, db, surahName]);

  const toggleRepeat = useCallback(() => {
    const next = !repeatOn;
    setRepeatMode(next ? "ayah" : "none");
    setRepeatOn(next);
    setStatusMsg(next ? "تكرار مفعّل للحفظ" : "أُوقف التكرار");
  }, [repeatOn, setRepeatMode]);

  const shareCard = useCallback(async () => {
    if (!ayah) return;
    setSharing(true);
    try {
      await shareAyahAsImage({
        text: ayah.text,
        surahName,
        ayahNum: ayah.ayah,
        surahNum: ayah.surah,
        theme: "emerald-gradient",
        format: "png",
      });
      setStatusMsg("جاهزة للمشاركة");
    } catch {
      setStatusMsg("تعذّرت المشاركة");
    } finally {
      setSharing(false);
    }
  }, [ayah, surahName]);

  const handleClose = useCallback(() => {
    stopAudio();
    setTafsirOpen(false);
    onClose();
  }, [onClose, stopAudio]);

  const open = Boolean(ayah);
  const sheetY = reduceMotion ? 0 : 24;

  return (
    <AnimatePresence>
      {open && ayah ? (
        <>
          <motion.button
            key="qab-scrim"
            type="button"
            className="qab-scrim qab-scrim--fixed"
            aria-label="إغلاق شريط الآية"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />
          <motion.div
            key={`qab-sheet-${ayah.verseKey}`}
            className="qab-sheet qab-sheet--fixed"
            role="dialog"
            aria-modal="true"
            aria-label={`إجراءات الآية ${ayah.verseKey}`}
            initial={reduceMotion ? false : { y: sheetY + 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: sheetY + 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
          >
            <div className="qab-handle" aria-hidden />
            <header className="qab-header">
              <div className="qab-meta">
                <span className="qab-ref">
                  {surahName} · آية {ayah.ayah}
                </span>
                <span className="qab-page">ص {ayah.page}</span>
              </div>
              <button
                type="button"
                className="qab-close"
                onClick={handleClose}
                aria-label="إغلاق"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </header>

            <p className="qab-ayah-preview" dir="rtl">
              {ayah.text.length > 160 ? `${ayah.text.slice(0, 160)}…` : ayah.text}
            </p>

            <div className="qab-actions" role="toolbar" aria-label="إجراءات سريعة">
              <button
                type="button"
                className={`qab-btn${playing ? " qab-btn--active" : ""}`}
                onClick={() => void togglePlay()}
                aria-pressed={playing}
              >
                {playing ? <Pause size={20} /> : <Play size={20} />}
                <span>{playing ? "إيقاف" : "تلاوة"}</span>
              </button>
              <button
                type="button"
                className={`qab-btn${tafsirOpen ? " qab-btn--active" : ""}`}
                onClick={() => void openTafsir()}
                aria-expanded={tafsirOpen}
              >
                <BookOpen size={20} />
                <span>تفسير</span>
              </button>
              <button
                type="button"
                className={`qab-btn${bookmarked ? " qab-btn--active" : ""}`}
                onClick={() => void toggleBookmark()}
                aria-pressed={bookmarked}
              >
                <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
                <span>إشارة</span>
              </button>
              <button
                type="button"
                className={`qab-btn${repeatOn ? " qab-btn--active" : ""}`}
                onClick={toggleRepeat}
                aria-pressed={repeatOn}
              >
                <Repeat size={20} />
                <span>تكرار</span>
              </button>
              <button
                type="button"
                className="qab-btn"
                onClick={() => void shareCard()}
                disabled={sharing}
              >
                <Share2 size={20} />
                <span>{sharing ? "…" : "مشاركة"}</span>
              </button>
            </div>

            {statusMsg && (
              <p className="qab-status" role="status">
                {statusMsg}
              </p>
            )}

            <AnimatePresence initial={false}>
              {tafsirOpen && (
                <motion.div
                  key="tafsir"
                  className="qab-tafsir"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <h3 className="qab-tafsir__title">التفسير الميسّر</h3>
                  {tafsirLoading && <p className="qab-tafsir__body">جاري التحميل…</p>}
                  {tafsirError && !tafsirLoading && (
                    <p className="qab-tafsir__body qab-tafsir__body--err">
                      تعذّر جلب التفسير. حاول لاحقًا.
                    </p>
                  )}
                  {tafsirText && !tafsirLoading && (
                    <p className="qab-tafsir__body" dir="rtl">
                      {tafsirText}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default QuranActionBar;
