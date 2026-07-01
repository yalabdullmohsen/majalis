import { useEffect, useRef } from "react";
import type { Ayah } from "@/lib/quran-api";
import type { PlayerState } from "@/hooks/useAyahPlayer";
import { useAyahChunks } from "@/hooks/useAyahChunks";

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

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toArabic(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[+d]);
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
  onAyahClick,
}: Props) {
  const targetRef = useRef<HTMLSpanElement>(null);
  const { visibleAyahs, hasMore, sentinelRef } = useAyahChunks(ayahs, targetAyah);

  useEffect(() => {
    targetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetAyah]);

  if (ayahs.length === 0) return null;

  const isSurahWithoutBismillah = surahNum === 1 || surahNum === 9;

  return (
    <div
      className="qs-ayah-display"
      dir="rtl"
      style={{ "--qs-font-size": `${fontScale}px` } as React.CSSProperties}
    >
      {/* ── Surah header ── */}
      <header className="qs-surah-header">
        <div className="qs-surah-header__ornament" aria-hidden="true">﷽</div>
        {!isSurahWithoutBismillah && (
          <p className="qs-bismillah" lang="ar" dir="rtl">
            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
          </p>
        )}
        <h2 className="qs-surah-header__title" lang="ar">{surahName}</h2>
      </header>

      {/* ── Mushaf flowing text (chunked for performance) ── */}
      <div
        className="qs-mushaf-body"
        lang="ar"
        dir="rtl"
        aria-label={`نص سورة ${surahName}`}
      >
        {visibleAyahs.map((ayah) => {
          const isTarget = ayah.numberInSurah === targetAyah;
          const isPlaying = ayah.numberInSurah === currentPlayingAyah;
          const isLoading = isPlaying && playerState === "loading";

          return (
            <span
              key={ayah.numberInSurah}
              id={`ayah-${ayah.numberInSurah}`}
              ref={isTarget ? targetRef : undefined}
              className={[
                "qs-ayah-inline",
                isPlaying ? "qs-ayah-inline--playing" : "",
                isTarget && !isPlaying ? "qs-ayah-inline--target" : "",
              ].filter(Boolean).join(" ")}
            >
              {/* Clickable ayah text */}
              <span
                className="qs-ayah-inline__text"
                onClick={() => onAyahClick(ayah.numberInSurah)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onAyahClick(ayah.numberInSurah)}
                aria-label={`الآية ${ayah.numberInSurah}`}
              >
                {ayah.text}
              </span>

              {/* Ornamental ayah number ﴿٣﴾ */}
              {showAyahNumbers && (
                <span className="qs-ayah-inline__num" aria-hidden="true">
                  ﴿{toArabic(ayah.numberInSurah)}﴾
                </span>
              )}

              {/* Inline play button */}
              <button
                type="button"
                className={`qs-ayah-inline__play${isPlaying ? " is-playing" : ""}`}
                onClick={() => onPlayAyah(ayah.numberInSurah)}
                aria-label={
                  isPlaying && playerState === "playing"
                    ? `إيقاف آية ${ayah.numberInSurah}`
                    : `تشغيل آية ${ayah.numberInSurah}`
                }
                disabled={isLoading}
                title={`تشغيل آية ${ayah.numberInSurah}`}
              >
                {isLoading ? "…" : isPlaying && playerState === "playing" ? "❚❚" : "▶"}
              </button>
            </span>
          );
        })}
      </div>

      {/* ── Infinite scroll sentinel ── */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="qs-load-sentinel"
          aria-hidden="true"
          style={{ height: 1, marginTop: "1rem" }}
        />
      )}
    </div>
  );
}
