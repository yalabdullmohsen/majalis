import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { getSurahStartPage, mushafPageUrl } from "@/lib/mushaf/kuwait-mushaf-data";

type Props = {
  ayah: { numberInSurah: number; text: string };
  surah: number;
  active: boolean;
  showNumber: boolean;
  fontSize: number;
  fontFamily: string;
  hideTashkeel: boolean;
  tafsir?: string;
  onSelect: () => void;
  onPlay?: () => void;
  surahName: string;
};

export function AyahCard({
  ayah,
  surah,
  active,
  showNumber,
  fontSize,
  fontFamily,
  hideTashkeel,
  tafsir,
  onSelect,
  onPlay,
  surahName,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  let text = ayah.text;
  if (hideTashkeel) {
    text = text.replace(/[\u064B-\u065F\u0670]/g, "");
  }

  const copyAyah = useCallback(async () => {
    const line = `${text} ﴿${ayah.numberInSurah}﴾`;
    try {
      await navigator.clipboard.writeText(line);
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  }, [text, ayah.numberInSurah]);

  const shareAyah = useCallback(async () => {
    const line = `${surahName} — آية ${ayah.numberInSurah}\n${text}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: line, title: surahName });
      } catch {
        /* ignore */
      }
    } else {
      await navigator.clipboard.writeText(line);
    }
    setMenuOpen(false);
  }, [surahName, ayah.numberInSurah, text]);

  return (
    <article
      className={`quran-v2-ayah-card${active ? " is-active" : ""}`}
      style={{ fontSize: `${fontSize}px`, fontFamily }}
      onClick={onSelect}
    >
      {showNumber && (
        <span className="quran-v2-ayah-badge" aria-label={`آية ${ayah.numberInSurah}`}>
          {ayah.numberInSurah}
        </span>
      )}
      <p className="quran-v2-ayah-text home-ayah-text">{text}</p>
      {tafsir && <p className="quran-v2-ayah-tafsir">{tafsir}</p>}

      <div className="quran-v2-ayah-menu-wrap" ref={menuRef}>
        <button
          type="button"
          className="quran-v2-ayah-menu-btn"
          aria-label="خيارات الآية"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        >
          ⋮
        </button>
        {menuOpen && (
          <menu className="quran-v2-ayah-menu">
            <button type="button" onClick={(e) => { e.stopPropagation(); copyAyah(); }}>نسخ</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); shareAyah(); }}>مشاركة</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>إضافة للمفضلة</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onPlay?.(); setMenuOpen(false); }}>تشغيل من هنا</button>
            <Link
              href={mushafPageUrl(getSurahStartPage(surah), surah, ayah.numberInSurah)}
              className="quran-v2-ayah-menu-link"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
            >
              افتح في المصحف
            </Link>
          </menu>
        )}
      </div>
    </article>
  );
}
