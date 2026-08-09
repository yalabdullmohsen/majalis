/**
 * تشغيل/إيقاف عنصر الصوت فقط — بلا كتالوج مؤذنين.
 * يُستورد من شريط الإشعار دون سحب adhan-audio إلى حزمة الدخول.
 */

let _current: HTMLAudioElement | null = null;

export function playAdhanUrl(url: string, volume = 1): HTMLAudioElement {
  stopAdhan();
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(() => {});
  _current = audio;
  return audio;
}

export function stopAdhan() {
  if (_current) {
    _current.pause();
    _current.currentTime = 0;
    _current = null;
  }
}

export function isAdhanPlaying() {
  return !!_current && !_current.paused;
}
