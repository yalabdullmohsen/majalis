import { useEffect } from "react";

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
  playing: boolean;
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

    ms.metadata = new MediaMetadata({
      title: opts.title,
      artist: opts.artist || "المجلس العلمي",
    });
    ms.playbackState = opts.playing ? "playing" : "paused";

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
  }, [opts?.title, opts?.artist, opts?.playing, opts?.onPlay, opts?.onPause, opts?.onStop, opts?.onNext, opts?.onPrevious]);
}
