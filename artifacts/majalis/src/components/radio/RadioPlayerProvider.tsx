"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import type { QuranRadioStation } from "@/lib/quran-radio-stations";
import { getRadioStationById, QURAN_RADIO_STATIONS } from "@/lib/quran-radio-stations";
import { useQuranRadioPlayer } from "@/hooks/useQuranRadioPlayer";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { Icon } from "@/lib/icons";

type RadioContextValue = {
  stationId: string;
  station: QuranRadioStation | undefined;
  setStationId: (id: string) => void;
  playing: boolean;
  playerState: string;
  statusMessage: string;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  reconnect: () => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

const LAST_RADIO_KEY = "majalis-last-radio-v1";

function readLastStation(): string {
  try {
    return localStorage.getItem(LAST_RADIO_KEY) || QURAN_RADIO_STATIONS[0]?.id || "";
  } catch {
    return QURAN_RADIO_STATIONS[0]?.id || "";
  }
}

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const [stationId, setStationIdState] = useState(readLastStation);
  const { preferences } = useUserPreferences();
  const station = useMemo(() => getRadioStationById(stationId), [stationId]);
  const { playing, playerState, statusMessage, toggle, play, pause, reconnect } = useQuranRadioPlayer(station, {
    volume: Number(preferences.radioVolume),
  });

  const setStationId = useCallback((id: string) => {
    setStationIdState(id);
    try {
      localStorage.setItem(LAST_RADIO_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator && station && playing) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.reciterName,
        artist: station.readingType,
        album: "إذاعة القرآن الكريم",
      });
      navigator.mediaSession.setActionHandler("play", () => play());
      navigator.mediaSession.setActionHandler("pause", () => pause());
    }
  }, [station, playing, play, pause]);

  const value = useMemo(
    () => ({ stationId, station, setStationId, playing, playerState, statusMessage, toggle, play, pause, reconnect }),
    [stationId, station, setStationId, playing, playerState, statusMessage, toggle, play, pause, reconnect],
  );

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadioPlayer() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadioPlayer requires RadioPlayerProvider");
  return ctx;
}

export function useOptionalRadioPlayer() {
  return useContext(RadioContext);
}

export function RadioMiniPlayer() {
  const ctx = useOptionalRadioPlayer();
  const [location] = useLocation();

  if (!ctx?.station || location.startsWith("/quran-radio")) return null;
  if (!ctx.playing && ctx.playerState === "idle") return null;

  const { station, playing, playerState, toggle } = ctx;

  return (
    <div className="radio-mini-player" role="region" aria-label="مشغّل الإذاعة">
      <div className={`radio-mini-player__wave${playing ? " is-active" : ""}`} aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
      <div className="radio-mini-player__info">
        <strong>{station.reciterName}</strong>
        <span>{station.readingType} · {playerState === "live" ? "مباشر" : "متوقف"}</span>
      </div>
      <button type="button" className="radio-mini-player__btn" onClick={toggle} aria-label={playing ? "إيقاف" : "تشغيل"}>
        <Icon name={playing ? "pause" : "play"} size={18} />
      </button>
      <Link href={`/quran-radio?station=${station.id}`} className="radio-mini-player__link">
        فتح
      </Link>
    </div>
  );
}
