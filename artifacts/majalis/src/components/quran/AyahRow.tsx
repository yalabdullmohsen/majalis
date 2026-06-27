import { useCallback, useState } from "react";
import { Link } from "wouter";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getAyahAudioUrl } from "@/lib/quran-search";

type Props = {
  surah: number;
  surahName: string;
  ayah: number;
  text: string;
  tafsir?: string;
  highlighted?: boolean;
  onSelect?: (ayah: number) => void;
  showTafsir?: boolean;
};

async function copyAyah(surahName: string, ayah: number, text: string) {
  const payload = `${surahName} (${ayah})\n${text}`;
  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    return false;
  }
}

export function AyahRow({
  surah,
  surahName,
  ayah,
  text,
  tafsir,
  highlighted = false,
  onSelect,
  showTafsir = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);

  const handleCopy = useCallback(async () => {
    if (await copyAyah(surahName, ayah, text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }, [surahName, ayah, text]);

  const handleShare = useCallback(async () => {
    const payload = { title: `${surahName} — آية ${ayah}`, text: `${text}\n\n${surahName} (${surah}:${ayah})` };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* cancelled */
      }
    }
    await handleCopy();
  }, [surahName, surah, ayah, text, handleCopy]);

  const playAyah = () => {
    const audio = new Audio(getAyahAudioUrl(surah, ayah));
    setPlaying(true);
    audio.play().catch(() => setPlaying(false));
    audio.onended = () => setPlaying(false);
  };

  return (
    <article
      className={`quran-ayah-row${highlighted ? " is-highlighted" : ""}`}
      onClick={() => onSelect?.(ayah)}
    >
      <span className="quran-ayah-num">{ayah}</span>
      <div className="quran-ayah-row__content">
        <p className="quran-ayah-row__text home-ayah-text">{text}</p>
        {showTafsir && tafsir && <p className="quran-inline-tafsir">{tafsir}</p>}
        <div className="quran-ayah-actions">
          <button type="button" className="quran-ayah-action" onClick={(e) => { e.stopPropagation(); handleCopy(); }}>
            {copied ? "تم" : "نسخ"}
          </button>
          <button type="button" className="quran-ayah-action" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
            مشاركة
          </button>
          <FavoriteButton contentType="quran-ayah" contentId={`${surah}:${ayah}`} compact />
          <button type="button" className="quran-ayah-action" onClick={(e) => { e.stopPropagation(); playAyah(); }}>
            {playing ? "▶ …" : "تشغيل"}
          </button>
          {showTafsir && (
            <Link href={`/search/${encodeURIComponent(`تفسير ${surahName} ${ayah}`)}`} className="quran-ayah-action">
              تفسير
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
