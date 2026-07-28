/**
 * Audio element memory hygiene — release decoded buffers from RAM.
 * Single HTMLAudioElement pattern (no Howler).
 */

/** Fully release media resources held by an HTMLAudioElement. */
export function releaseAudioElement(audio: HTMLAudioElement | null | undefined): void {
  if (!audio) return;
  try {
    audio.pause();
  } catch {
    /* ignore */
  }
  try {
    audio.removeAttribute("src");
    audio.src = "";
    // Force the element to drop buffered media
    audio.load();
  } catch {
    /* ignore */
  }
}

/** Swap src and release previous buffer before assigning a new URL. */
export function assignAudioSrc(audio: HTMLAudioElement, url: string): void {
  try {
    if (audio.src && audio.src !== url) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  } catch {
    /* ignore */
  }
  audio.src = url;
}

/** Revoke a blob: object URL if present. */
export function revokeBlobUrl(url: string | null | undefined): void {
  if (!url || typeof url !== "string") return;
  if (!url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}
