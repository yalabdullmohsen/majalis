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

export function QuranActionBar({ ayah, onClose }: QuranActionBarProps) {
  const { currentReciter, db } = useQuranEngine();
  const audio = getAudioEngine();
  const tafseer = getTafseerService();

  const [playing, setPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [bookmarked, setBookmarked] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    return audio.onSnapshot((snap) => {
      setPlaying(snap.playerState === "playing" || snap.playerState === "buffering");
      setRepeatMode(snap.repeatMode);
    });
  }, [audio]);

  useEffect(() => {
    if (!ayah) return;
    setTafsirOpen(false);
    setTafsirText(null);
    setStatus(null);
    void db.listBookmarks().then((rows) => {
      setBookmarked(rows.some((r) => r.verseKey === ayah.verseKey));
    });
    audio.setReciter(currentReciter);
  }, [ayah, db, audio, currentReciter]);

  if (!ayah) return null;

  const surahName = getSurahMeta(ayah.surah).name;

  const togglePlay = async () => {
    await audio.togglePlay(ayah.surah, ayah.ayah);
  };

  const toggleRepeat = () => {
    const order: RepeatMode[] = ["off", "ayah", "surah"];
    const i = order.indexOf(repeatMode);
    const next = order[(i + 1) % order.length]!;
    audio.setRepeatMode(next);
    setStatus(next === "off" ? "التكرار متوقف" : next === "ayah" ? "تكرار الآية" : "تكرار السورة");
  };

  const openTafsir = async () => {
    setTafsirOpen(true);
    setTafsirLoading(true);
    try {
      const row = await tafseer.getAyahTafsir(ayah.surah, ayah.ayah);
      setTafsirText(row?.text ?? "لا يتوفر تفسير لهذه الآية حاليًا.");
    } finally {
      setTafsirLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (bookmarked) {
      await db.removeBookmark(ayah.surah, ayah.ayah);
      setBookmarked(false);
      setStatus("أُزيلت الإشارة");
    } else {
      await db.addBookmark({
        surahId: ayah.surah,
        ayahId: ayah.ayah,
        note: ayah.text.slice(0, 120),
      });
      setBookmarked(true);
      setStatus("حُفظت الإشارة");
    }
  };

  const share = async () => {
    const ok = await shareAyahAsText(ayah.text, surahName, ayah.ayah);
    setStatus(ok ? "تمت المشاركة" : "تعذّرت المشاركة");
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
        <button type="button" className={`qe-abar__btn${playing ? " is-on" : ""}`} onClick={() => void togglePlay()}>
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
        <p className="qe-abar__status" role="status">
          {status}
        </p>
      ) : null}

      {tafsirOpen ? (
        <div className="qe-abar__tafsir">
          <h3>التفسير</h3>
          {tafsirLoading ? <p>جاري التحميل…</p> : <p>{tafsirText}</p>}
        </div>
      ) : null}
    </div>
  );
}

export default QuranActionBar;
