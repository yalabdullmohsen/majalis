/**
 * تشغيل/إيقاف عنصر الصوت فقط — بلا كتالوج مؤذنين.
 * يُستورد من شريط الإشعار دون سحب adhan-audio إلى حزمة الدخول.
 * يدعم fade-in وتفضيل المسار المحلي / كاش Cache API.
 */

import { preferLocalAdhanUrl } from "./adhan-offline-assets";

let _current: HTMLAudioElement | null = null;
let _stopTimer: ReturnType<typeof setTimeout> | null = null;
let _fadeRaf: number | null = null;
let _objectUrl: string | null = null;

const FADE_MS = 900;

function clearStopTimer() {
  if (_stopTimer) {
    clearTimeout(_stopTimer);
    _stopTimer = null;
  }
}

function clearFade() {
  if (_fadeRaf != null && typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(_fadeRaf);
  }
  _fadeRaf = null;
}

function revokeObjectUrl() {
  if (_objectUrl) {
    try {
      URL.revokeObjectURL(_objectUrl);
    } catch {
      /* ignore */
    }
    _objectUrl = null;
  }
}

function fadeIn(audio: HTMLAudioElement, target: number) {
  clearFade();
  const start = performance.now();
  const from = 0;
  const tick = (now: number) => {
    if (_current !== audio) return;
    const t = Math.min(1, (now - start) / FADE_MS);
    audio.volume = from + (target - from) * t;
    if (t < 1) {
      _fadeRaf = requestAnimationFrame(tick);
    } else {
      _fadeRaf = null;
    }
  };
  audio.volume = 0;
  if (typeof requestAnimationFrame === "function") {
    _fadeRaf = requestAnimationFrame(tick);
  } else {
    audio.volume = target;
  }
}

async function resolvePlayableUrl(url: string): Promise<string> {
  const preferred = preferLocalAdhanUrl(url);
  try {
    const { getCachedAdhanUrl } = await import("./adhan-downloads");
    const cached =
      (await getCachedAdhanUrl(preferred)) ||
      (preferred !== url ? await getCachedAdhanUrl(url) : null);
    if (cached) {
      _objectUrl = cached;
      return cached;
    }
  } catch {
    /* offline-db / cache optional */
  }
  return preferred;
}

export function playAdhanUrl(
  url: string,
  volume = 1,
  opts?: { maxMs?: number | null; fadeIn?: boolean },
): HTMLAudioElement {
  stopAdhan();
  const audio = new Audio();
  const targetVol = Math.min(1, Math.max(0, volume));
  const useFade = opts?.fadeIn !== false;
  audio.preload = "auto";
  audio.volume = useFade ? 0 : targetVol;
  _current = audio;

  void (async () => {
    const playUrl = await resolvePlayableUrl(url);
    if (_current !== audio) return;
    audio.src = playUrl;
    try {
      await audio.play();
      if (useFade && _current === audio) fadeIn(audio, targetVol);
    } catch {
      /* autoplay policy / missing asset */
    }
  })();

  const maxMs = opts?.maxMs;
  if (typeof maxMs === "number" && maxMs > 0) {
    _stopTimer = setTimeout(() => stopAdhan(), maxMs);
  }
  return audio;
}

export function stopAdhan() {
  clearStopTimer();
  clearFade();
  if (_current) {
    try {
      _current.pause();
      _current.currentTime = 0;
      _current.removeAttribute("src");
      _current.load();
    } catch {
      /* ignore */
    }
    _current = null;
  }
  revokeObjectUrl();
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("majalis:adhan-stopped"));
    }
  } catch {
    /* ignore */
  }
}

export function isAdhanPlaying() {
  return !!_current && !_current.paused;
}
