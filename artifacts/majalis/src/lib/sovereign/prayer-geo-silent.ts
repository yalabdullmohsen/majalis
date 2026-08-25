/**
 * ضبط صامت لمنطقة المواقيت — بلا popups موقع.
 * يكتشف انزياح المنطقة الزمنية للجهاز ويحدّث الجدولة بصمت.
 */
import { getActivePrayerLocation, setActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { resolveDeviceTimeZone } from "@/lib/sovereign/predictive-analytics";
import { scheduleNonCriticalWork } from "@/lib/power-saver-engine";

const FLAG = "__majalis_prayer_geo_silent__";
let lastCheckedTz = "";

function silentRescheduleAdhan(): void {
  void import("@/lib/adhan-scheduler").then(async (m) => {
    try {
      const { getPrayerTimes } = await import("@/lib/prayer-times");
      const loc = getActivePrayerLocation();
      const today = new Date().toISOString().slice(0, 10);
      const payload = await getPrayerTimes(today, {
        lat: loc.lat,
        lon: loc.lon,
        label: loc.label,
        timeZone: loc.timeZone,
      });
      await m.startAdhanScheduler(payload);
    } catch {
      /* ignore */
    }
  });
}

/** يحدّث timeZone المخزَن إن اختلفت منطقة الجهاز — دون طلب GPS. */
export function reconcilePrayerTimeZoneSilently(): boolean {
  const deviceTz = resolveDeviceTimeZone();
  if (!deviceTz || deviceTz === lastCheckedTz) return false;
  lastCheckedTz = deviceTz;

  const loc = getActivePrayerLocation();
  if (loc.timeZone === deviceTz) return false;

  /* الكويت ثابت — لا نغيّر إلا مصادر gps/city */
  if (loc.source === "kuwait") return false;

  setActivePrayerLocation({
    ...loc,
    timeZone: deviceTz,
    label: loc.label,
  });
  silentRescheduleAdhan();
  return true;
}

export function startPrayerGeoSilentWatcher(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  lastCheckedTz = resolveDeviceTimeZone();

  const tick = () => scheduleNonCriticalWork(() => reconcilePrayerTimeZoneSilently());

  tick();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
  window.addEventListener("focus", tick);
}

export function resetPrayerGeoSilentForTests(): void {
  lastCheckedTz = "";
  if (typeof window === "undefined") return;
  delete (window as unknown as Record<string, unknown>)[FLAG];
}
