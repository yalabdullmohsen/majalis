"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuranRadioStation } from "@/lib/quran-radio-stations";

export type RadioPlayerState = "idle" | "connecting" | "live" | "paused" | "error";

type Options = {
  volume: number;
  maxRetries?: number;
};

const DEFAULT_MAX_RETRIES = 3;

export function useQuranRadioPlayer(station: QuranRadioStation | undefined, options: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryRef = useRef(0);
  const playingRef = useRef(false);
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const [playing, setPlaying] = useState(false);
  const [playerState, setPlayerState] = useState<RadioPlayerState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(false);
    resetAudio();
  }, [resetAudio]);

  const attemptPlay = useCallback(
    (audio: HTMLAudioElement) => {
      audio.play().catch(() => {
        if (retryRef.current < maxRetries) {
          retryRef.current += 1;
          setStatusMessage(`إعادة الاتصال (${retryRef.current}/${maxRetries})…`);
          setPlayerState("connecting");
          window.setTimeout(() => attemptPlay(audio), 600 * retryRef.current);
        } else {
          fail("تعذّر تشغيل البث. تحقق من الاتصال أو جرّب إذاعة أخرى.");
        }
      });
    },
    [fail, maxRetries],
  );

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !station) return;

    retryRef.current = 0;
    setIsLoading(true);
    setPlayerState("connecting");
    setStatusMessage("جاري الاتصال بالبث…");
    audio.src = station.streamUrl;
    audio.load();
    attemptPlay(audio);
  }, [attemptPlay, station]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    setPlayerState("paused");
    setStatusMessage("متوقف");
    setIsLoading(false);
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const reconnect = useCallback(() => {
    pause();
    window.setTimeout(play, 150);
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
      setIsLoading(false);
      retryRef.current = 0;
    };
    const onPause = () => {
      playingRef.current = false;
      setPlaying(false);
    };
    const onError = () => {
      if (retryRef.current < maxRetries) {
        retryRef.current += 1;
        setStatusMessage(`إعادة الاتصال (${retryRef.current}/${maxRetries})…`);
        setPlayerState("connecting");
        window.setTimeout(() => {
          if (station?.streamUrl) {
            audio.src = station.streamUrl;
            audio.load();
            attemptPlay(audio);
          }
        }, 600 * retryRef.current);
        return;
      }
      fail("تعذّر تشغيل البث. تحقق من الاتصال أو جرّب إذاعة أخرى.");
    };
    const onWaiting = () => {
      if (playingRef.current) {
        setPlayerState("connecting");
        setIsLoading(true);
      }
    };
    const onStalled = () => {
      if (playingRef.current && retryRef.current < maxRetries) {
        reconnect();
      }
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("stalled", onStalled);

    return () => {
      audio.pause();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("stalled", onStalled);
      audioRef.current = null;
    };
  }, [attemptPlay, fail, maxRetries, reconnect, station?.streamUrl]);

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
    setIsLoading(false);
    resetAudio();
  }, [station?.id, resetAudio]);

  return {
    playing,
    playerState,
    statusMessage,
    isLoading,
    play,
    pause,
    toggle,
    reconnect,
  };
}
