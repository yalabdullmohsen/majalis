import { navigateTo, currentAppHref } from "@/lib/navigation-intent";
import type { QuranAyahReference, QuranReturnContext } from "./types";
import { buildQuranAyahReference, type BuildReferenceInput } from "./validate";
import { buildMushafAyahHref } from "./href";

const RETURN_CTX_KEY = "ssunnah:quran-nav-return-v1";
const PENDING_NAV_KEY = "ssunnah:quran-nav-pending-v1";

export type PendingAyahSelectionStatus =
  | "pending"
  | "pageReady"
  | "geometryReady"
  | "revealed"
  | "dismissed"
  | "failed";

export type PendingNavigationHighlight = {
  verseKey: string;
  pageNumber: number;
  source: string;
  requestedAt: number;
  navigationIntentId: string;
  status: PendingAyahSelectionStatus;
  suppressTafsir: true;
  suppressAudio: true;
  suppressAyahActions: true;
};

function writeSession(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clearSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function saveQuranReturnContext(ctx: QuranReturnContext): void {
  writeSession(RETURN_CTX_KEY, ctx);
}

export function loadQuranReturnContext(): QuranReturnContext | null {
  return readSession<QuranReturnContext>(RETURN_CTX_KEY);
}

export function clearQuranReturnContext(): void {
  clearSession(RETURN_CTX_KEY);
}

export function createPendingNavigationHighlight(
  ref: Pick<QuranAyahReference, "surahId" | "ayahId" | "pageNumber" | "navigationSource" | "requestedAt">,
): PendingNavigationHighlight {
  const verseKey = `${ref.surahId}:${ref.ayahId}`;
  return {
    verseKey,
    pageNumber: ref.pageNumber,
    source: ref.navigationSource,
    requestedAt: ref.requestedAt,
    navigationIntentId: `nav-${ref.requestedAt}-${verseKey}`,
    status: "pending",
    suppressTafsir: true,
    suppressAudio: true,
    suppressAyahActions: true,
  };
}

export function stashPendingNavigationHighlight(pending: PendingNavigationHighlight): void {
  writeSession(PENDING_NAV_KEY, pending);
}

export function consumePendingNavigationHighlight(): PendingNavigationHighlight | null {
  const v = readSession<PendingNavigationHighlight>(PENDING_NAV_KEY);
  clearSession(PENDING_NAV_KEY);
  return v;
}

export function peekPendingNavigationHighlight(): PendingNavigationHighlight | null {
  return readSession<PendingNavigationHighlight>(PENDING_NAV_KEY);
}

export function clearPendingNavigationHighlight(): void {
  clearSession(PENDING_NAV_KEY);
}

export function hasActiveNavigationIntent(): boolean {
  return peekPendingNavigationHighlight() != null;
}

/**
 * Canonical entry — validate → resolve page → stash pending → open reader.
 * Alias name مطلوب في عقد المهمة: openMushafAtReference.
 */
export function openMushafAtReference(
  input: BuildReferenceInput,
  opts?: { returnContext?: QuranReturnContext; replace?: boolean },
): { ok: true; href: string; ref: QuranAyahReference } | { ok: false; error: string } {
  return QuranNavigationService.openAyah(input, opts);
}

/** خدمة تنقّل مركزية — كل الأقسام تستدعيها. */
export const QuranNavigationService = {
  buildReference(input: BuildReferenceInput) {
    return buildQuranAyahReference(input);
  },

  buildHref(ref: QuranAyahReference, returnTo?: string): string {
    return buildMushafAyahHref(ref, {
      returnTo,
      highlight: ref.highlightMode === "navigation",
    });
  },

  openAyah(
    input: BuildReferenceInput,
    opts?: { returnContext?: QuranReturnContext; replace?: boolean },
  ): { ok: true; href: string; ref: QuranAyahReference } | { ok: false; error: string } {
    const built = buildQuranAyahReference(input);
    if (!built.ok) return built;

    const returnTo =
      opts?.returnContext?.sourceRoute ??
      input.sourceRoute ??
      (typeof window !== "undefined" ? currentAppHref() : undefined);

    if (opts?.returnContext) {
      saveQuranReturnContext(opts.returnContext);
    } else if (returnTo) {
      saveQuranReturnContext({
        sourceRoute: returnTo,
        sourceSectionId: input.sourceSectionId,
        sourceContentId: input.sourceContentId,
        scrollY: typeof window !== "undefined" ? window.scrollY : undefined,
      });
    }

    stashPendingNavigationHighlight(createPendingNavigationHighlight(built.ref));

    const href = buildMushafAyahHref(built.ref, {
      returnTo,
      highlight: built.ref.highlightMode === "navigation",
    });

    navigateTo(href, { mode: opts?.replace ? "state" : "screen" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ssunnah:quran-nav-pending"));
    }
    return { ok: true, href, ref: built.ref };
  },

  exitToReturnContext(fallback = "/quran-hub"): void {
    const ctx = loadQuranReturnContext();
    clearQuranReturnContext();
    navigateTo(ctx?.sourceRoute || fallback, { mode: "screen" });
    if (ctx?.scrollY != null && typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: ctx.scrollY!, behavior: "auto" });
      });
    }
  },
};
