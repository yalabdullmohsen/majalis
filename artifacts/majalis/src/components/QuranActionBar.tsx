/**
 * QuranActionBar — floating ayah actions (audio, tafseer, bookmark, share).
 */
import { useEffect, useState } from "react";
import { BookOpen, Bookmark, Pause, Play, Repeat, Share2, X } from "lucide-react";
import { getAudioEngine, type RepeatMode } from "@/core/audio/AudioEngine";
import { getTafseerService } from "@/core/tafseer/TafseerService";
import { useQuranEngine } from "@/hooks/useQuranEngine";
import { getSurahMeta } from "@/lib/quran-api";
import { shareAyahAsText } from "@/lib/share-ayah";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/quran-engine-ui.css";

export type QuranActionBarAyah = {
  surah: number;
  ayah: number;
  verseKey: string;
  page: number;
  text: string;
};

export type QuranActionBarProps = {
  ayah: QuranActionBarAyah | null;
  onClose?: () => void;
};

function TafsirSkeleton() {
  return (
    <div className="qe-skel-tafsir" aria-busy="true" aria-label="تحميل التفسير">
      <div className="qe-skel-line" />
      <div className="qe-skel-line" />
      <div className="qe-skel-line qe-skel-line--short" />
    </div>
  );
}

export function QuranActionBar({ ayah, onClose }: QuranActionBarProps) {
  const { currentReciter, db } = useQuranEngine();
  const audio = getAudioEngine();
  const tafseer = getTafseerService();

  const [playing, setPlaying] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [bookmarked, setBookmarked] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusWarn, setStatusWarn] = useState(false);

  useEffect(() => {
    return audio.onSnapshot((snap) => {
      setPlaying(snap.playerState === "playing" || snap.playerState === "buffering");
      setAudioBusy(snap.playerState === "loading" || snap.playerState === "buffering");
      setRepeatMode(snap.repeatMode);
      if (snap.playerState === "error") {
        setStatus("تعذّر تشغيل التلاوة. تحقق من الاتصال أو جرّب قارئًا آخر.");
        setStatusWarn(true);
      }
    });
  }, [audio]);

  useEffect(() => {
    if (!ayah) return;
    setTafsirOpen(false);
    setTafsirText(null);
    setStatus(null);
    setStatusWarn(false);
    void (async () => {
      try {
        const rows = await db.listBookmarks();
        setBookmarked(rows.some((r) => r.verseKey === ayah.verseKey));
      } catch {
        setBookmarked(false);
      }
    })();
    audio.setReciter(currentReciter);
  }, [ayah, db, audio, currentReciter]);

  if (!ayah) return null;

  const surahName = getSurahMeta(ayah.surah).name;

  const togglePlay = async () => {
    setStatusWarn(false);
    try {
      await audio.togglePlay(ayah.surah, ayah.ayah);
      const snap = audio.getSnapshot();
      if (snap.playerState === "error") {
        setStatus("تعذّر تشغيل التلاوة. تحقق من الاتصال أو جرّب قارئًا آخر.");
        setStatusWarn(true);
      } else {
        setStatus(null);
      }
    } catch {
      setStatus("تعذّر تشغيل التلاوة. تحقق من الاتصال أو جرّب قارئًا آخر.");
      setStatusWarn(true);
    }
  };

  const toggleRepeat = () => {
    const order: RepeatMode[] = ["off", "ayah", "surah"];
    const i = order.indexOf(repeatMode);
    const next = order[(i + 1) % order.length]!;
    audio.setRepeatMode(next);
    setStatusWarn(false);
    setStatus(next === "off" ? "التكرار متوقف" : next === "ayah" ? "تكرار الآية" : "تكرار السورة");
  };

  const openTafsir = async () => {
    setTafsirOpen(true);
    setTafsirLoading(true);
    setStatusWarn(false);
    try {
      const row = await tafseer.getAyahTafsir(ayah.surah, ayah.ayah);
      if (row?.text) {
        setTafsirText(row.text);
      } else {
        setTafsirText(null);
        setStatus("التفسير غير متاح لهذه الآية حاليًا. حاول لاحقًا.");
        setStatusWarn(true);
      }
    } catch {
      setTafsirText(null);
      setStatus("تعذّر جلب التفسير. تحقق من الاتصال ثم أعد المحاولة.");
      setStatusWarn(true);
    } finally {
      setTafsirLoading(false);
    }
  };

  const toggleBookmark = async () => {
    setStatusWarn(false);
    try {
      if (bookmarked) {
        const ok = await db.removeBookmark(ayah.surah, ayah.ayah);
        if (!ok) {
          setStatus("تعذّر إزالة الإشارة.");
          setStatusWarn(true);
          return;
        }
        setBookmarked(false);
        setStatus("أُزيلت الإشارة");
      } else {
        const row = await db.addBookmark({
          surahId: ayah.surah,
          ayahId: ayah.ayah,
          note: ayah.text.slice(0, 120),
        });
        if (!row) {
          setStatus("تعذّر حفظ الإشارة. قد يكون التخزين المحلي غير متاح.");
          setStatusWarn(true);
          return;
        }
        setBookmarked(true);
        setStatus("حُفظت الإشارة");
      }
    } catch {
      setStatus("تعذّر تحديث الإشارة.");
      setStatusWarn(true);
    }
  };

  const share = async () => {
    setStatusWarn(false);
    try {
      const ok = await shareAyahAsText(ayah.text, surahName, ayah.ayah);
      setStatus(ok ? "تمت المشاركة" : "تعذّرت المشاركة");
      setStatusWarn(!ok);
    } catch {
      setStatus("تعذّرت المشاركة");
      setStatusWarn(true);
    }
  };

  return (
    <div className="qe-abar" role="dialog" aria-label="إجراءات الآية">
      <header className="qe-abar__head">
        <strong>
          {surahName} · {toArabicDigits(ayah.ayah)}
        </strong>
        {onClose ? (
          <button type="button" className="qe-icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        ) : null}
      </header>

      <p className="qe-abar__preview">{ayah.text.length > 140 ? `${ayah.text.slice(0, 140)}…` : ayah.text}</p>

      <div className="qe-abar__actions" role="toolbar" aria-label="إجراءات سريعة">
        <button
          type="button"
          className={`qe-abar__btn${playing ? " is-on" : ""}`}
          onClick={() => void togglePlay()}
          disabled={audioBusy}
          aria-busy={audioBusy}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
          <span>{playing ? "إيقاف" : "تلاوة"}</span>
        </button>
        <button type="button" className={`qe-abar__btn${tafsirOpen ? " is-on" : ""}`} onClick={() => void openTafsir()}>
          <BookOpen size={18} />
          <span>تفسير</span>
        </button>
        <button
          type="button"
          className={`qe-abar__btn${bookmarked ? " is-on" : ""}`}
          onClick={() => void toggleBookmark()}
          aria-pressed={bookmarked}
        >
          <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
          <span>إشارة</span>
        </button>
        <button type="button" className={`qe-abar__btn${repeatMode !== "off" ? " is-on" : ""}`} onClick={toggleRepeat}>
          <Repeat size={18} />
          <span>تكرار</span>
        </button>
        <button type="button" className="qe-abar__btn" onClick={() => void share()}>
          <Share2 size={18} />
          <span>مشاركة</span>
        </button>
      </div>

      {status ? (
        <p className={`qe-abar__status${statusWarn ? " qe-abar__status--warn" : ""}`} role="status">
          {status}
        </p>
      ) : null}

      {tafsirOpen ? (
        <div className="qe-abar__tafsir">
          <h3>التفسير</h3>
          {tafsirLoading ? (
            <TafsirSkeleton />
          ) : tafsirText ? (
            <p>{tafsirText}</p>
          ) : (
            <p role="status">لا يتوفر تفسير لهذه الآية حاليًا.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default QuranActionBar;
