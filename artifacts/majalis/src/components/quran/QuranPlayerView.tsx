import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Wifi, WifiOff } from "lucide-react";
import {
  offlineQuranPlayer,
  type OfflinePlayerState,
  type PlaybackSource,
} from "@/lib/offline-quran-player";
import {
  findAyahAtTime,
  resolveSurahAyahTimings,
  scaleTimingsToDuration,
  type AyahTiming,
} from "@/lib/surah-ayah-timing";
import { fetchSurahDetail, getSurahMeta } from "@/lib/quran-api";
import { getReciter, loadReciterId } from "@/lib/quran-audio";
import { toArabicDigits } from "@/lib/utils";

export type QuranPlayerViewProps = {
  reciterId?: string;
  surahNumber: number;
};

type AyahRow = {
  number: number;
  text: string;
  startTime: number;
  endTime: number;
};

/** شاشة تلاوة تفاعلية — تظليل الآية الحية + أوفلاين/بث. */
export function QuranPlayerView({ reciterId: reciterProp, surahNumber }: QuranPlayerViewProps) {
  const reciterId = reciterProp ?? loadReciterId();
  const reciter = getReciter(reciterId);
  const surahMeta = getSurahMeta(surahNumber);

  const [ayahRows, setAyahRows] = useState<AyahRow[]>([]);
  const [timings, setTimings] = useState<AyahTiming[]>([]);
  const [timingPrecise, setTimingPrecise] = useState(false);
  const [activeAyah, setActiveAyah] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerState, setPlayerState] = useState<OfflinePlayerState>("idle");
  const [source, setSource] = useState<PlaybackSource | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const ayahRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      try {
        const detail = await fetchSurahDetail(surahNumber);
        if (cancelled) return;
        const ayahs = detail.ayahs ?? [];
        setAyahRows(
          ayahs.map((a) => ({
            number: a.numberInSurah,
            text: a.text,
            startTime: 0,
            endTime: 0,
          })),
        );
      } catch {
        if (!cancelled) setLoadError("تعذّر تحميل نص السورة.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surahNumber]);

  useEffect(() => {
    return () => {
      void offlineQuranPlayer.stop();
    };
  }, []);

  useEffect(() => {
    const node = ayahRefs.current.get(activeAyah);
    if (!node || !scrollRef.current) return;
    node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, [activeAyah]);

  const applyTimings = useCallback(
    async (durationSec: number) => {
      if (!ayahRows.length || durationSec <= 0) return;
      const { timings: resolved, precise } = await resolveSurahAyahTimings(
        surahNumber,
        reciterId,
        durationSec,
        ayahRows.map((a) => ({ numberInSurah: a.number, text: a.text })),
      );
      const scaled = precise ? scaleTimingsToDuration(resolved, durationSec) : resolved;
      setTimings(scaled);
      setTimingPrecise(precise);
      setAyahRows((rows) =>
        rows.map((row) => {
          const t = scaled.find((x) => x.ayahNumber === row.number);
          return t
            ? { ...row, startTime: t.startTime, endTime: t.endTime }
            : row;
        }),
      );
    },
    [ayahRows, reciterId, surahNumber],
  );

  const handleStartPlay = () => {
    setErrorMsg(null);
    void offlineQuranPlayer.playSurah(reciterId, surahNumber, {
      onTimeUpdate: (currentTime) => {
        const ayahNum = findAyahAtTime(timings, currentTime);
        if (ayahNum != null) {
          setActiveAyah((prev) => (prev === ayahNum ? prev : ayahNum));
        }
        const dur = offlineQuranPlayer.getDuration();
        if (timings.length === 0 && dur > 0 && ayahRows.length > 0) {
          void applyTimings(dur);
        }
      },
      onEnd: () => setIsPlaying(false),
      onError: (msg) => {
        setErrorMsg(msg);
        setIsPlaying(false);
      },
      onSourceResolved: (src) => setSource(src),
      onStateChange: (state) => {
        setPlayerState(state);
        setIsPlaying(state === "playing" || state === "loading");
        if (state === "ended") setIsPlaying(false);
        if (state === "playing") {
          const dur = offlineQuranPlayer.getDuration();
          if (dur > 0 && timings.length === 0) void applyTimings(dur);
        }
      },
    });
    setIsPlaying(true);
  };

  const handleToggle = () => {
    offlineQuranPlayer.togglePlayPause(isPlaying, (status) => setIsPlaying(status));
  };

  const handleAyahPress = (ayah: AyahRow) => {
    setActiveAyah(ayah.number);
    if (ayah.startTime > 0 || playerState === "playing" || playerState === "paused") {
      offlineQuranPlayer.seekToAyah(ayah.startTime);
    }
  };

  const statusLabel = useMemo(() => {
    if (playerState === "loading") return "جارٍ التحميل…";
    if (isPlaying) return "جاري التلاوة";
    if (playerState === "paused") return "متوقف مؤقتًا";
    if (playerState === "ended") return "انتهت السورة";
    return "متوقف";
  }, [isPlaying, playerState]);

  const sourceLabel =
    source === "offline" ? "محلي" : source === "stream" ? "بث" : null;

  return (
    <div className="qpv-card" dir="rtl">
      <header className="qpv-card__header">
        <div>
          <h2 className="qpv-card__title">
            سورة {surahMeta.name.replace(/^سُورَةُ\s*/u, "")}
          </h2>
          <p className="qpv-card__reciter">القارئ: {reciter.nameAr}</p>
        </div>
        <span className="qpv-card__badge" aria-live="polite">
          {statusLabel}
          {sourceLabel ? (
            <>
              {" · "}
              {source === "offline" ? (
                <WifiOff size={12} aria-hidden="true" />
              ) : (
                <Wifi size={12} aria-hidden="true" />
              )}{" "}
              {sourceLabel}
            </>
          ) : null}
        </span>
      </header>

      {!timingPrecise && timings.length > 0 ? (
        <p className="qpv-card__hint">التزامن تقديري — يتحسّن عند الاتصال بمقاطع quran.com.</p>
      ) : null}

      {loadError ? (
        <p role="alert" className="qpv-card__error">{loadError}</p>
      ) : null}
      {errorMsg ? (
        <p role="alert" className="qpv-card__error">{errorMsg}</p>
      ) : null}

      <div ref={scrollRef} className="qpv-card__content" aria-label="نص السورة">
        <p className="qpv-card__quran">
          {ayahRows.map((ayah) => {
            const isActive = ayah.number === activeAyah;
            return (
              <span
                key={ayah.number}
                ref={(el) => {
                  if (el) ayahRefs.current.set(ayah.number, el);
                  else ayahRefs.current.delete(ayah.number);
                }}
                role="button"
                tabIndex={0}
                className={`qpv-ayah${isActive ? " qpv-ayah--active" : ""}`}
                onClick={() => handleAyahPress(ayah)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleAyahPress(ayah);
                  }
                }}
              >
                {ayah.text}{" "}
                <span className="qpv-ayah__mark">﴿{toArabicDigits(ayah.number)}﴾</span>{" "}
              </span>
            );
          })}
        </p>
      </div>

      <div className="qpv-card__controls">
        {isPlaying ? (
          <button type="button" className="qpv-card__btn qpv-card__btn--pause" onClick={handleToggle}>
            <Pause size={18} strokeWidth={2} aria-hidden="true" />
            إيقاف مؤقت
          </button>
        ) : (
          <button
            type="button"
            className="qpv-card__btn qpv-card__btn--play"
            onClick={playerState === "paused" ? handleToggle : handleStartPlay}
            disabled={!!loadError || ayahRows.length === 0}
          >
            <Play size={18} strokeWidth={2} aria-hidden="true" />
            {playerState === "paused" ? "استئناف" : "تشغيل السورة"}
          </button>
        )}
      </div>
    </div>
  );
}
