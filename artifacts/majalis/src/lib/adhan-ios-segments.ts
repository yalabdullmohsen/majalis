/**
 * جدولة تنبيه أذان قصير على iOS (إشعار واحد ≤28ث).
 * الأذان الكامل وسلاسل المقاطع محذوفة نهائيًا — لا تُجدول أبدًا.
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isIOS } from "./capacitor-utils";
import { ADHAN_SHORT_MAX_SEC } from "./adhan-playback-modes";
import {
  DEFAULT_ADHAN_SHORT_SOUND_ID,
  iosNotificationSoundName,
} from "./notification-alert-catalog";

export const ADHAN_IOS_MAX_SEGMENTS = 1;
export const ADHAN_IOS_SEGMENT_MAX_SEC = Math.min(28, ADHAN_SHORT_MAX_SEC);
/** لم يعد يُستخدم للسلاسل — بقي للتوافق مع الاختبارات القديمة */
export const ADHAN_IOS_SEGMENT_SCHEDULE_GAP_SEC = 29;

/** السلاسل المتتابعة معطّلة نهائيًا */
export const ADHAN_IOS_MULTI_SEGMENT_BUNDLED = false;

export type AdhanIosSegmentPlan = {
  /** معرّف الإشعار */
  id: number;
  /** اسم ملف الصوت في الحزمة بدون مسار (مثل adhan-makkah-short.caf) */
  sound: string;
  /** موعد الإطلاق */
  atMs: number;
  /** عنوان — للمقطع الأول فقط */
  title: string | null;
  body: string | null;
  prayerKey: string;
  segmentIndex: number;
};

const CHAIN_STORE_KEY = "majalis-adhan-ios-chain-v2";

type ChainRecord = {
  prayerKey: string;
  dayKey: string;
  ids: number[];
  startedAt: number;
};

type ChainMap = Record<string, ChainRecord>;

function chainStoreKey(prayerKey: string, dayKey: string): string {
  return `${prayerKey.toLowerCase()}:${dayKey}`;
}

function chainIdBase(prayerKey: string, dayKey: string): number {
  // نطاق بعيداً عن إشعارات الصلاة الأخرى وعن تذكيرات 70000
  let h = 0;
  const s = `${prayerKey}:${dayKey}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 710_000 + (h % 20_000);
}

/** أسماء المقاطع — تُرجع دائمًا مقطعًا قصيرًا (لا seq). */
export function adhanIosSoundName(
  recordingId: string,
  _kind: "general" | "fajr",
  _segmentIndex1Based: number,
): string {
  const shortMap: Record<string, string> = {
    makkah: "adhan-short-makkah.caf",
    makki: "adhan-short-makkah.caf",
    alharam: "adhan-short-makkah.caf",
    egypt: "adhan-short-egypt.caf",
    aqsa: "adhan-short-aqsa.caf",
    takbeerat: "adhan-short-takbeerat.caf",
    soft: "adhan-short-takbeerat.caf",
  };
  return shortMap[recordingId] ?? "adhan-short-makkah.caf";
}

/**
 * يبني خطة إشعار قصير واحد فقط — لا سلاسل.
 */
export function buildAdhanIosSegmentPlan(opts: {
  prayerKey: string;
  prayerName: string;
  recordingId: string;
  isFajr: boolean;
  startAtMs: number;
  /** مدد المقاطع — يُتجاهل ما بعد الأول */
  durationsSec: number[];
}): AdhanIosSegmentPlan[] {
  const dayKey = new Date(opts.startAtMs).toISOString().slice(0, 10);
  const base = chainIdBase(opts.prayerKey, dayKey);
  const kind = opts.isFajr ? "fajr" : "general";
  return [
    {
      id: base,
      sound: adhanIosSoundName(opts.recordingId, kind, 1),
      atMs: opts.startAtMs,
      title: `أذان ${opts.prayerName}`,
      body: "حيّ على الصلاة",
      prayerKey: opts.prayerKey,
      segmentIndex: 0,
    },
  ];
}

let _memoryChains: ChainMap = {};

function readChainMap(): ChainMap {
  try {
    if (typeof sessionStorage !== "undefined") {
      const raw = sessionStorage.getItem(CHAIN_STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChainMap | ChainRecord;
        if (parsed && typeof parsed === "object" && !("ids" in parsed)) {
          return parsed as ChainMap;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return { ..._memoryChains };
}

function writeChainMap(map: ChainMap) {
  _memoryChains = { ...map };
  try {
    if (typeof sessionStorage === "undefined") return;
    if (!Object.keys(map).length) sessionStorage.removeItem(CHAIN_STORE_KEY);
    else sessionStorage.setItem(CHAIN_STORE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function upsertChain(rec: ChainRecord) {
  const map = readChainMap();
  map[chainStoreKey(rec.prayerKey, rec.dayKey)] = rec;
  writeChainMap(map);
}

export function isAdhanIosSegmentsAvailable(): boolean {
  return Capacitor.isNativePlatform() && isIOS;
}

/** يلغي سلسلة صلاة واحدة، أو كل السلاسل إن لم يُمرَّر مفتاح. */
export async function cancelAdhanIosSegmentChain(prayerKey?: string): Promise<number[]> {
  const map = readChainMap();
  const pk = prayerKey?.toLowerCase();
  const toCancel = Object.entries(map).filter(([key, rec]) =>
    pk ? rec.prayerKey.toLowerCase() === pk || key.startsWith(`${pk}:`) : true,
  );
  const ids = toCancel.flatMap(([, rec]) => rec.ids);
  for (const [key] of toCancel) delete map[key];
  writeChainMap(map);
  if (!ids.length) return [];
  if (!isAdhanIosSegmentsAvailable()) return ids;
  try {
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  } catch {
    /* ignore */
  }
  return ids;
}

/**
 * يجدول إشعارًا قصيرًا واحدًا فقط — يقطع أي سلسلة أطول من مقطع.
 */
export async function scheduleAdhanIosSegmentChain(
  plan: AdhanIosSegmentPlan[],
): Promise<{ ok: boolean; ids: number[] }> {
  if (!plan.length) return { ok: false, ids: [] };
  // فرض مقطع واحد فقط — لا سلاسل
  const single = plan.slice(0, 1);
  const prayerKey = single[0].prayerKey;
  const dayKey = new Date(single[0].atMs).toISOString().slice(0, 10);
  const map = readChainMap();
  const storeKey = chainStoreKey(prayerKey, dayKey);
  const prev = map[storeKey];
  if (prev?.ids.length && isAdhanIosSegmentsAvailable()) {
    try {
      await LocalNotifications.cancel({
        notifications: prev.ids.map((id) => ({ id })),
      });
    } catch {
      /* ignore */
    }
  }
  delete map[storeKey];
  writeChainMap(map);

  const rec: ChainRecord = {
    prayerKey,
    dayKey,
    ids: single.map((p) => p.id),
    startedAt: Date.now(),
  };

  if (!isAdhanIosSegmentsAvailable()) {
    if (import.meta.env?.DEV) {
      console.info("[adhan-schedule]", {
        prayerName: single[0].title,
        prayerKey: single[0].prayerKey,
        prayerTime: new Date(single[0].atMs).toISOString(),
        mode: "short",
        soundName: single[0].sound,
        notificationId: single[0].id,
        segmentIndex: 0,
      });
    }
    upsertChain(rec);
    return { ok: true, ids: rec.ids };
  }

  const notifications = single.map((p) => ({
    id: p.id,
    title: p.title || `أذان ${prayerKey}`,
    body: p.body || "حيّ على الصلاة",
    schedule: { at: new Date(p.atMs), allowWhileIdle: true },
    sound: p.sound,
    extra: {
      adhanSegment: true,
      prayerKey: p.prayerKey,
      segmentIndex: 0,
      dayKey,
      shortOnly: true,
    },
  }));

  await LocalNotifications.schedule({ notifications });
  upsertChain(rec);
  return { ok: true, ids: rec.ids };
}

/** مدة افتراضية — مقطع واحد فقط */
export function defaultAdhanSegmentDurations(count = 1): number[] {
  return Array.from({ length: Math.min(1, Math.max(1, count)) }, () =>
    ADHAN_IOS_SEGMENT_MAX_SEC,
  );
}

/** لا دعم لسلاسل بعد الآن */
export function recordingSupportsIosChainedSegments(_recordingId: string): boolean {
  return false;
}

/**
 * جدولة أذان قصير فقط على iOS — أي mode=full يُرحَّل إلى short.
 * لا سلاسل مقاطع.
 */
export async function scheduleIosFullAdhan(opts: {
  prayerKey: string;
  prayerName: string;
  recordingId: string;
  isFajr: boolean;
  startAtMs: number;
  durationsSec?: number[];
  deliveryMode?: "full" | "short" | "takbir" | "silent";
}): Promise<{ ok: boolean; ids: number[] }> {
  return scheduleIosAdhanSegments(opts);
}

/**
 * نقطة الدخول الرسمية: إشعار قصير واحد بصوت CAF معتمد.
 * لا يجدول سلسلة أبدًا.
 */
export async function scheduleIosAdhanSegments(opts: {
  prayerKey: string;
  prayerName: string;
  recordingId: string;
  isFajr: boolean;
  startAtMs: number;
  durationsSec?: number[];
  deliveryMode?: "full" | "short" | "takbir" | "silent";
}): Promise<{ ok: boolean; ids: number[] }> {
  const mode = opts.deliveryMode === "silent" ? "silent" : "short";
  if (mode === "silent") return { ok: false, ids: [] };

  const dayKey = new Date(opts.startAtMs).toISOString().slice(0, 10);
  const id = chainIdBase(opts.prayerKey, dayKey);
  const catalogSound =
    iosNotificationSoundName(DEFAULT_ADHAN_SHORT_SOUND_ID) ??
    adhanIosSoundName(opts.recordingId, opts.isFajr ? "fajr" : "general", 1);

  const plan: AdhanIosSegmentPlan[] = [
    {
      id,
      sound: catalogSound,
      atMs: opts.startAtMs,
      title: `أذان ${opts.prayerName}`,
      body: "حيّ على الصلاة",
      prayerKey: opts.prayerKey,
      segmentIndex: 0,
    },
  ];
  return scheduleAdhanIosSegmentChain(plan);
}
