"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HlsPlayerState = "idle" | "loading" | "live" | "paused" | "error";

type Options = {
  streamUrl: string | undefined;
  autoplay?: boolean;
};

export function useHlsPlayer({ streamUrl, autoplay = false }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [state, setState] = useState<HlsPlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

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

  const reload = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    destroyHls();
    setErrorMessage("");
    setState("loading");
    video.pause();
    video.removeAttribute("src");
    video.load();

    const startPlayback = () => {
      if (autoplay) void play();
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
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
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setState("error");
          setErrorMessage("تعذّر تشغيل البث. تحقق من الاتصال ثم أعد المحاولة.");
          destroyHls();
        }
      });
    });
  }, [autoplay, destroyHls, play, streamUrl]);

  useEffect(() => {
    if (!streamUrl) {
      setState("idle");
      setErrorMessage("");
      return undefined;
    }

    const video = videoRef.current;
    destroyHls();
    setErrorMessage("");
    setState("loading");

    if (!video) return undefined;

    video.pause();
    video.removeAttribute("src");
    video.load();

    const startPlayback = () => {
      if (autoplay) void video.play().catch(() => setState("paused"));
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.load();
      startPlayback();
    } else {
      void import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          setState("error");
          setErrorMessage("المتصفح لا يدعم بث HLS. جرّب Safari أو حدّث المتصفح.");
          return;
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setState("error");
            setErrorMessage("تعذّر تشغيل البث. تحقق من الاتصال ثم أعد المحاولة.");
            destroyHls();
          }
        });
      });
    }

    return () => {
      destroyHls();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [streamUrl, autoplay, destroyHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => setState("live");
    const onPause = () => setState((s) => (s === "error" ? s : "paused"));
    const onWaiting = () => setState("loading");
    const onError = () => {
      setState("error");
      setErrorMessage("تعذّر تشغيل البث. تحقق من الاتصال ثم أعد المحاولة.");
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
  }, [streamUrl]);

  return {
    videoRef,
    state,
    errorMessage,
    play,
    pause,
    toggle,
    reload,
  };
}
