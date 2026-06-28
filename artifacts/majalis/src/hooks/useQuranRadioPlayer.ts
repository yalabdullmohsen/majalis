"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuranRadioStation } from "@/lib/quran-radio-stations";

export type RadioPlayerState = "idle" | "connecting" | "live" | "paused" | "error";

type Options = {
  volume: number;
};

const MAX_RETRIES = 2;

export function useQuranRadioPlayer(station: QuranRadioStation | undefined, options: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryRef = useRef(0);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [playerState, setPlayerState] = useState<RadioPlayerState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);

  const resetAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, []);

  const fail = useCallback((message: string) => {
    playingRef.current = false;
    setPlaying(false);
    setPlayerState("error");
    setStatusMessage(message);
    setNowPlaying(null);
    resetAudio();
  }, [resetAudio]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !station) return;

    retryRef.current = 0;
    setPlayerState("connecting");
    setStatusMessage("جاري الاتصال بالبث…");
    setNowPlaying(null);
    audio.src = station.streamUrl;
    audio.load();
    audio.play().catch(() => {
      if (retryRef.current < MAX_RETRIES) {
        retryRef.current += 1;
        setStatusMessage(`إعادة المحاولة (${retryRef.current}/${MAX_RETRIES})…`);
        window.setTimeout(() => audio.play().catch(() => fail("تعذّر تشغيل البث. تحقق من الاتصال أو جرّب إذاعة أخرى.")), 400);
      } else {
        fail("تعذّر تشغيل البث. تحقق من الاتصال أو جرّب إذاعة أخرى.");
      }
    });
  }, [fail, station]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    setPlayerState("paused");
    setStatusMessage("متوقف");
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
      setPlayerState("live");
      setStatusMessage("● البث مباشر");
    };
    const onPause = () => {
      playingRef.current = false;
      setPlaying(false);
    };
    const onError = () => {
      if (retryRef.current < MAX_RETRIES) {
        retryRef.current += 1;
        setStatusMessage(`إعادة المحاولة (${retryRef.current}/${MAX_RETRIES})…`);
        window.setTimeout(() => audio.play().catch(() => fail("تعذّر تشغيل البث.")), 400);
        return;
      }
      fail("تعذّر تشغيل البث. تحقق من الاتصال أو جرّب إذاعة أخرى.");
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
  }, [fail]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, options.volume / 100));
  }, [options.volume]);

  useEffect(() => {
    retryRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
    setPlayerState("idle");
    setStatusMessage("");
    setNowPlaying(null);
    resetAudio();
  }, [station?.id, resetAudio]);

  return {
    playing,
    playerState,
    statusMessage,
    nowPlaying,
    play,
    pause,
    toggle,
    reconnect,
  };
}
