/**
 * Part 7 resilience boot — memory pressure, mutation queue, storage probes.
 * Called from main alongside initFinalPolish. Logic-only.
 */

import { ensureMemoryPressureBinding } from "@/lib/memory-pressure";
import { initOfflineMutationQueue } from "@/lib/offline-mutation-queue";
import { probeLocalStorage, probeIndexedDB } from "@/lib/tiered-storage";
import { getNetworkStatus } from "@/hooks/useNetworkStatus";

let booted = false;

export function initResilienceLayer(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;

  // Warm network store (binds online/offline once)
  try {
    getNetworkStatus();
  } catch {
    /* ignore */
  }

  // Probe storage tiers (Private Browsing → memory fallback)
  probeLocalStorage();
  void probeIndexedDB();

  // Page Lifecycle + performance.memory pressure
  ensureMemoryPressureBinding();

  // Offline mutation outbox
  void initOfflineMutationQueue();
}
