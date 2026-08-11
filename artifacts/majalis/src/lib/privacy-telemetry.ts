/**
 * Privacy-first telemetry — anonymous engagement only.
 * Never stores user ids, emails, precise location, or auth tokens.
 * Queues events in IndexedDB (`analytics_queue:*`) and flushes when online + consent.
 */
import { allowsAnalytics } from "@/lib/cookie-consent";
import { idbDelete, idbGetAll, idbPut, isOnline, OFFLINE_STORES } from "@/lib/offline-db";

export type TelemetryEventName =
  | "search_query"
  | "search_click"
  | "content_view"
  | "surah_read"
  | "quiz_complete"
  | "autocomplete_use"
  | "perf_mark"
  | "client_error_bucket";

export type TelemetryEvent = {
  id: string;
  name: TelemetryEventName;
  /** Non-PII props only (hashes/lengths/categories). */
  props: Record<string, string | number | boolean>;
  at: string;
  /** Schema version for the ingest endpoint */
  v: 1;
};

const QUEUE_PREFIX = "analytics_queue:";
const MAX_QUEUE = 200;
const FLUSH_BATCH = 40;

function newId(): string {
  return `te_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Strip accidental PII keys from props. */
function sanitizeProps(
  props: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const blocked = /email|phone|token|password|lat|lng|location|user_?id|name|ip/i;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (blocked.test(k)) continue;
    if (typeof v === "string" && v.length > 200) {
      out[k] = v.slice(0, 200);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function enqueueTelemetry(
  name: TelemetryEventName,
  props: Record<string, string | number | boolean> = {},
): Promise<void> {
  if (!allowsAnalytics()) return;

  const event: TelemetryEvent = {
    id: newId(),
    name,
    props: sanitizeProps(props),
    at: new Date().toISOString(),
    v: 1,
  };

  try {
    await idbPut(OFFLINE_STORES.meta, `${QUEUE_PREFIX}${event.id}`, event, event.at);
  } catch {
    /* ignore */
  }

  if (isOnline()) {
    void flushTelemetryQueue().catch(() => undefined);
  }
}

export async function listTelemetryQueue(): Promise<TelemetryEvent[]> {
  try {
    const rows = await idbGetAll<TelemetryEvent>(OFFLINE_STORES.meta);
    return rows
      .filter((r) => r.key.startsWith(QUEUE_PREFIX) && r.value)
      .map((r) => r.value)
      .sort((a, b) => a.at.localeCompare(b.at));
  } catch {
    return [];
  }
}

export async function telemetryQueueSize(): Promise<number> {
  return (await listTelemetryQueue()).length;
}

async function pruneOverflow(): Promise<void> {
  const items = await listTelemetryQueue();
  if (items.length <= MAX_QUEUE) return;
  const drop = items.slice(0, items.length - MAX_QUEUE);
  for (const e of drop) {
    await idbDelete(OFFLINE_STORES.meta, `${QUEUE_PREFIX}${e.id}`);
  }
}

/** POST queued events to /api/telemetry; delete on success. */
export async function flushTelemetryQueue(): Promise<{ flushed: number; remaining: number }> {
  if (!isOnline() || !allowsAnalytics()) {
    return { flushed: 0, remaining: await telemetryQueueSize() };
  }

  await pruneOverflow();
  const items = (await listTelemetryQueue()).slice(0, FLUSH_BATCH);
  if (items.length === 0) return { flushed: 0, remaining: 0 };

  try {
    const res = await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ events: items }),
      keepalive: true,
    });
    if (!res.ok) {
      return { flushed: 0, remaining: await telemetryQueueSize() };
    }
    for (const e of items) {
      await idbDelete(OFFLINE_STORES.meta, `${QUEUE_PREFIX}${e.id}`);
    }
    const remaining = await telemetryQueueSize();
    try {
      window.dispatchEvent(
        new CustomEvent("majalis-telemetry-flushed", { detail: { flushed: items.length, remaining } }),
      );
    } catch {
      /* ignore */
    }
    return { flushed: items.length, remaining };
  } catch {
    return { flushed: 0, remaining: await telemetryQueueSize() };
  }
}

/** Track a search query anonymously (length + normalized prefix only). */
export function trackAnonymousSearch(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  void enqueueTelemetry("search_query", {
    q_len: q.length,
    q_prefix: q.slice(0, 24),
  });
}

export function trackAnonymousContentView(contentType: string, contentId: string): void {
  if (!contentType || !contentId) return;
  void enqueueTelemetry("content_view", {
    content_type: contentType.slice(0, 40),
    content_id_len: contentId.length,
  });
}

export function trackSurahRead(surah: number): void {
  if (!Number.isFinite(surah) || surah < 1 || surah > 114) return;
  void enqueueTelemetry("surah_read", { surah });
}

export function trackQuizComplete(quizId: string, scorePct: number): void {
  void enqueueTelemetry("quiz_complete", {
    quiz_id: String(quizId).slice(0, 64),
    score_pct: Math.max(0, Math.min(100, Math.round(scorePct))),
  });
}
