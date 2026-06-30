import { useEffect, useRef } from "react";
import type { Ayah } from "@/lib/quran-api";
import type { PlayerState } from "@/hooks/useAyahPlayer";

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

const PLAY_ICONS: Record<PlayerState, string> = {
  idle: "▶",
  loading: "…",
  playing: "❚❚",
  paused: "▶",
  error: "✕",
};

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
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    targetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetAyah]);

  if (ayahs.length === 0) return null;

  const isSurahWithoutBismillah = surahNum === 1 || surahNum === 9;

  return (
    <div className="qs-ayah-display" dir="rtl" style={{ "--qs-font-size": `${fontScale}px` } as React.CSSProperties}>
      {/* Surah header */}
      <header className="qs-surah-header">
        <div className="qs-surah-header__ornament" aria-hidden="true">﷽</div>
        {!isSurahWithoutBismillah && (
          <p className="qs-bismillah" lang="ar" dir="rtl">
            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
          </p>
        )}
        <h2 className="qs-surah-header__title" lang="ar">{surahName}</h2>
      </header>

      {/* Ayahs */}
      <div className="qs-ayahs-wrap">
        {ayahs.map((ayah) => {
          const isTarget = ayah.numberInSurah === targetAyah;
          const isPlaying = ayah.numberInSurah === currentPlayingAyah;
          const isThisLoading = isPlaying && playerState === "loading";

          return (
            <div
              key={ayah.numberInSurah}
              ref={isTarget ? targetRef : undefined}
              className={`qs-ayah${isPlaying ? " qs-ayah--playing" : ""}${isTarget && !isPlaying ? " qs-ayah--target" : ""}`}
              id={`ayah-${ayah.numberInSurah}`}
            >
              <div className="qs-ayah__text-row" onClick={() => onAyahClick(ayah.numberInSurah)}>
                <span className="qs-ayah__text" lang="ar" dir="rtl">
                  {ayah.text}
                </span>
                {showAyahNumbers && (
                  <span className="qs-ayah__num" aria-label={`آية ${ayah.numberInSurah}`}>
                    ﴿{ayah.numberInSurah}﴾
                  </span>
                )}
              </div>

              <button
                type="button"
                className={`qs-ayah__play-btn${isPlaying ? " is-playing" : ""}`}
                onClick={() => onPlayAyah(ayah.numberInSurah)}
                aria-label={isPlaying && playerState === "playing" ? `إيقاف آية ${ayah.numberInSurah}` : `تشغيل آية ${ayah.numberInSurah}`}
                disabled={isThisLoading}
              >
                {isThisLoading ? "…" : PLAY_ICONS[isPlaying ? playerState : "idle"]}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
