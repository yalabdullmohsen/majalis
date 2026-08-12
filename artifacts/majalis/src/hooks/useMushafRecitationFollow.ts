/**
 * متابعة التلاوة على المصحف: تقدّم الصفحة تلقائياً + تمرير لطيف يتوقف عند لمس المستخدم.
 */
import { useEffect, useRef } from "react";
import { AudioEngine } from "@/core/audio/AudioEngine";
import { ayahKeyToPage } from "@/lib/quran-my-bookmarks";

export type UseMushafRecitationFollowOptions = {
  currentPage: number;
  goToPage: (page: number) => void;
  /** يُستدعى عند تغيّر الآية الجارية من المحرّك العام */
  onEngineAyah?: (key: string | null) => void;
  scrollRoot?: HTMLElement | null;
};

export function useMushafRecitationFollow(opts: UseMushafRecitationFollowOptions): void {
  const userTouchedRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const onTouch = () => {
      userTouchedRef.current = true;
    };
    window.addEventListener("touchstart", onTouch, { passive: true, capture: true });
    window.addEventListener("wheel", onTouch, { passive: true, capture: true });
    return () => {
      window.removeEventListener("touchstart", onTouch, true);
      window.removeEventListener("wheel", onTouch, true);
    };
  }, []);

  // إعادة السماح بالتمرير عند استئناف التشغيل من إيقاف
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    let wasPlaying = false;
    return engine.onSnapshot((s) => {
      const playing = s.playerState === "playing";
      if (playing && !wasPlaying) {
        userTouchedRef.current = false;
      }
      wasPlaying = playing;
    });
  }, []);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    return engine.onAyahChange((payload) => {
      const key = `${payload.surah}:${payload.ayah}`;
      const o = optsRef.current;
      o.onEngineAyah?.(key);

      const targetPage = ayahKeyToPage(key);
      if (Number.isFinite(targetPage) && targetPage >= 1 && targetPage !== o.currentPage) {
        o.goToPage(targetPage);
      }

      const ayahChanged = lastKeyRef.current !== key;
      lastKeyRef.current = key;
      if (!ayahChanged || userTouchedRef.current) return;

      window.requestAnimationFrame(() => {
        if (userTouchedRef.current) return;
        try {
          const root = optsRef.current.scrollRoot ?? document;
          const el =
            root.querySelector(`[data-verse="${key}"]`) ||
            document.querySelector(`[data-verse="${key}"]`);
          if (el instanceof HTMLElement) {
            el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
          }
        } catch {
          /* ignore */
        }
      });
    });
  }, []);
}
