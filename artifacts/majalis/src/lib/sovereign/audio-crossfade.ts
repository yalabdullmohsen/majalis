/**
 * تلاشٍ صوتي خفيف بين عناصر HTMLAudio — يمنع نقرات/قفزات عند تبديل الآيات.
 */
const FADE_MS = 48;

export async function crossfadeAudio(
  outgoing: HTMLAudioElement | null,
  incoming: HTMLAudioElement,
  targetVolume = 1,
): Promise<void> {
  if (!incoming) return;
  incoming.volume = 0;
  const steps = 4;
  const stepMs = Math.max(8, Math.floor(FADE_MS / steps));
  for (let i = 1; i <= steps; i++) {
    await new Promise<void>((r) => window.setTimeout(r, stepMs));
    incoming.volume = Math.min(targetVolume, (targetVolume * i) / steps);
    if (outgoing) {
      outgoing.volume = Math.max(0, targetVolume * (1 - i / steps));
    }
  }
  if (outgoing) {
    try {
      outgoing.pause();
    } catch {
      /* ignore */
    }
    outgoing.volume = targetVolume;
  }
  incoming.volume = targetVolume;
}
