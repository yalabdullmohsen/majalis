/**
 * تشغيل/إيقاف عنصر الصوت فقط — بلا كتالوج مؤذنين.
 * يُستورد من شريط الإشعار دون سحب adhan-audio إلى حزمة الدخول.
 */

let _current: HTMLAudioElement | null = null;
let _stopTimer: ReturnType<typeof setTimeout> | null = null;

function clearStopTimer() {
  if (_stopTimer) {
    clearTimeout(_stopTimer);
    _stopTimer = null;
  }
}

export function playAdhanUrl(
  url: string,
  volume = 1,
  opts?: { maxMs?: number | null },
): HTMLAudioElement {
  stopAdhan();
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(() => {});
  _current = audio;
  const maxMs = opts?.maxMs;
  if (typeof maxMs === "number" && maxMs > 0) {
    _stopTimer = setTimeout(() => stopAdhan(), maxMs);
  }
  return audio;
}

export function stopAdhan() {
  clearStopTimer();
  if (_current) {
    _current.pause();
    _current.currentTime = 0;
    _current = null;
  }
}

export function isAdhanPlaying() {
  return !!_current && !_current.paused;
}
