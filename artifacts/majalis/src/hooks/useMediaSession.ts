import { useEffect, useRef } from "react";
import { clearMediaSession } from "@/lib/audio-focus";

/**
 * تحكم الصوت من شاشة القفل ومركز التحكم (iOS/macOS/Android) — واجهة ويب
 * قياسية (Media Session API)، تعمل تلقائيًا داخل WKWebView لتطبيق iOS
 * الأصلي دون أي إضافة Capacitor، فلا حاجة لأي كود Swift/Kotlin. بلا هذا
 * الهوك، تشغيل الإذاعة أو تلاوة الآيات لا يظهر إطلاقًا في شاشة القفل ولا
 * يمكن التحكم به دون فتح التطبيق.
 *
 * Handlers are stored in refs so Media Session action bindings stay stable
 * across renders without re-binding (avoids lock-screen flicker / leaks).
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

export function useMediaSession(opts: Options) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;

    if (!opts) {
      clearMediaSession();
      return;
    }

    try {
      ms.metadata = new MediaMetadata({
        title: opts.title,
        artist: opts.artist || "المجلس العلمي",
      });
      ms.playbackState = opts.playing ? "playing" : "paused";
    } catch {
      /* MediaMetadata unsupported */
    }

    const set = (action: MediaSessionAction, getHandler: () => (() => void) | undefined) => {
      try {
        ms.setActionHandler(action, () => {
          const h = getHandler();
          h?.();
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
      clearMediaSession();
    };
  }, [opts?.title, opts?.artist, opts?.playing, Boolean(opts)]);
}
