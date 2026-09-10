/**
 * MushafReaderController — منطق الصفحة/التقليب/الأدوات/آخر موضع، منفصل عن العرض.
 */

import { savePagePosition } from "@/lib/quran-api";
import { clampMushafPage, MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";
import { MUSHAF_V2_FEATURES } from "./flags";
import { MushafPageRepository } from "./MushafPageRepository";

export type MushafReaderControllerSnapshot = {
  page: number;
  chromeOpen: boolean;
  navigating: boolean;
  selectedVerseKey: string | null;
};

type Listener = () => void;

export class MushafReaderController {
  private page: number;
  private chromeOpen = false;
  private navigating = false;
  private selectedVerseKey: string | null = null;
  private pendingSave: number | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<Listener>();
  private snap: MushafReaderControllerSnapshot;

  constructor(initialPage: number) {
    this.page = clampMushafPage(initialPage);
    this.snap = this.buildSnap();
  }

  private buildSnap(): MushafReaderControllerSnapshot {
    return {
      page: this.page,
      chromeOpen: this.chromeOpen,
      navigating: this.navigating,
      selectedVerseKey: this.selectedVerseKey,
    };
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

  getSnapshot(): MushafReaderControllerSnapshot {
    return this.snap;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getPage(): number {
    return this.page;
  }

  isNavigating(): boolean {
    return this.navigating;
  }

  beginNavigation(): boolean {
    if (!MUSHAF_V2_FEATURES.navigationLock) return true;
    if (this.navigating) return false;
    this.navigating = true;
    this.notify();
    return true;
  }

  endNavigation(settledPage?: number): void {
    if (typeof settledPage === "number") {
      this.page = clampMushafPage(settledPage);
      this.scheduleLastPageSave(this.page);
      MushafPageRepository.prefetchAdjacent(this.page);
    }
    this.navigating = false;
    this.notify();
  }

  requestPage(next: number): number | null {
    const clamped = clampMushafPage(next);
    if (clamped === this.page) return null;
    if (!this.beginNavigation()) return null;
    this.pendingSave = clamped;
    this.page = clamped;
    this.notify();
    return clamped;
  }

  syncExternalPage(page: number): void {
    const clamped = clampMushafPage(page);
    if (clamped === this.page && !this.navigating) return;
    this.page = clamped;
    this.navigating = false;
    this.scheduleLastPageSave(clamped);
    this.notify();
  }

  toggleChrome(): void {
    this.chromeOpen = !this.chromeOpen;
    this.notify();
  }

  setChromeOpen(open: boolean): void {
    if (this.chromeOpen === open) return;
    this.chromeOpen = open;
    this.notify();
  }

  selectVerse(key: string | null): void {
    this.selectedVerseKey = key;
    if (key) this.chromeOpen = false;
    this.notify();
  }

  jumpToPage(page: number): number {
    const clamped = Math.min(MUSHAF_PAGE_MAX, Math.max(MUSHAF_PAGE_MIN, Math.floor(page)));
    this.page = clamped;
    this.navigating = false;
    this.scheduleLastPageSave(clamped);
    MushafPageRepository.prefetchAdjacent(clamped);
    this.notify();
    return clamped;
  }

  private scheduleLastPageSave(page: number): void {
    if (!MUSHAF_V2_FEATURES.settledLastPageSave) {
      savePagePosition(page);
      return;
    }
    this.pendingSave = page;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      if (this.pendingSave == null) return;
      if (this.navigating) return;
      savePagePosition(this.pendingSave);
      this.pendingSave = null;
    }, 180);
  }

  dispose(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.listeners.clear();
  }
}
