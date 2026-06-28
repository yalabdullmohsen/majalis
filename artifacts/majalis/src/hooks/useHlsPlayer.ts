"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type HlsPlayerState = "idle" | "loading" | "live" | "paused" | "error";

const ALL_URLS_FAILED_MESSAGE = "تعذر تشغيل القناة حاليًا";
const LOAD_TIMEOUT_MS = 20_000;

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
  const urls = useMemo(() => normalizeUrls(streamUrls, streamUrl), [streamUrls, streamUrl]);
  const urlsKey = urls.join("\0");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const urlIndexRef = useRef(0);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<HlsPlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | undefined>();

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

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
        clearLoadTimeout();
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
      clearLoadTimeout();
      video.pause();
      video.removeAttribute("src");
      video.load();

      loadTimeoutRef.current = setTimeout(() => {
        if (tryNextUrl()) {
          loadCurrentUrl(video, urlIndexRef.current);
        } else {
          setState("error");
          setErrorMessage(ALL_URLS_FAILED_MESSAGE);
          destroyHls();
        }
      }, LOAD_TIMEOUT_MS);

      const onAllFailed = () => {
        clearLoadTimeout();
        setState("error");
        setErrorMessage(ALL_URLS_FAILED_MESSAGE);
        destroyHls();
      };

      const onStreamReady = () => {
        clearLoadTimeout();
        if (autoplay) {
          void video.play().catch(() => setState("paused"));
        } else {
          setState("paused");
        }
      };

      const attachNative = () => {
        const onNativeError = () => {
          video.removeEventListener("error", onNativeError);
          clearLoadTimeout();
          if (tryNextUrl()) {
            loadCurrentUrl(video, urlIndexRef.current);
          } else {
            onAllFailed();
          }
        };
        video.addEventListener("error", onNativeError, { once: true });
        video.src = currentUrl;
        video.load();
        onStreamReady();
      };

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        attachNative();
        return;
      }

      void import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          clearLoadTimeout();
          setState("error");
          setErrorMessage("المتصفح لا يدعم بث HLS. جرّب Safari أو حدّث المتصفح.");
          return;
        }

        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(currentUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, onStreamReady);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          clearLoadTimeout();
          destroyHls();
          if (tryNextUrl()) {
            loadCurrentUrl(video, urlIndexRef.current);
          } else {
            onAllFailed();
          }
        });
      });
    },
    [autoplay, clearLoadTimeout, destroyHls, tryNextUrl, urls],
  );

  const reload = useCallback(() => {
    const video = videoRef.current;
    if (!video || !urls.length) return;
    loadCurrentUrl(video, 0);
  }, [loadCurrentUrl, urls.length]);

  useEffect(() => {
    if (!urlsKey) {
      setState("idle");
      setErrorMessage("");
      setActiveStreamUrl(undefined);
      return undefined;
    }

    const video = videoRef.current;
    if (!video) return undefined;

    loadCurrentUrl(video, 0);

    return () => {
      clearLoadTimeout();
      destroyHls();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [urlsKey, loadCurrentUrl, destroyHls, clearLoadTimeout]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => {
      clearLoadTimeout();
      setState("live");
    };
    const onPause = () => setState((s) => (s === "error" ? s : "paused"));
    const onWaiting = () => setState((s) => (s === "error" || s === "live" ? s : "loading"));

    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
    };
  }, [activeStreamUrl, clearLoadTimeout]);

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
