/**
 * جسر Capacitor — أذان كامل على أندرويد عبر AlarmManager + خدمة أمامية.
 * على الويب/iOS: no-op آمن.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";
import { isAndroid } from "./capacitor-utils";

type MajlisAdhanAlarmPlugin = {
  scheduleExact(opts: {
    atMs: number;
    url: string;
    title: string;
    prayerKey: string;
    requestCode?: number;
  }): Promise<{ ok: boolean; requestCode: number }>;
  cancel(opts: { prayerKey: string; requestCode?: number }): Promise<{ ok: boolean }>;
  canScheduleExact(): Promise<{ ok: boolean }>;
  openExactAlarmSettings(): Promise<{ ok: boolean }>;
  isIgnoringBatteryOptimizations(): Promise<{ ok: boolean }>;
  requestIgnoreBatteryOptimizations(): Promise<{ ok: boolean }>;
  playNow(opts: {
    url: string;
    title: string;
    prayerKey: string;
  }): Promise<{ ok: boolean }>;
};

const Native = registerPlugin<MajlisAdhanAlarmPlugin>("MajlisAdhanAlarm");

export function isAdhanAndroidAlarmAvailable(): boolean {
  return Capacitor.isNativePlatform() && isAndroid;
}

export async function scheduleAndroidFullAdhan(opts: {
  atMs: number;
  url: string;
  title: string;
  prayerKey: string;
}): Promise<boolean> {
  if (!isAdhanAndroidAlarmAvailable()) return false;
  try {
    const can = await Native.canScheduleExact();
    if (!can.ok) return false;
    await Native.scheduleExact(opts);
    return true;
  } catch {
    return false;
  }
}

export async function cancelAndroidFullAdhan(prayerKey: string): Promise<void> {
  if (!isAdhanAndroidAlarmAvailable()) return;
  try {
    await Native.cancel({ prayerKey });
  } catch {
    /* ignore */
  }
}

export async function getAndroidAdhanPermissionStatus(): Promise<{
  exactAlarm: boolean;
  battery: boolean;
}> {
  if (!isAdhanAndroidAlarmAvailable()) {
    return { exactAlarm: false, battery: false };
  }
  try {
    const exact = await Native.canScheduleExact();
    const bat = await Native.isIgnoringBatteryOptimizations();
    return { exactAlarm: exact.ok, battery: bat.ok };
  } catch {
    return { exactAlarm: false, battery: false };
  }
}

export async function openAndroidExactAlarmSettings(): Promise<void> {
  if (!isAdhanAndroidAlarmAvailable()) return;
  try {
    await Native.openExactAlarmSettings();
  } catch {
    /* ignore */
  }
}

export async function openAndroidBatteryOptimizationSettings(): Promise<void> {
  if (!isAdhanAndroidAlarmAvailable()) return;
  try {
    await Native.requestIgnoreBatteryOptimizations();
  } catch {
    /* ignore */
  }
}

/** يفتح إعدادات النظام عند الحاجة — للاستدعاء من معالج الإعداد الأولي. */
export async function ensureAndroidAdhanPermissions(): Promise<{
  exactAlarm: boolean;
  battery: boolean;
}> {
  if (!isAdhanAndroidAlarmAvailable()) {
    return { exactAlarm: false, battery: false };
  }
  try {
    const before = await getAndroidAdhanPermissionStatus();
    if (!before.exactAlarm) await Native.openExactAlarmSettings();
    if (!before.battery) await Native.requestIgnoreBatteryOptimizations();
    return await getAndroidAdhanPermissionStatus();
  } catch {
    return { exactAlarm: false, battery: false };
  }
}

export async function playAndroidAdhanNow(opts: {
  url: string;
  title: string;
  prayerKey: string;
}): Promise<boolean> {
  if (!isAdhanAndroidAlarmAvailable()) return false;
  try {
    await Native.playNow(opts);
    return true;
  } catch {
    return false;
  }
}
