/**
 * Multi-Device Handoff — تزامن فوري للتلاوة/صفحة المصحف عبر BroadcastChannel.
 * حمولة <1KB — بلا refresh يدوي.
 */
import { publishCrossTabEvent, subscribeCrossTab, type CrossTabMessage } from "@/lib/cross-tab-sync";

export type HandoffPayload = {
  surah: number | null;
  ayah: number | null;
  currentTime: number;
  page: number | null;
  scrollY: number;
  playing: boolean;
};

const LS_KEY = "majalis-device-handoff-v1";
const EVENT = "majalis-handoff-apply";
const MAX_BYTES = 1024;

let lastPublishAt = 0;
let started = false;

function compactPayload(p: HandoffPayload): HandoffPayload {
  return {
    surah: p.surah,
    ayah: p.ayah,
    currentTime: Math.round(p.currentTime * 10) / 10,
    page: p.page,
    scrollY: Math.round(p.scrollY),
    playing: p.playing,
  };
}

function withinBudget(json: string): boolean {
  return new TextEncoder().encode(json).length <= MAX_BYTES;
}

export function publishDeviceHandoff(payload: HandoffPayload): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPublishAt < 400) return;
  lastPublishAt = now;

  const compact = compactPayload(payload);
  const json = JSON.stringify(compact);
  if (!withinBudget(json)) return;

  try {
    localStorage.setItem(LS_KEY, json);
  } catch {
    /* ignore */
  }
  publishCrossTabEvent("custom", { kind: "device_handoff", ...compact }, LS_KEY);
}

export function readDeviceHandoff(): HandoffPayload | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HandoffPayload;
  } catch {
    return null;
  }
}

function dispatchApply(payload: HandoffPayload): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: payload }));
}

function onCrossTab(msg: CrossTabMessage): void {
  if (msg.type !== "custom") return;
  const p = msg.payload as HandoffPayload & { kind?: string };
  if (p?.kind !== "device_handoff") return;
  dispatchApply({
    surah: p.surah ?? null,
    ayah: p.ayah ?? null,
    currentTime: p.currentTime ?? 0,
    page: p.page ?? null,
    scrollY: p.scrollY ?? 0,
    playing: Boolean(p.playing),
  });
}

/** يلتقط handoff ويُ snapshot من AudioEngine + lastPage دوريًا. */
export function startDeviceHandoffSync(): () => void {
  if (started || typeof window === "undefined") return () => undefined;
  started = true;

  const unsub = subscribeCrossTab(onCrossTab);

  let timer: ReturnType<typeof setInterval> | null = null;
  timer = setInterval(() => {
    void (async () => {
      try {
        const { getAudioEngine } = await import("@/core/audio/AudioEngine");
        const { loadLastPage } = await import("@/lib/quran-last-page");
        const snap = getAudioEngine().getSnapshot();
        const page = await loadLastPage();
        publishDeviceHandoff({
          surah: snap.surah,
          ayah: snap.ayah,
          currentTime: snap.currentTime,
          page,
          scrollY: typeof window !== "undefined" ? window.scrollY : 0,
          playing: snap.playerState === "playing",
        });
      } catch {
        /* ignore */
      }
    })();
  }, 2_500);

  return () => {
    unsub();
    if (timer) clearInterval(timer);
    started = false;
  };
}

export function subscribeDeviceHandoffApply(
  handler: (payload: HandoffPayload) => void,
): () => void {
  const fn = (ev: Event) => {
    const detail = (ev as CustomEvent<HandoffPayload>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

export function resetDeviceHandoffForTests(): void {
  started = false;
  lastPublishAt = 0;
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}
