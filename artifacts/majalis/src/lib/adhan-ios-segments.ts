/**
 * جدولة أذان كامل على iOS كمقاطع إشعار متتابعة ≤28ث (حد النظام 30ث).
 * الملفات يجب أن تكون مضمّنة في الحزمة (Sounds/*.caf) ومسجّلة في Xcode.
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isIOS } from "./capacitor-utils";
import { ADHAN_SHORT_MAX_SEC } from "./adhan-playback-modes";

export const ADHAN_IOS_MAX_SEGMENTS = 4;
export const ADHAN_IOS_SEGMENT_MAX_SEC = Math.min(28, ADHAN_SHORT_MAX_SEC);
/** فاصل جدولة ثابت بين بداية المقاطع (ملف ≤28ث + هامش ١ث) */
export const ADHAN_IOS_SEGMENT_SCHEDULE_GAP_SEC = 29;

/**
 * مقاطع الأذان الكامل المتعدّدة (`adhan-seq-makkah-0N.caf`) مضمّنة في الحزمة.
 * الوضع التجريبي فقط — غير افتراضي؛ قد يقطعها الصامت/Focus.
 */
export const ADHAN_IOS_MULTI_SEGMENT_BUNDLED = true;

export type AdhanIosSegmentPlan = {
  /** معرّف الإشعار */
  id: number;
  /** اسم ملف الصوت في الحزمة بدون مسار (مثل adhan-seq-makkah-01.caf) */
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
  // نطاق بعيداً عن إشعارات الصلاة الأخرى
  let h = 0;
  const s = `${prayerKey}:${dayKey}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 710_000 + (h % 20_000);
}

/** أسماء المقاطع المتوقعة في الحزمة لتسجيل معيّن */
export function adhanIosSoundName(
  recordingId: string,
  kind: "general" | "fajr",
  segmentIndex1Based: number,
): string {
  if (recordingId === "makkah" || recordingId === "makki" || recordingId === "alharam") {
    return `adhan-seq-makkah-0${segmentIndex1Based}.caf`;
  }
  const shortMap: Record<string, string> = {
    egypt: "adhan-short-egypt.caf",
    aqsa: "adhan-short-aqsa.caf",
    takbeerat: "adhan-short-takbeerat.caf",
    soft: "adhan-short-takbeerat.caf",
  };
  return shortMap[recordingId] ?? "adhan-short-makkah.caf";
}

/**
 * يبني خطة ≤4 مقاطع بفجوات = مدة المقطع السابق.
 * durationsSec يجب أن يكون كل عنصر ≤28.
 */
export function buildAdhanIosSegmentPlan(opts: {
  prayerKey: string;
  prayerName: string;
  recordingId: string;
  isFajr: boolean;
  startAtMs: number;
  /** مدد المقاطع بالثواني (من الميتاداتا/التقطيع) */
  durationsSec: number[];
}): AdhanIosSegmentPlan[] {
  const clipped = opts.durationsSec
    .slice(0, ADHAN_IOS_MAX_SEGMENTS)
    .map((d) => Math.min(ADHAN_IOS_SEGMENT_MAX_SEC, Math.max(1, d)));
  if (clipped.length === 0) return [];

  const dayKey = new Date(opts.startAtMs).toISOString().slice(0, 10);
  const base = chainIdBase(opts.prayerKey, dayKey);
  const kind = opts.isFajr ? "fajr" : "general";
  const plan: AdhanIosSegmentPlan[] = [];

  for (let i = 0; i < clipped.length; i++) {
    const isFirst = i === 0;
    plan.push({
      id: base + i,
      sound: adhanIosSoundName(opts.recordingId, kind, i + 1),
      atMs: opts.startAtMs + i * ADHAN_IOS_SEGMENT_SCHEDULE_GAP_SEC * 1000,
      title: isFirst ? `أذان ${opts.prayerName}` : `تتمة أذان ${opts.prayerName}`,
      body: isFirst
        ? "حيّ على الصلاة"
        : `المقطع ${i + 1} من ${clipped.length}`,
      prayerKey: opts.prayerKey,
      segmentIndex: i,
    });
  }
  return plan;
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
 * يجدول سلسلة مقاطع لصلاة واحدة. يلغي سلسلة نفس الصلاة/اليوم فقط — لا يمسح صلوات أخرى.
 */
export async function scheduleAdhanIosSegmentChain(
  plan: AdhanIosSegmentPlan[],
): Promise<{ ok: boolean; ids: number[] }> {
  if (!plan.length) return { ok: false, ids: [] };
  const prayerKey = plan[0].prayerKey;
  const dayKey = new Date(plan[0].atMs).toISOString().slice(0, 10);
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
    ids: plan.map((p) => p.id),
    startedAt: Date.now(),
  };

  if (!isAdhanIosSegmentsAvailable()) {
    if (import.meta.env?.DEV) {
      for (const p of plan) {
        console.info("[adhan-schedule]", {
          prayerName: p.title ?? plan[0].title,
          prayerKey: p.prayerKey,
          prayerTime: new Date(p.atMs).toISOString(),
          mode: plan.length > 1 ? "sequential" : "short",
          soundName: p.sound,
          notificationId: p.id,
          segmentIndex: p.segmentIndex,
        });
      }
    }
    upsertChain(rec);
    return { ok: true, ids: rec.ids };
  }

  const notifications = plan.map((p) => ({
    id: p.id,
    title: p.title || `أذان ${prayerKey}`,
    body: p.body || "حيّ على الصلاة",
    schedule: { at: new Date(p.atMs), allowWhileIdle: true },
    sound: p.sound,
    extra: {
      adhanSegment: true,
      prayerKey: p.prayerKey,
      segmentIndex: p.segmentIndex,
      dayKey,
    },
  }));

  await LocalNotifications.schedule({ notifications });
  if (import.meta.env?.DEV) {
    for (const p of plan) {
      console.info("[adhan-schedule]", {
        prayerName: p.title ?? plan[0].title,
        prayerKey: p.prayerKey,
        prayerTime: new Date(p.atMs).toISOString(),
        mode: plan.length > 1 ? "sequential" : "short",
        soundName: p.sound,
        notificationId: p.id,
        segmentIndex: p.segmentIndex,
      });
    }
  }
  upsertChain(rec);
  return { ok: true, ids: rec.ids };
}

/** مدة افتراضية عند غياب ميتاداتا التقطيع — 4×28ث كحد أقصى */
export function defaultAdhanSegmentDurations(count = ADHAN_IOS_MAX_SEGMENTS): number[] {
  return Array.from({ length: Math.min(ADHAN_IOS_MAX_SEGMENTS, count) }, () =>
    ADHAN_IOS_SEGMENT_MAX_SEC,
  );
}

/** هل يتوفر تقطيع CAF متتابع لهذا التسجيل في الحزمة؟ */
export function recordingSupportsIosChainedSegments(recordingId: string): boolean {
  return (
    recordingId === "makkah" ||
    recordingId === "makki" ||
    recordingId === "alharam"
  );
}

/**
 * جدولة أذان على iOS من معرّف التسجيل.
 * وضع full + تسجيل يدعم السلسلة → حتى ٤ إشعارات متتابعة (≤٢٨ث لكل مقطع).
 * وضع short/takbir → إشعار واحد بصوت CAF قصير.
 */
export async function scheduleIosFullAdhan(opts: {
  prayerKey: string;
  prayerName: string;
  recordingId: string;
  isFajr: boolean;
  startAtMs: number;
  durationsSec?: number[];
  /** صيغة التسليم — full يفعّل السلسلة عند توفر المقاطع */
  deliveryMode?: "full" | "short" | "takbir" | "silent";
}): Promise<{ ok: boolean; ids: number[] }> {
  const mode = opts.deliveryMode ?? "full";
  if (mode === "silent") return { ok: false, ids: [] };

  const canChain =
    ADHAN_IOS_MULTI_SEGMENT_BUNDLED &&
    mode === "full" &&
    recordingSupportsIosChainedSegments(opts.recordingId);

  // الافتراضي والآمن: إشعار واحد بصوت قصير مضمّن
  if (!canChain) {
    const { resolveAdhanStyleNotificationSound } = await import(
      "./prayer-notification-sounds"
    );
    const isMakkahStyle = opts.recordingId === "makkah" || opts.recordingId === "makki" || opts.recordingId === "alharam";
    const dayKey = new Date(opts.startAtMs).toISOString().slice(0, 10);
    const id = chainIdBase(opts.prayerKey, dayKey);
    const sound =
      opts.isFajr && isMakkahStyle ? "adhan-short-makkah-fajr.caf" : resolveAdhanStyleNotificationSound(opts.recordingId);
    const plan: AdhanIosSegmentPlan[] = [
      {
        id,
        sound,
        atMs: opts.startAtMs,
        title: `أذان ${opts.prayerName}`,
        body: "حيّ على الصلاة، افتح التطبيق لسماع الأذان الكامل",
        prayerKey: opts.prayerKey,
        segmentIndex: 0,
      },
    ];
    const result = await scheduleAdhanIosSegmentChain(plan);
    return result;
  }

  const plan = buildAdhanIosSegmentPlan({
    prayerKey: opts.prayerKey,
    prayerName: opts.prayerName,
    recordingId: opts.recordingId,
    isFajr: opts.isFajr,
    startAtMs: opts.startAtMs,
    durationsSec: opts.durationsSec ?? defaultAdhanSegmentDurations(),
  });
  const result = await scheduleAdhanIosSegmentChain(plan);
  return result;
}
