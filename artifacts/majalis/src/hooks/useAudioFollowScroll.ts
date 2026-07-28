/**
 * تتبّع التلاوة مع تمرير تلقائي — يتوقّف عند سحب المستخدم ويستأنف بعد سكون قصير.
 */
import { useEffect, useRef } from "react";

type Opts = {
  enabled: boolean;
  verseKey: string | null;
  container: HTMLElement | null;
  /** مللي ثانية بعد آخر تفاعل يدوي قبل استئناف التمرير التلقائي */
  resumeAfterMs?: number;
};

export function useAudioFollowScroll({ enabled, verseKey, container, resumeAfterMs = 4500 }: Opts) {
  const userPausedUntil = useRef(0);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !container) return;
    const onUser = () => {
      userPausedUntil.current = Date.now() + resumeAfterMs;
    };
    container.addEventListener("wheel", onUser, { passive: true });
    container.addEventListener("touchstart", onUser, { passive: true });
    container.addEventListener("pointerdown", onUser, { passive: true });
    return () => {
      container.removeEventListener("wheel", onUser);
      container.removeEventListener("touchstart", onUser);
      container.removeEventListener("pointerdown", onUser);
    };
  }, [enabled, container, resumeAfterMs]);

  useEffect(() => {
    if (!enabled || !verseKey || !container) return;
    if (verseKey === lastKey.current) return;
    if (Date.now() < userPausedUntil.current) return;
    lastKey.current = verseKey;
    const el =
      container.querySelector(`[data-verse-key="${verseKey}"]`) ||
      document.querySelector(`[data-verse-key="${verseKey}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }
  }, [enabled, verseKey, container]);
}
