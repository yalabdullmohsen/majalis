/**
 * نشاط المستخدم — محلي، تجميعي، بلا حجب UI.
 * يستخدم ذاكرة داخلية عند غياب localStorage (اختبارات Node).
 */

import type { ContentEntityKind } from "./content-entity";
import { ACTIVITY_STORAGE_KEY, isPersonalizationEnabled } from "./privacy";

const MAX_EVENTS = 200;

export type ActivityEventType =
  | "open"
  | "resume"
  | "complete"
  | "save"
  | "search"
  | "download";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  entityKind: ContentEntityKind;
  entityId: string;
  at: string;
  title?: string;
  href?: string;
};

type Store = { version: 1; events: ActivityEvent[] };

let memoryStore: Store = { version: 1, events: [] };

function empty(): Store {
  return { version: 1, events: [] };
}

function read(): Store {
  if (typeof localStorage === "undefined") {
    return { version: 1, events: memoryStore.events.slice() };
  }
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Store;
    if (parsed?.version !== 1 || !Array.isArray(parsed.events)) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

function write(store: Store): void {
  memoryStore = { version: 1, events: store.events.slice() };
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function recordActivity(
  partial: Omit<ActivityEvent, "id" | "at"> & { at?: string },
): ActivityEvent | null {
  if (!isPersonalizationEnabled()) return null;
  const at = partial.at ?? new Date().toISOString();
  const store = read();
  const last = store.events[0];
  if (
    last &&
    last.type === partial.type &&
    last.entityKind === partial.entityKind &&
    last.entityId === partial.entityId &&
    Math.abs(Date.parse(at) - Date.parse(last.at)) < 1000
  ) {
    return last;
  }
  const event: ActivityEvent = {
    id: `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: partial.type,
    entityKind: partial.entityKind,
    entityId: partial.entityId,
    at,
    title: partial.title,
    href: partial.href,
  };
  store.events = [event, ...store.events].slice(0, MAX_EVENTS);
  write(store);
  return event;
}

export function listRecentActivity(limit = 20): ActivityEvent[] {
  return read().events.slice(0, Math.max(1, limit));
}

export function clearActivityHistory(): { removed: number } {
  const n = read().events.length;
  write(empty());
  return { removed: n };
}
