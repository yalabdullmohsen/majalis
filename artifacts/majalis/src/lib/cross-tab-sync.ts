/**
 * Seamless Cross-Tab Sync Architecture (BroadcastChannel API).
 * Propagates bookmarks, azkar progress, streak increments, and IDB write
 * notifications across open tabs without reloads.
 */

export type CrossTabEventType =
  | "bookmark_changed"
  | "azkar_progress"
  | "streak_increment"
  | "idb_write"
  | "daily_progress"
  | "ping"
  | "custom";

export type CrossTabMessage<T = unknown> = {
  type: CrossTabEventType;
  payload: T;
  /** Origin tab id */
  tabId: string;
  ts: number;
  /** Optional storage key hint for consumers */
  key?: string;
};

export type CrossTabHandler = (msg: CrossTabMessage) => void;

const CHANNEL_NAME = "majalis-cross-tab-v1";
const TAB_ID_KEY = "majalis-tab-id-v1";

let channel: BroadcastChannel | null = null;
let tabId: string | null = null;
const handlers = new Set<CrossTabHandler>();
let storageFallbackBound = false;

function ensureTabId(): string {
  if (tabId) return tabId;
  try {
    const existing = sessionStorage.getItem(TAB_ID_KEY);
    if (existing) {
      tabId = existing;
      return existing;
    }
  } catch {
    /* ignore */
  }
  const id = `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  tabId = id;
  try {
    sessionStorage.setItem(TAB_ID_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

export function getCrossTabId(): string {
  return ensureTabId();
}

export function isBroadcastChannelSupported(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

function getChannel(): BroadcastChannel | null {
  if (!isBroadcastChannelSupported()) return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (ev: MessageEvent<CrossTabMessage>) => {
        const msg = ev.data;
        if (!msg || msg.tabId === ensureTabId()) return;
        for (const h of handlers) {
          try {
            h(msg);
          } catch {
            /* ignore handler errors */
          }
        }
      };
    } catch {
      channel = null;
    }
  }
  return channel;
}

/** storage event fallback when BroadcastChannel unavailable */
function ensureStorageFallback(): void {
  if (storageFallbackBound || typeof window === "undefined") return;
  storageFallbackBound = true;
  window.addEventListener("storage", (ev) => {
    if (!ev.key || !ev.newValue) return;
    // Only bridge known majalis keys
    if (!ev.key.startsWith("majalis-") && !ev.key.startsWith("mj-") && !ev.key.startsWith("adhkar_")) {
      return;
    }
    let type: CrossTabEventType = "custom";
    if (ev.key.includes("bookmark")) type = "bookmark_changed";
    else if (ev.key.includes("streak")) type = "streak_increment";
    else if (ev.key.includes("progress") || ev.key.startsWith("adhkar_")) type = "azkar_progress";
    else if (ev.key.includes("daily-progress")) type = "daily_progress";

    const msg: CrossTabMessage = {
      type,
      payload: { key: ev.key },
      tabId: "storage-event",
      ts: Date.now(),
      key: ev.key,
    };
    for (const h of handlers) {
      try {
        h(msg);
      } catch {
        /* ignore */
      }
    }
  });
}

export function publishCrossTabEvent<T>(
  type: CrossTabEventType,
  payload: T,
  key?: string,
): CrossTabMessage<T> {
  const msg: CrossTabMessage<T> = {
    type,
    payload,
    tabId: ensureTabId(),
    ts: Date.now(),
    key,
  };
  try {
    getChannel()?.postMessage(msg);
  } catch {
    /* ignore */
  }
  // Mirror a lightweight ping into LS so storage-fallback tabs wake up
  if (!isBroadcastChannelSupported() && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(
        "majalis-cross-tab-beacon-v1",
        JSON.stringify({ type, key, ts: msg.ts }),
      );
    } catch {
      /* ignore */
    }
  }
  return msg;
}

export function subscribeCrossTab(handler: CrossTabHandler): () => void {
  getChannel();
  ensureStorageFallback();
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** Convenience publishers */
export function broadcastBookmarkChanged(payload: unknown): void {
  publishCrossTabEvent("bookmark_changed", payload, "majalis-local-bookmarks-v1");
}

export function broadcastAzkarProgress(payload: unknown): void {
  publishCrossTabEvent("azkar_progress", payload);
}

export function broadcastStreakIncrement(payload: unknown): void {
  publishCrossTabEvent("streak_increment", payload, "majalis-user-streak-v1");
}

export function broadcastIdbWrite(store: string, key: string): void {
  publishCrossTabEvent("idb_write", { store, key }, `${store}/${key}`);
}

export function broadcastDailyProgress(payload: unknown): void {
  publishCrossTabEvent("daily_progress", payload, "majalis-daily-progress-v1");
}

/** Close channel (tests / teardown). */
export function closeCrossTabChannel(): void {
  try {
    channel?.close();
  } catch {
    /* ignore */
  }
  channel = null;
}
