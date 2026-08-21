/**
 * onboarding-state — بوابة "شاهد المستخدم شاشة الدخول الأولى؟" + راية
 * إشعار الخصوصية/الكوكيز. مصدر واحد لكليهما (تصميمان منفصلان منطقيًا،
 * لكن نفس آلية التخزين الموثوقة).
 *
 * السبب الجذري لتكرار النوافذ سابقًا: كل كتابة حالة في المستودع كانت
 * ‎try { localStorage.setItem(...) } catch { ignore }‎. إن فشل
 * ‎setItem‎ — خصوصية WKWebView، حصة ممتلئة، تخزين معطّل — لا تُحفظ الراية
 * ولا يُبلَّغ أحد، فتظهر الشاشة من جديد في *كل* إقلاع أو reload. الفشل
 * صامت ودائم.
 *
 * الحل هنا:
 *  ١) قراءة تحقّق بعد كل كتابة (read-back) — نعرف إن نزلت فعلًا.
 *  ٢) سلسلة احتياط: localStorage ← cookie (سنة) ← ذاكرة الجلسة.
 *     الكوكي ينجو من إخفاق localStorage ومن reload الـWebView.
 *  ٣) idempotent: تكرار الوسم لا يغيّر شيئًا ولا يفشل.
 *  ٤) مفتاح لكل شاشة + إصدار كبير واحد يُعيد العرض عند تغييره عمدًا فقط.
 */

import { storageGetSync, storageSetSync } from "./native-storage";

/** رفع هذا الرقم — وهذا وحده — يُعيد عرض شاشة الدخول لكل المستخدمين. */
export const ONBOARDING_MAJOR_VERSION = 1;

export const ONBOARDING_KEYS = {
  onboardingSeen: "onboarding_seen",
  storageNoticeSeen: "storage_notice_seen",
  majorVersion: "onboarding_major_version",
} as const;

export type OnboardingKey = (typeof ONBOARDING_KEYS)[keyof typeof ONBOARDING_KEYS];

const PREFIX = "majalis.onboarding.";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // سنة

/** احتياط أخير داخل الجلسة — يمنع تكرار النافذة في نفس الجلسة على الأقل. */
const memory = new Map<string, string>();

/* ── طبقة الكوكي ────────────────────────────────────────────────────── */
function cookieGet(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = `${PREFIX}${name}=`;
  for (const part of document.cookie.split(";")) {
    const s = part.trim();
    if (s.startsWith(target)) return decodeURIComponent(s.slice(target.length));
  }
  return null;
}

function cookieSet(name: string, value: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    document.cookie =
      `${PREFIX}${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    return cookieGet(name) === value;
  } catch {
    return false;
  }
}

/* ── القراءة/الكتابة الدائمة ────────────────────────────────────────── */
function readRaw(name: string): string | null {
  const key = `${PREFIX}${name}`;
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch {
    /* التخزين معطّل — ننزل للطبقة التالية */
  }
  const c = cookieGet(name);
  if (c !== null) return c;
  return memory.get(name) ?? null;
}

/**
 * يكتب في كل الطبقات المتاحة ويتحقّق من نزول القيمة.
 * @returns true إن نجحت طبقة *دائمة* (localStorage أو cookie) — أي أنّ
 *          القيمة تنجو من reload. false = الذاكرة فقط.
 */
function writeRaw(name: string, value: string): boolean {
  const key = `${PREFIX}${name}`;
  memory.set(name, value);

  let durable: boolean;
  try {
    localStorage.setItem(key, value);
    // read-back: بعض المتصفحات تقبل setItem صامتًا ثم لا تحفظ
    durable = localStorage.getItem(key) === value;
  } catch {
    durable = false;
  }

  // الكوكي دائمًا كذلك: طبقة ثانية مستقلة لا تتأثر بحصة localStorage
  const cookieOk = cookieSet(name, value);
  try {
    storageSetSync(key, value);
  } catch {
    /* Preferences طبقة أصلية إضافية — لا تُفشل الكتابة */
  }
  return durable || cookieOk;
}

function readFlag(name: string): boolean {
  return readRaw(name) === "1";
}

let warnedWriteFailure = false;

function setFlag(name: string): boolean {
  const ok = writeRaw(name, "1");
  // فشل دائم نادر (تخزين+كوكي معًا) — لا ندخل حلقة ظهور؛ الذاكرة تكفي للجلسة،
  // ونُحذِّر مرة واحدة بلا إزعاج للمستخدم.
  if (!ok && !warnedWriteFailure && typeof console !== "undefined") {
    warnedWriteFailure = true;
    try {
      console.warn("[onboarding] durable write failed; session memory only", name);
    } catch {
      /* ignore */
    }
  }
  return ok;
}

/* ── الإصدار الكبير ─────────────────────────────────────────────────── */
/**
 * @returns null إن لم يُكتب إصدار قطّ (مستخدم جديد أو ما قبل هذه البوابة).
 *          التمييز عن ‎0‎ ضروري: ‎0‎ إصدار قديم صالح يستوجب إعادة العرض،
 *          و‎null‎ يستوجب *ترحيلًا* لا إعادة عرض.
 */
function storedMajorVersion(): number | null {
  const raw = readRaw(ONBOARDING_KEYS.majorVersion);
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * ترحيل لمرّة واحدة من المفاتيح القديمة، ثم تثبيت الإصدار الحالي.
 * ⚠️ تحديث الموقع/نسخة جديدة *لا* يمسّ الإصدار الكبير — لذلك لا تعود
 * الشاشة عند reload أو نشر جديد، فقط عند رفع ONBOARDING_MAJOR_VERSION.
 */
export function initOnboardingState(): void {
  purgeLegacyFirstRunArtifacts();

  const stored = storedMajorVersion();

  if (stored === null) {
    // ترحيل: من أتمّ أي تهيئة/دخولية قديمة سابقًا لا يُسأل مرة أخرى
    try {
      const legacy = localStorage.getItem("majalis-first-run-setup-v1");
      if (legacy) {
        const parsed = JSON.parse(legacy) as { done?: boolean };
        if (parsed.done) setFlag(ONBOARDING_KEYS.onboardingSeen);
      }
      const consent = localStorage.getItem("majalis-cookie-consent-v1");
      if (consent && JSON.parse(consent)?.decidedAt) {
        setFlag(ONBOARDING_KEYS.storageNoticeSeen);
      }
      if (
        storageGetSync("onboarding.completed.v1") === "1" ||
        localStorage.getItem("onboarding.completed.v1") === "1"
      ) {
        setFlag(ONBOARDING_KEYS.onboardingSeen);
      }
    } catch {
      /* ترحيل أفضل-جهد؛ فشله يعني عرض الشاشة مرة واحدة فقط */
    }
  }

  if (stored !== ONBOARDING_MAJOR_VERSION) {
    if (stored !== null && stored < ONBOARDING_MAJOR_VERSION) {
      // رفع مقصود للإصدار الكبير — الطريق الآلي *الوحيد* لإعادة العرض.
      // تحديث الموقع/نشر نسخة جديدة لا يمسّه، فلا تعود الشاشة.
      clearOnboardingFlags();
    }
    writeRaw(ONBOARDING_KEYS.majorVersion, String(ONBOARDING_MAJOR_VERSION));
  }
}

/**
 * يزيل مفاتيح دخولية/دليل سريع قديمة أُلغيت بالكامل، حتى لا تُفهم خطأً
 * كبوابة عرض لأي تدفّق جديد.
 */
function purgeLegacyFirstRunArtifacts(): void {
  const keys = [
    "majalis-quick-guide-v1",
    "majalis-quick-guide-seen",
    "majlis-quick-guide-v1",
    "majalis-welcome-v1",
    "majalis-intro-seen",
    "majalis-boot-guide",
    "show-onboarding",
    "force-onboarding",
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function clearOnboardingFlags(): void {
  for (const name of [ONBOARDING_KEYS.onboardingSeen, ONBOARDING_KEYS.storageNoticeSeen]) {
    memory.delete(name);
    try {
      localStorage.removeItem(`${PREFIX}${name}`);
    } catch {
      /* ignore */
    }
    cookieSet(name, "");
    if (typeof document !== "undefined") {
      document.cookie = `${PREFIX}${name}=; path=/; max-age=0; SameSite=Lax`;
    }
  }
}

/* ── الواجهة العامة ─────────────────────────────────────────────────── */
export function hasSeenOnboarding(): boolean {
  return readFlag(ONBOARDING_KEYS.onboardingSeen);
}
export function markOnboardingSeen(): boolean {
  return setFlag(ONBOARDING_KEYS.onboardingSeen);
}

export function hasSeenStorageNotice(): boolean {
  return readFlag(ONBOARDING_KEYS.storageNoticeSeen);
}
export function markStorageNoticeSeen(): boolean {
  return setFlag(ONBOARDING_KEYS.storageNoticeSeen);
}

/** للاختبارات فقط */
export function __resetOnboardingStateForTests(): void {
  clearOnboardingFlags();
  memory.clear();
  try {
    localStorage.removeItem(`${PREFIX}${ONBOARDING_KEYS.majorVersion}`);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.cookie = `${PREFIX}${ONBOARDING_KEYS.majorVersion}=; path=/; max-age=0; SameSite=Lax`;
  }
}
