/**
 * Media element / Object URL / AudioContext garbage collection.
 * Prevents WebAudio + blob URL leaks across long listening sessions.
 * Logic-only — no UI.
 */

const trackedUrls = new Set<string>();
const openContexts = new Set<AudioContext>();

/** Track a blob: URL for later revoke. Returns the same url. */
export function trackObjectUrl(url: string): string {
  if (url && url.startsWith("blob:")) trackedUrls.add(url);
  return url;
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
  trackedUrls.delete(url);
}

/** Revoke all tracked Object URLs (call on route leave / reciter change). */
export function revokeAllTrackedObjectUrls(): void {
  for (const url of [...trackedUrls]) revokeObjectUrl(url);
}

export function trackAudioContext(ctx: AudioContext): AudioContext {
  openContexts.add(ctx);
  return ctx;
}

export async function closeAudioContext(ctx: AudioContext | null | undefined): Promise<void> {
  if (!ctx) return;
  openContexts.delete(ctx);
  try {
    if (ctx.state !== "closed") await ctx.close();
  } catch {
    /* ignore */
  }
}

export async function closeAllTrackedAudioContexts(): Promise<void> {
  const all = [...openContexts];
  openContexts.clear();
  await Promise.all(all.map((c) => closeAudioContext(c)));
}

/**
 * Fully release an HTMLMediaElement: pause, revoke blob src, clear src, load().
 */
export function releaseMediaElement(
  media: HTMLMediaElement | null | undefined,
  opts?: { revokeSrc?: boolean },
): void {
  if (!media) return;
  try {
    media.pause();
  } catch {
    /* ignore */
  }
  const src = media.currentSrc || media.getAttribute("src") || media.src || "";
  if (opts?.revokeSrc !== false && src.startsWith("blob:")) {
    revokeObjectUrl(src);
  }
  try {
    media.removeAttribute("src");
    media.src = "";
    media.removeAttribute("srcObject");
    // @ts-expect-error srcObject may be MediaStream
    media.srcObject = null;
  } catch {
    /* ignore */
  }
  try {
    media.load();
  } catch {
    /* ignore */
  }
}

/** Create + track an Object URL from a Blob. */
export function createTrackedObjectUrl(blob: Blob): string {
  return trackObjectUrl(URL.createObjectURL(blob));
}

export function getTrackedObjectUrlCount(): number {
  return trackedUrls.size;
}

/** Test helper. */
export function resetMediaGcForTests(): void {
  trackedUrls.clear();
  openContexts.clear();
}
