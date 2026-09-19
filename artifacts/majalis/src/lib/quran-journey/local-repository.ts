/**
 * مستودع محلي لرحلة القرآن — بلا SQL/Supabase في PR-1.
 * الفشل هنا لا يمنع فتح المصحف (استدعاء صريح خلف الأعلام فقط).
 */
import { storageGetSync, storageSetSync } from "@/lib/native-storage";
import { writeLocalJsonAtomic } from "@/lib/safe-json";
import { isQuranJourneyFlagOn } from "./flags";
import type {
  QuranJourney,
  QuranJourneyStore,
  QuranMarker,
  QuranMemorizationState,
  QuranReadingSession,
} from "./types";
import { QURAN_JOURNEY_SCHEMA_VERSION } from "./types";
import {
  defaultColorForMarkerType,
  validateJourney,
  validateMarker,
  validateMemorization,
  validateReadingSession,
} from "./validate";

export const QURAN_JOURNEY_STORE_KEY = "ssunnah-quran-journey-store-v1";
export const QURAN_JOURNEY_OWNER_KEY = "ssunnah-quran-journey-owner-v1";
export const QURAN_JOURNEY_MARKERS_MAX = 5000;
export const QURAN_JOURNEY_JOURNEYS_MAX = 50;
export const QURAN_JOURNEY_MEM_MAX = 5000;
export const QURAN_JOURNEY_SESSIONS_MAX = 2000;

let memStore: QuranJourneyStore | null = null;

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getOrCreateLocalOwnerId(): string {
  try {
    const existing = storageGetSync(QURAN_JOURNEY_OWNER_KEY);
    if (existing && existing.startsWith("local-")) return existing;
  } catch {
    /* ignore */
  }
  const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    storageSetSync(QURAN_JOURNEY_OWNER_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

function emptyStore(ownerId: string): QuranJourneyStore {
  return {
    schemaVersion: QURAN_JOURNEY_SCHEMA_VERSION,
    localOwnerId: ownerId,
    markers: [],
    journeys: [],
    memorization: [],
    sessions: [],
    updatedAt: new Date().toISOString(),
  };
}

function readStore(): QuranJourneyStore {
  if (memStore) return memStore;
  const ownerId = getOrCreateLocalOwnerId();
  try {
    const raw = storageGetSync(QURAN_JOURNEY_STORE_KEY);
    if (!raw) {
      memStore = emptyStore(ownerId);
      return memStore;
    }
    const parsed = JSON.parse(raw) as Partial<QuranJourneyStore>;
    memStore = {
      schemaVersion: QURAN_JOURNEY_SCHEMA_VERSION,
      localOwnerId:
        typeof parsed.localOwnerId === "string" ? parsed.localOwnerId : ownerId,
      markers: Array.isArray(parsed.markers) ? parsed.markers : [],
      journeys: Array.isArray(parsed.journeys) ? parsed.journeys : [],
      memorization: Array.isArray(parsed.memorization) ? parsed.memorization : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
    return memStore;
  } catch {
    memStore = emptyStore(ownerId);
    return memStore;
  }
}

function persist(store: QuranJourneyStore): void {
  store.updatedAt = new Date().toISOString();
  store.schemaVersion = QURAN_JOURNEY_SCHEMA_VERSION;
  memStore = store;
  writeLocalJsonAtomic(QURAN_JOURNEY_STORE_KEY, store);
  try {
    storageSetSync(QURAN_JOURNEY_STORE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function resetQuranJourneyStoreForTests(): void {
  memStore = null;
}

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function requireFlag(
  flag:
    | "mushafMarkersV2"
    | "quranJourneys"
    | "memorizationTracker"
    | "quranActivity",
): RepoResult<true> {
  if (!isQuranJourneyFlagOn(flag)) {
    return { ok: false, error: `feature flag ${flag} is off` };
  }
  return { ok: true, value: true };
}

export const QuranJourneyLocalRepository = {
  getStoreSnapshot(): QuranJourneyStore {
    return JSON.parse(JSON.stringify(readStore())) as QuranJourneyStore;
  },

  listMarkers(includeArchived = false): QuranMarker[] {
    if (!isQuranJourneyFlagOn("mushafMarkersV2")) return [];
    const list = readStore().markers;
    return includeArchived ? list.slice() : list.filter((m) => !m.archivedAt);
  },

  upsertMarker(
    input: Partial<QuranMarker> &
      Pick<QuranMarker, "surahNumber" | "ayahNumber" | "pageNumber" | "markerType">,
  ): RepoResult<QuranMarker> {
    const gate = requireFlag("mushafMarkersV2");
    if (!gate.ok) return gate;
    const store = readStore();
    const ownerId = store.localOwnerId;
    const now = new Date().toISOString();
    const draft = {
      id: input.id || newId("marker"),
      localOwnerId: ownerId,
      colorToken: input.colorToken ?? defaultColorForMarkerType(input.markerType),
      title: input.title ?? "",
      note: input.note ?? "",
      createdAt: input.createdAt ?? now,
      updatedAt: now,
      archivedAt: input.archivedAt ?? null,
      syncState: input.syncState ?? "local",
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
      userId: input.userId ?? null,
      ...input,
    };
    const validated = validateMarker(draft, ownerId);
    if (!validated.ok) return validated;

    const dup = store.markers.find(
      (m) =>
        !m.archivedAt &&
        m.id !== validated.value.id &&
        m.surahNumber === validated.value.surahNumber &&
        m.ayahNumber === validated.value.ayahNumber &&
        m.markerType === validated.value.markerType,
    );
    if (dup) {
      return {
        ok: false,
        error: "فاصل بنفس النوع والمرجع موجود — عدّل أو احذف الموجود",
      };
    }
    if (
      !store.markers.some((m) => m.id === validated.value.id) &&
      store.markers.length >= QURAN_JOURNEY_MARKERS_MAX
    ) {
      return { ok: false, error: `الحد الأقصى ${QURAN_JOURNEY_MARKERS_MAX} فاصل` };
    }
    store.markers = [
      validated.value,
      ...store.markers.filter((m) => m.id !== validated.value.id),
    ];
    persist(store);
    return { ok: true, value: validated.value };
  },

  archiveMarker(id: string): RepoResult<QuranMarker | null> {
    const gate = requireFlag("mushafMarkersV2");
    if (!gate.ok) return gate;
    const store = readStore();
    const idx = store.markers.findIndex((m) => m.id === id);
    if (idx < 0) return { ok: true, value: null };
    const next = {
      ...store.markers[idx]!,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: "pending" as const,
    };
    store.markers[idx] = next;
    persist(store);
    return { ok: true, value: next };
  },

  deleteMarker(id: string): RepoResult<boolean> {
    const gate = requireFlag("mushafMarkersV2");
    if (!gate.ok) return gate;
    const store = readStore();
    const before = store.markers.length;
    store.markers = store.markers.filter((m) => m.id !== id);
    persist(store);
    return { ok: true, value: store.markers.length < before };
  },

  listJourneys(includeArchived = false): QuranJourney[] {
    if (!isQuranJourneyFlagOn("quranJourneys")) return [];
    const list = readStore().journeys;
    return includeArchived
      ? list.slice()
      : list.filter((j) => j.status !== "archived");
  },

  upsertJourney(input: Partial<QuranJourney> & { id?: string }): RepoResult<QuranJourney> {
    const gate = requireFlag("quranJourneys");
    if (!gate.ok) return gate;
    const store = readStore();
    const now = new Date().toISOString();
    const draft = {
      id: input.id || newId("journey"),
      title: input.title ?? "ختمة",
      journeyType: input.journeyType ?? "tilawah",
      startReference: input.startReference ?? {
        surahNumber: 1,
        ayahNumber: 1,
        pageNumber: 1,
      },
      targetReference: input.targetReference ?? {
        surahNumber: 114,
        ayahNumber: 6,
        pageNumber: 604,
      },
      currentReference: input.currentReference ??
        input.startReference ?? {
          surahNumber: 1,
          ayahNumber: 1,
          pageNumber: 1,
        },
      dailyTarget: input.dailyTarget ?? 4,
      preferredDays: input.preferredDays ?? [0, 1, 2, 3, 4, 5, 6],
      status: input.status ?? "active",
      createdAt: input.createdAt ?? now,
      updatedAt: now,
      completedAt: input.completedAt ?? null,
      syncState: input.syncState ?? "local",
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
    };
    const validated = validateJourney(draft);
    if (!validated.ok) return validated;
    if (
      !store.journeys.some((j) => j.id === validated.value.id) &&
      store.journeys.length >= QURAN_JOURNEY_JOURNEYS_MAX
    ) {
      return { ok: false, error: `الحد الأقصى ${QURAN_JOURNEY_JOURNEYS_MAX} ختمة` };
    }
    store.journeys = [
      validated.value,
      ...store.journeys.filter((j) => j.id !== validated.value.id),
    ];
    persist(store);
    return { ok: true, value: validated.value };
  },

  listMemorization(): QuranMemorizationState[] {
    if (!isQuranJourneyFlagOn("memorizationTracker")) return [];
    return readStore().memorization.slice();
  },

  upsertMemorization(
    input: Partial<QuranMemorizationState> &
      Pick<QuranMemorizationState, "surahNumber" | "ayahStart" | "ayahEnd" | "status">,
  ): RepoResult<QuranMemorizationState> {
    const gate = requireFlag("memorizationTracker");
    if (!gate.ok) return gate;
    const store = readStore();
    const draft = {
      id: input.id || newId("mem"),
      reviewCount: input.reviewCount ?? 0,
      confidence: input.confidence ?? 0,
      note: input.note ?? "",
      lastReviewedAt: input.lastReviewedAt ?? null,
      nextReviewAt: input.nextReviewAt ?? null,
      syncState: input.syncState ?? "local",
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
      ...input,
    };
    const validated = validateMemorization(draft);
    if (!validated.ok) return validated;
    if (
      !store.memorization.some((m) => m.id === validated.value.id) &&
      store.memorization.length >= QURAN_JOURNEY_MEM_MAX
    ) {
      return { ok: false, error: `الحد الأقصى ${QURAN_JOURNEY_MEM_MAX} سجل حفظ` };
    }
    store.memorization = [
      validated.value,
      ...store.memorization.filter((m) => m.id !== validated.value.id),
    ];
    persist(store);
    return { ok: true, value: validated.value };
  },

  commitReadingSession(
    input: Partial<QuranReadingSession> &
      Pick<QuranReadingSession, "startPage" | "endPage" | "completionState">,
  ): RepoResult<QuranReadingSession> {
    const gate = requireFlag("quranActivity");
    if (!gate.ok) return gate;
    const store = readStore();
    const now = new Date().toISOString();
    const draft = {
      id: input.id || newId("session"),
      startedAt: input.startedAt ?? now,
      endedAt: input.endedAt ?? (input.completionState === "started" ? null : now),
      pagesRead:
        input.pagesRead ??
        Math.abs(input.endPage - input.startPage) + 1,
      journeyId: input.journeyId ?? null,
      syncState: input.syncState ?? "local",
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
      ...input,
    };
    const validated = validateReadingSession(draft);
    if (!validated.ok) return validated;
    store.sessions = [validated.value, ...store.sessions].slice(
      0,
      QURAN_JOURNEY_SESSIONS_MAX,
    );
    persist(store);
    return { ok: true, value: validated.value };
  },
};
