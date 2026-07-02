import { useCallback, useEffect, useRef, useState } from "react";
import type { RadioStation } from "@/lib/quran-radio";

export type RadioState = "idle" | "connecting" | "live" | "paused" | "error";

const MAX_RETRIES = 3;

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [station, setStation] = useState<RadioStation | null>(null);
  const [radioState, setRadioState] = useState<RadioState>("idle");
  const [volume, setVolumeState] = useState(80);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onPlaying = () => { retryRef.current = 0; setRadioState("live"); };
    const onPause = () => setRadioState((s) => s !== "error" ? "paused" : s);
    const onWaiting = () => setRadioState("connecting");
    const onError = () => {
      if (retryRef.current < MAX_RETRIES) {
        retryRef.current += 1;
        retryTimerRef.current = setTimeout(() => {
          audio.load();
          audio.play().catch(() => setRadioState("error"));
        }, 500);
      } else {
        setRadioState("error");
      }
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume / 100;
  }, [volume]);

  const play = useCallback((s: RadioStation) => {
    const audio = audioRef.current;
    if (!audio) return;
    retryRef.current = 0;
    setStation(s);
    setRadioState("connecting");
    audio.src = s.streamUrl;
    audio.load();
    audio.play().catch(() => setRadioState("error"));
  }, []);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    setStation(null);
    setRadioState("idle");
  }, []);

  const toggle = useCallback((s: RadioStation) => {
    if (station?.id === s.id && radioState === "live") {
      pause();
    } else {
      play(s);
    }
  }, [station, radioState, pause, play]);

  const reconnect = useCallback(() => {
    if (!station) return;
    retryRef.current = 0;
    const s = station;
    stop();
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => play(s), 100);
  }, [station, stop, play]);

  const setVolume = useCallback((v: number) => setVolumeState(Math.min(100, Math.max(0, v))), []);

  return { station, radioState, volume, play, pause, stop, toggle, reconnect, setVolume };
}
