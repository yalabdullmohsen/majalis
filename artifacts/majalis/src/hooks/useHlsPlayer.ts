"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HlsPlayerState = "idle" | "loading" | "live" | "paused" | "error";

const ALL_URLS_FAILED_MESSAGE = "تعذر تشغيل القناة حاليًا";

type Options = {
  /** Ordered URLs — primary first, then fallbacks */
  streamUrls?: string[];
  /** @deprecated use streamUrls */
  streamUrl?: string;
  autoplay?: boolean;
};

function normalizeUrls(streamUrls?: string[], streamUrl?: string): string[] {
  if (streamUrls?.length) return streamUrls.filter(Boolean);
  if (streamUrl) return [streamUrl];
  return [];
}

export function useHlsPlayer({ streamUrls, streamUrl, autoplay = false }: Options) {
  const urls = normalizeUrls(streamUrls, streamUrl);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const urlIndexRef = useRef(0);
  const urlsKeyRef = useRef("");
  const [state, setState] = useState<HlsPlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | undefined>();

  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;
    try {
      await video.play();
      setState("live");
    } catch {
      setState("paused");
    }
  }, [activeStreamUrl]);

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

  const tryNextUrl = useCallback((): boolean => {
    const nextIndex = urlIndexRef.current + 1;
    if (nextIndex >= urls.length) return false;
    urlIndexRef.current = nextIndex;
    return true;
  }, [urls.length]);

  const loadCurrentUrl = useCallback(
    (video: HTMLVideoElement, startIndex = 0) => {
      if (!urls.length) {
        setState("idle");
        setActiveStreamUrl(undefined);
        return;
      }

      urlIndexRef.current = startIndex;
      const currentUrl = urls[startIndex];
      if (!currentUrl) return;

      setActiveStreamUrl(currentUrl);
      setErrorMessage("");
      setState("loading");

      destroyHls();
      video.pause();
      video.removeAttribute("src");
      video.load();

      const onAllFailed = () => {
        setState("error");
        setErrorMessage(ALL_URLS_FAILED_MESSAGE);
        destroyHls();
      };

      const startPlayback = () => {
        if (autoplay) void video.play().catch(() => setState("paused"));
      };

      const attachNative = () => {
        const onNativeError = () => {
          video.removeEventListener("error", onNativeError);
          if (tryNextUrl()) {
            loadCurrentUrl(video, urlIndexRef.current);
          } else {
            onAllFailed();
          }
        };
        video.addEventListener("error", onNativeError, { once: true });
        video.src = currentUrl;
        video.load();
        startPlayback();
      };

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        attachNative();
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
        hls.loadSource(currentUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          destroyHls();
          if (tryNextUrl()) {
            loadCurrentUrl(video, urlIndexRef.current);
          } else {
            onAllFailed();
          }
        });
      });
    },
    [autoplay, destroyHls, tryNextUrl, urls],
  );

  const reload = useCallback(() => {
    const video = videoRef.current;
    if (!video || !urls.length) return;
    loadCurrentUrl(video, 0);
  }, [loadCurrentUrl, urls.length]);

  useEffect(() => {
    const key = urls.join("\0");
    if (key === urlsKeyRef.current) return;
    urlsKeyRef.current = key;

    if (!urls.length) {
      setState("idle");
      setErrorMessage("");
      setActiveStreamUrl(undefined);
      return undefined;
    }

    const video = videoRef.current;
    if (!video) return undefined;

    loadCurrentUrl(video, 0);

    return () => {
      destroyHls();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [urls, loadCurrentUrl, destroyHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => setState("live");
    const onPause = () => setState((s) => (s === "error" ? s : "paused"));
    const onWaiting = () => setState((s) => (s === "error" ? s : "loading"));

    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
    };
  }, [activeStreamUrl]);

  return {
    videoRef,
    state,
    errorMessage,
    activeStreamUrl,
    play,
    pause,
    toggle,
    reload,
  };
}
