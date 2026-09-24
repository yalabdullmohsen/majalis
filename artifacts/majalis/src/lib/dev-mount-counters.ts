/**
 * عدّادات Mount/Render للتشخيص — Development فقط.
 * لا تُعرض للمستخدم · لا تؤثر على الإنتاج.
 */
export type DevMountCounterKey =
  | "root"
  | "router"
  | "appShell"
  | "header"
  | "bottomNav"
  | "prayerPage";

type CounterBucket = { mounts: number; renders: number };

const buckets: Record<DevMountCounterKey, CounterBucket> = {
  root: { mounts: 0, renders: 0 },
  router: { mounts: 0, renders: 0 },
  appShell: { mounts: 0, renders: 0 },
  header: { mounts: 0, renders: 0 },
  bottomNav: { mounts: 0, renders: 0 },
  prayerPage: { mounts: 0, renders: 0 },
};

function isDevMountInstrumentation(): boolean {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  } catch {
    /* ignore */
  }
  try {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { __SUNNAH_MOUNT_COUNTERS__?: boolean }).__SUNNAH_MOUNT_COUNTERS__
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function recordDevMount(key: DevMountCounterKey): void {
  if (!isDevMountInstrumentation()) return;
  buckets[key].mounts += 1;
}

export function recordDevRender(key: DevMountCounterKey): void {
  if (!isDevMountInstrumentation()) return;
  buckets[key].renders += 1;
}

export function readDevMountCounters(): Record<DevMountCounterKey, CounterBucket> {
  return {
    root: { ...buckets.root },
    router: { ...buckets.router },
    appShell: { ...buckets.appShell },
    header: { ...buckets.header },
    bottomNav: { ...buckets.bottomNav },
    prayerPage: { ...buckets.prayerPage },
  };
}

export function resetDevMountCounters(): void {
  if (!isDevMountInstrumentation()) return;
  for (const key of Object.keys(buckets) as DevMountCounterKey[]) {
    buckets[key].mounts = 0;
    buckets[key].renders = 0;
  }
}
