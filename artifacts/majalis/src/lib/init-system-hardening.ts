/**
 * Part 10 system hardening boot — quota emergency, battery throttle, storage probe.
 * Logic-only; called once from main.tsx alongside initFinalPolish.
 */

import { initQuotaEmergencyProtocol, probeStoragePressure } from "@/lib/quota-emergency";
import { startBatteryMonitoring } from "@/lib/battery-throttle";
import { maybeAutoEvictStorage } from "@/lib/smart-cache-eviction";

let booted = false;

export function initSystemHardening(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;

  initQuotaEmergencyProtocol();
  startBatteryMonitoring();

  const kick = () => {
    void maybeAutoEvictStorage();
    void probeStoragePressure();
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(kick, { timeout: 6_000 });
  } else {
    setTimeout(kick, 4_000);
  }
}
