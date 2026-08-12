/**
 * Reactive store for Admin Review Hub — filter, search, bulk actions, persist.
 */
import { REVIEW_HUB_DEFAULT_METRICS, REVIEW_HUB_SEED } from "./seed-data";
import type {
  ReviewFilterTab,
  ReviewHubMetrics,
  ReviewHubSnapshot,
  ReviewItem,
  ReviewStatus,
  ReviewStream,
} from "./types";

const STORAGE_KEY = "majlisilm-admin-review-hub-v1";
const UI_KEY = "majlisilm-admin-review-hub-ui-v1";

type Listener = () => void;

type PersistedUi = {
  darkMode: boolean;
  sidebarCollapsed: boolean;
};

function safeParseItems(raw: string | null): ReviewItem[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ReviewItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadItems(): ReviewItem[] {
  try {
    if (typeof localStorage === "undefined") return structuredClone(REVIEW_HUB_SEED);
    const stored = safeParseItems(localStorage.getItem(STORAGE_KEY));
    return stored ? stored : structuredClone(REVIEW_HUB_SEED);
  } catch {
    return structuredClone(REVIEW_HUB_SEED);
  }
}

function loadUi(): PersistedUi {
  try {
    if (typeof localStorage === "undefined") {
      return { darkMode: false, sidebarCollapsed: false };
    }
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return { darkMode: false, sidebarCollapsed: false };
    const parsed = JSON.parse(raw) as PersistedUi;
    return {
      darkMode: Boolean(parsed.darkMode),
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
    };
  } catch {
    return { darkMode: false, sidebarCollapsed: false };
  }
}

function computeMetrics(items: ReviewItem[]): ReviewHubMetrics {
  const pendingLike = items.filter(
    (i) =>
      i.status === "pending" ||
      i.status === "high_priority" ||
      i.status === "flagged_ai",
  ).length;
  const approvedRec = items.filter(
    (i) => i.stream === "recitation" && i.status === "approved",
  ).length;
  const totalRecDecided = items.filter(
    (i) =>
      i.stream === "recitation" &&
      (i.status === "approved" || i.status === "rejected"),
  ).length;
  const accuracy =
    totalRecDecided > 0
      ? approvedRec / totalRecDecided
      : REVIEW_HUB_DEFAULT_METRICS.systemAccuracyRate;

  return {
    totalPending: pendingLike,
    dailyRecitationVerifications:
      REVIEW_HUB_DEFAULT_METRICS.dailyRecitationVerifications + approvedRec,
    activeScholars: REVIEW_HUB_DEFAULT_METRICS.activeScholars,
    systemAccuracyRate: Math.min(0.999, Math.max(0.5, accuracy)),
  };
}

export function matchesFilter(item: ReviewItem, filter: ReviewFilterTab): boolean {
  switch (filter) {
    case "pending":
      return item.status === "pending" || item.status === "flagged_ai";
    case "high_priority":
      return (
        item.priority === "high" &&
        item.status !== "approved" &&
        item.status !== "rejected"
      );
    case "flagged_ai":
      return item.flaggedByAi && item.status !== "approved" && item.status !== "rejected";
    case "approved":
      return item.status === "approved";
    case "rejected":
      return item.status === "rejected";
    default:
      return true;
  }
}

export function matchesSearch(item: ReviewItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    item.id,
    item.userId,
    item.userName,
    item.stream,
    item.status,
    item.stream === "recitation"
      ? `${item.verseRef} ${item.surah}:${item.ayah} ${item.expectedText}`
      : `${item.title} ${item.category} ${item.editedText}`,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function filterReviewItems(
  items: ReviewItem[],
  opts: {
    filter: ReviewFilterTab;
    streamFocus: "all" | ReviewStream;
    searchQuery: string;
  },
): ReviewItem[] {
  return items.filter((item) => {
    if (opts.streamFocus !== "all" && item.stream !== opts.streamFocus) return false;
    if (!matchesFilter(item, opts.filter)) return false;
    if (!matchesSearch(item, opts.searchQuery)) return false;
    return true;
  });
}

export function countByFilter(
  items: ReviewItem[],
  filter: ReviewFilterTab,
  streamFocus: "all" | ReviewStream = "all",
): number {
  return items.filter((item) => {
    if (streamFocus !== "all" && item.stream !== streamFocus) return false;
    return matchesFilter(item, filter);
  }).length;
}

export class ReviewHubStore {
  private items: ReviewItem[] = loadItems();
  private filter: ReviewFilterTab = "pending";
  private streamFocus: "all" | ReviewStream = "recitation";
  private searchQuery = "";
  private selectedIds: string[] = [];
  private darkMode = loadUi().darkMode;
  private sidebarCollapsed = loadUi().sidebarCollapsed;
  private listeners = new Set<Listener>();
  private snap: ReviewHubSnapshot = this.buildSnap();

  private buildSnap(): ReviewHubSnapshot {
    return {
      items: this.items.map((i) => ({ ...i })),
      filter: this.filter,
      streamFocus: this.streamFocus,
      searchQuery: this.searchQuery,
      selectedIds: [...this.selectedIds],
      metrics: computeMetrics(this.items),
      darkMode: this.darkMode,
      sidebarCollapsed: this.sidebarCollapsed,
    };
  }

  private persistItems(): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      /* ignore */
    }
  }

  private persistUi(): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(
        UI_KEY,
        JSON.stringify({
          darkMode: this.darkMode,
          sidebarCollapsed: this.sidebarCollapsed,
        }),
      );
    } catch {
      /* ignore */
    }
  }

  private notify(): void {
    this.snap = this.buildSnap();
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* ignore */
      }
    }
  }

  getSnapshot(): ReviewHubSnapshot {
    return this.snap;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setFilter(filter: ReviewFilterTab): void {
    if (this.filter === filter) return;
    this.filter = filter;
    this.selectedIds = [];
    this.notify();
  }

  setStreamFocus(streamFocus: "all" | ReviewStream): void {
    if (this.streamFocus === streamFocus) return;
    this.streamFocus = streamFocus;
    this.selectedIds = [];
    this.notify();
  }

  setSearchQuery(query: string): void {
    if (this.searchQuery === query) return;
    this.searchQuery = query;
    this.notify();
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter((x) => x !== id);
    } else {
      this.selectedIds = [...this.selectedIds, id];
    }
    this.notify();
  }

  selectMany(ids: string[]): void {
    this.selectedIds = [...new Set(ids)];
    this.notify();
  }

  clearSelection(): void {
    if (this.selectedIds.length === 0) return;
    this.selectedIds = [];
    this.notify();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.persistUi();
    this.notify();
  }

  setDarkMode(dark: boolean): void {
    if (this.darkMode === dark) return;
    this.darkMode = dark;
    this.persistUi();
    this.notify();
  }

  private patchItem(id: string, patch: Partial<ReviewItem>): void {
    this.items = this.items.map((item) => {
      if (item.id !== id) return item;
      return { ...item, ...patch } as ReviewItem;
    });
    this.selectedIds = this.selectedIds.filter((x) => x !== id);
    this.persistItems();
    this.notify();
  }

  approve(id: string): void {
    this.patchItem(id, { status: "approved", feedback: undefined });
  }

  reject(id: string, feedback: string): void {
    this.patchItem(id, {
      status: "rejected",
      feedback: feedback.trim() || "مرفوض من المشرف",
    });
  }

  overrideAiScore(id: string, score: number): void {
    const clamped = Math.min(100, Math.max(0, Math.round(score)));
    this.items = this.items.map((item) => {
      if (item.id !== id || item.stream !== "recitation") return item;
      return {
        ...item,
        overriddenScore: clamped,
        flaggedByAi: clamped < 75,
        status: item.status === "rejected" || item.status === "approved" ? item.status : "pending",
      };
    });
    this.persistItems();
    this.notify();
  }

  bulkUpdateStatus(ids: string[], status: Extract<ReviewStatus, "approved" | "rejected">, feedback?: string): void {
    const set = new Set(ids);
    this.items = this.items.map((item) => {
      if (!set.has(item.id)) return item;
      return {
        ...item,
        status,
        feedback:
          status === "rejected"
            ? feedback?.trim() || item.feedback || "رفض جماعي من المشرف"
            : undefined,
      };
    });
    this.selectedIds = [];
    this.persistItems();
    this.notify();
  }

  resetToSeed(): void {
    this.items = structuredClone(REVIEW_HUB_SEED);
    this.selectedIds = [];
    this.persistItems();
    this.notify();
  }
}

let singleton: ReviewHubStore | null = null;

export function getReviewHubStore(): ReviewHubStore {
  if (!singleton) singleton = new ReviewHubStore();
  return singleton;
}

export function createReviewHubStore(): ReviewHubStore {
  return new ReviewHubStore();
}

/** Test helper */
export function __resetReviewHubStoreForTests(): void {
  singleton = null;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(UI_KEY);
    }
  } catch {
    /* ignore */
  }
}
