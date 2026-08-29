import { useEffect } from "react";

const DEFAULT_ARTWORK = "/apple-touch-icon.png";

/**
 * تحكم الصوت من شاشة القفل ومركز التحكم (iOS/macOS/Android) — واجهة ويب
 * قياسية (Media Session API)، تعمل تلقائيًا داخل WKWebView لتطبيق iOS
 * الأصلي دون أي إضافة Capacitor، فلا حاجة لأي كود Swift/Kotlin. بلا هذا
 * الهوك، تشغيل الإذاعة أو تلاوة الآيات لا يظهر إطلاقًا في شاشة القفل ولا
 * يمكن التحكم به دون فتح التطبيق.
 */
type Options = {
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  playing: boolean;
  position?: number;
  duration?: number;
  playbackRate?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
} | null;

export function useMediaSession(opts: Options) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;

    if (!opts) {
      ms.metadata = null;
      ms.playbackState = "none";
      return;
    }

    const artworkSrc = opts.artwork || DEFAULT_ARTWORK;
    ms.metadata = new MediaMetadata({
      title: opts.title,
      artist: opts.artist || "سُنّة",
      album: opts.album || "تلاوة القرآن",
      artwork: [
        { src: artworkSrc, sizes: "180x180", type: "image/png" },
        { src: artworkSrc, sizes: "512x512", type: "image/png" },
      ],
    });
    ms.playbackState = opts.playing ? "playing" : "paused";

    if (
      typeof ms.setPositionState === "function" &&
      typeof opts.position === "number" &&
      typeof opts.duration === "number" &&
      Number.isFinite(opts.duration) &&
      opts.duration > 0
    ) {
      try {
        ms.setPositionState({
          duration: opts.duration,
          playbackRate: opts.playbackRate ?? 1,
          position: Math.min(opts.duration, Math.max(0, opts.position)),
        });
      } catch {
        /* بعض المنصات ترفض positionState قبل جاهزية المقطع */
      }
    }

    const set = (action: MediaSessionAction, handler?: () => void) => {
      try {
        ms.setActionHandler(action, handler ? () => handler() : null);
      } catch { /* إجراء غير مدعوم على هذه المنصة — تجاهل بأمان */ }
    };
    set("play", opts.onPlay);
    set("pause", opts.onPause);
    set("stop", opts.onStop);
    set("nexttrack", opts.onNext);
    set("previoustrack", opts.onPrevious);

    return () => {
      set("play"); set("pause"); set("stop"); set("nexttrack"); set("previoustrack");
    };
  }, [
    opts?.title,
    opts?.artist,
    opts?.album,
    opts?.artwork,
    opts?.playing,
    opts?.position,
    opts?.duration,
    opts?.playbackRate,
    opts?.onPlay,
    opts?.onPause,
    opts?.onStop,
    opts?.onNext,
    opts?.onPrevious,
  ]);
}
