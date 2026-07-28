import { useEffect, useRef } from "react";

/**
 * تحكم الصوت من شاشة القفل ومركز التحكم (iOS/macOS/Android) — واجهة ويب
 * قياسية (Media Session API). Feature-detected; silent no-op when unavailable.
 */
type Options = {
  title: string;
  artist?: string;
  playing: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
} | null;

function clearMediaSessionHandlers(ms: MediaSession): void {
  for (const action of ["play", "pause", "stop", "nexttrack", "previoustrack"] as MediaSessionAction[]) {
    try {
      ms.setActionHandler(action, null);
    } catch {
      /* unsupported */
    }
  }
  try {
    ms.metadata = null;
    ms.playbackState = "none";
  } catch {
    /* ignore */
  }
}

export function useMediaSession(opts: Options) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;

    if (!opts) {
      clearMediaSessionHandlers(ms);
      return;
    }

    try {
      ms.metadata = new MediaMetadata({
        title: opts.title,
        artist: opts.artist || "المجلس العلمي",
      });
      ms.playbackState = opts.playing ? "playing" : "paused";
    } catch {
      /* MediaMetadata unsupported in some webviews */
    }

    const set = (action: MediaSessionAction, getHandler: () => (() => void) | undefined) => {
      try {
        ms.setActionHandler(action, () => {
          getHandler()?.();
        });
      } catch {
        /* إجراء غير مدعوم على هذه المنصة — تجاهل بأمان */
      }
    };

    set("play", () => optsRef.current?.onPlay);
    set("pause", () => optsRef.current?.onPause);
    set("stop", () => optsRef.current?.onStop);
    set("nexttrack", () => optsRef.current?.onNext);
    set("previoustrack", () => optsRef.current?.onPrevious);

    return () => {
      clearMediaSessionHandlers(ms);
    };
  }, [opts?.title, opts?.artist, opts?.playing, Boolean(opts)]);
}
