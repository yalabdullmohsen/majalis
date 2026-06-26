"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuranRadio } from "@/lib/quran-content";

export type RadioPlayerState = "idle" | "connecting" | "live" | "fallback" | "paused";

type Options = {
  volume: number;
};

export function useQuranRadioPlayer(station: QuranRadio | undefined, options: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlIndexRef = useRef(0);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [playerState, setPlayerState] = useState<RadioPlayerState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeQuality, setActiveQuality] = useState(station?.quality || "");

  const getUrls = useCallback(() => {
    if (!station) return [] as string[];
    return [station.streamUrl, ...(station.fallbackUrls || [])].filter(Boolean);
  }, [station]);

  const tryNextUrl = useCallback(() => {
    const audio = audioRef.current;
    const urls = getUrls();
    if (!audio || urls.length === 0) return false;

    urlIndexRef.current += 1;
    if (urlIndexRef.current >= urls.length) {
      setPlayerState("idle");
      playingRef.current = false;
      setPlaying(false);
      setStatusMessage("تعذّر الاتصال بالبث. جرّب إعادة الاتصال أو اختر إذاعة أخرى.");
      return false;
    }

    const isFallback = urlIndexRef.current > 0;
    setPlayerState(isFallback ? "fallback" : "connecting");
    setStatusMessage(isFallback ? "جاري التبديل إلى رابط احتياطي…" : "جاري الاتصال بالبث…");
    audio.src = urls[urlIndexRef.current];
    audio.load();
    audio.play().catch(() => tryNextUrl());
    return true;
  }, [getUrls]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !station) return;

    urlIndexRef.current = 0;
    setPlayerState("connecting");
    setStatusMessage("جاري الاتصال بالبث…");
    audio.src = getUrls()[0];
    audio.load();
    audio.play().catch(() => tryNextUrl());
  }, [getUrls, station, tryNextUrl]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    setPlayerState("paused");
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const reconnect = useCallback(() => {
    pause();
    window.setTimeout(play, 120);
  }, [pause, play]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const onPlaying = () => {
      playingRef.current = true;
      setPlaying(true);
      setActiveQuality(station?.quality || "128 kbps");
      setStatusMessage(urlIndexRef.current > 0 ? "متصل عبر رابط احتياطي" : "البث مباشر");
      setPlayerState(urlIndexRef.current > 0 ? "fallback" : "live");
    };
    const onPause = () => {
      playingRef.current = false;
      setPlaying(false);
    };
    const onError = () => {
      tryNextUrl();
    };
    const onWaiting = () => {
      if (playingRef.current) setPlayerState("connecting");
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("waiting", onWaiting);

    return () => {
      audio.pause();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("waiting", onWaiting);
      audioRef.current = null;
    };
  }, [station?.quality, tryNextUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, options.volume / 100));
  }, [options.volume]);

  useEffect(() => {
    urlIndexRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
    setPlayerState("idle");
    setStatusMessage("");
    setActiveQuality(station?.quality || "");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
    }
  }, [station?.id, station?.quality]);

  return {
    playing,
    playerState,
    statusMessage,
    activeQuality,
    play,
    pause,
    toggle,
    reconnect,
  };
}
