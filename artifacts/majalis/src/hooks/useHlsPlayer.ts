"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HlsPlayerState = "idle" | "loading" | "live" | "paused" | "error";

type Options = {
  streamUrl: string | undefined;
  autoplay?: boolean;
  maxRetries?: number;
};

const DEFAULT_MAX_RETRIES = 3;

export function useHlsPlayer({ streamUrl, autoplay = false, maxRetries = DEFAULT_MAX_RETRIES }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const retryRef = useRef(0);
  const [state, setState] = useState<HlsPlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;
    try {
      await video.play();
      setState("live");
      setLastUpdated(new Date().toISOString());
    } catch {
      setState("paused");
    }
  }, [streamUrl]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setState("paused");
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void play();
    else pause();
  }, [pause, play]);

  const attachStream = useCallback(
    (video: HTMLVideoElement, url: string, shouldAutoplay: boolean) => {
      destroyHls();
      setErrorMessage("");
      setState("loading");

      const startPlayback = () => {
        setLastUpdated(new Date().toISOString());
        if (shouldAutoplay) void play();
      };

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.load();
        startPlayback();
        return;
      }

      void import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          setState("error");
          setErrorMessage("المتصفح لا يدعم بث HLS. جرّب Safari أو حدّث المتصفح.");
          return;
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxMaxBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          retryRef.current = 0;
          startPlayback();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (retryRef.current < maxRetries) {
            retryRef.current += 1;
            setState("loading");
            setErrorMessage(`إعادة الاتصال (${retryRef.current}/${maxRetries})…`);
            window.setTimeout(() => {
              hls.destroy();
              hlsRef.current = null;
              attachStream(video, url, shouldAutoplay);
            }, 800 * retryRef.current);
            return;
          }
          setState("error");
          setErrorMessage("البث غير متاح مؤقتًا — تحقق من الاتصال ثم أعد المحاولة.");
          destroyHls();
        });
      });
    },
    [destroyHls, maxRetries, play],
  );

  const reload = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;
    retryRef.current = 0;
    video.pause();
    video.removeAttribute("src");
    video.load();
    attachStream(video, streamUrl, autoplay);
  }, [attachStream, autoplay, streamUrl]);

  const enterFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) void video.requestFullscreen();
    else if ("webkitEnterFullscreen" in video) {
      (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }, []);

  useEffect(() => {
    if (!streamUrl) {
      setState("idle");
      setErrorMessage("");
      return undefined;
    }

    const video = videoRef.current;
    if (!video) return undefined;

    retryRef.current = 0;
    video.pause();
    video.removeAttribute("src");
    video.load();
    attachStream(video, streamUrl, autoplay);

    return () => {
      destroyHls();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [streamUrl, autoplay, attachStream, destroyHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => {
      setState("live");
      setLastUpdated(new Date().toISOString());
    };
    const onPause = () => setState((s) => (s === "error" ? s : "paused"));
    const onWaiting = () => setState("loading");
    const onError = () => {
      if (retryRef.current >= maxRetries) {
        setState("error");
        setErrorMessage("البث غير متاح مؤقتًا — تحقق من الاتصال ثم أعد المحاولة.");
      }
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onError);
    };
  }, [streamUrl, maxRetries]);

  return {
    videoRef,
    state,
    errorMessage,
    lastUpdated,
    play,
    pause,
    toggle,
    reload,
    enterFullscreen,
  };
}
