/**
 * بوابة التشغيل الأول — الاختبارات الإلزامية الستة.
 * تُحاكي localStorage وdocument.cookie، وتُحاكي *فشل* localStorage الصامت
 * وهو السبب الجذري لتكرار النوافذ في WKWebView.
 */
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

/* ── محاكاة بيئة المتصفح قبل استيراد الوحدة ─────────────────────────── */
type Store = Map<string, string>;
let lsStore: Store = new Map();
let lsThrows = false;

function installEnv() {
  lsStore = new Map();
  lsThrows = false;
  const g = globalThis as unknown as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => {
      if (lsThrows) throw new Error("storage disabled");
      return lsStore.has(k) ? lsStore.get(k)! : null;
    },
    setItem: (k: string, v: string) => {
      if (lsThrows) throw new Error("QuotaExceededError");
      lsStore.set(k, v);
    },
    removeItem: (k: string) => {
      if (lsThrows) throw new Error("storage disabled");
      lsStore.delete(k);
    },
  };

  const cookies: Store = new Map();
  g.document = {
    get cookie() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(raw: string) {
      const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      const expired = attrs.some((a) => /^max-age=0$/i.test(a));
      if (expired || value === "") cookies.delete(name);
      else cookies.set(name, value);
    },
  };
}

installEnv();

const mod = await import("../onboarding-state.js");
const {
  initOnboardingState,
  hasSeenOnboarding,
  markOnboardingSeen,
  hasCompletedPreferences,
  markPreferencesCompleted,
  markPreferencesSkipped,
  hasSeenReminderPrompt,
  markReminderPromptSeen,
  hasSeenStorageNotice,
  markStorageNoticeSeen,
  isOnboardingPending,
  resetOnboardingForDisplay,
  __resetOnboardingStateForTests,
  ONBOARDING_MAJOR_VERSION,
  ONBOARDING_KEYS,
} = mod;

beforeEach(() => {
  installEnv();
  __resetOnboardingStateForTests();
});

/* ── ١) مستخدم جديد: تظهر التهيئة مرة واحدة ────────────────────────── */
test("١ مستخدم جديد: التهيئة مستحقّة، وبعد الإنهاء لا تعود", () => {
  initOnboardingState();
  assert.equal(isOnboardingPending(), true, "مستخدم جديد ⇒ التهيئة مستحقّة");

  markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();

  assert.equal(isOnboardingPending(), false, "بعد الإنهاء ⇒ غير مستحقّة");
});

/* ── ٢) بعد «تخطّي»: لا تعود بعد reload ─────────────────────────────── */
test("٢ «تخطّي» يُسجَّل ويصمد عبر reload", () => {
  initOnboardingState();
  markOnboardingSeen();
  markPreferencesSkipped();
  markReminderPromptSeen();

  // reload = وحدة تُقرأ من جديد على نفس التخزين
  initOnboardingState();
  assert.equal(hasSeenOnboarding(), true);
  assert.equal(hasCompletedPreferences(), true, "«تخطّي» يُعدّ إتمامًا للتفضيلات");
  assert.equal(isOnboardingPending(), false, "لا تعود بعد reload");
});

/* ── ٣) بعد «إنهاء»: لا تعود بعد إغلاق وفتح التطبيق ─────────────────── */
test("٣ «إنهاء» يصمد عبر إعادة تشغيل التطبيق", () => {
  initOnboardingState();
  markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();
  markStorageNoticeSeen();

  // إعادة تشغيل: نفس التخزين، استدعاء init مرة أخرى (idempotent)
  initOnboardingState();
  initOnboardingState();

  assert.equal(isOnboardingPending(), false);
  assert.equal(hasSeenStorageNotice(), true, "شريط الخصوصية لا يعود");
});

/* ── ٤) لا إذن إشعارات تلقائي ───────────────────────────────────────── */
test("٤ الوحدة لا تطلب إذن إشعارات ولا تلمس Notification/Permissions", async () => {
  const { readFileSync } = await import("node:fs");
  const { resolve, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const src = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../onboarding-state.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /requestPermission|Notification\s*\.|LocalNotifications|PushNotifications/);
});

/* ── ٥) تحديث الموقع لا يعيد التهيئة؛ الإصدار الكبير وحده يفعل ──────── */
test("٥ نسخة جديدة لا تعيد التهيئة — الإصدار الكبير فقط", () => {
  initOnboardingState();
  markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();
  assert.equal(isOnboardingPending(), false);

  // نشر نسخة جديدة = init يُستدعى مرارًا؛ الرايات كما هي
  for (let i = 0; i < 5; i++) initOnboardingState();
  assert.equal(isOnboardingPending(), false, "reload/نشر لا يعيد التهيئة");

  // تغيير مقصود للإصدار الكبير ⇒ تُعاد
  const key = `majalis.onboarding.${ONBOARDING_KEYS.majorVersion}`;
  lsStore.set(key, String(ONBOARDING_MAJOR_VERSION - 1));
  (globalThis as unknown as { document: { cookie: string } }).document.cookie =
    `${key}=; path=/; max-age=0`;
  initOnboardingState();
  assert.equal(isOnboardingPending(), true, "رفع الإصدار الكبير يعيد التهيئة");
});

/* ── ٦) iOS/Capacitor: فشل localStorage الصامت لا يكرّر النوافذ ─────── */
test("٦ إخفاق localStorage لا يعيد النوافذ — الكوكي يحمل الحالة", () => {
  initOnboardingState();
  // WKWebView خصوصية/حصة ممتلئة: setItem وgetItem يرميان
  lsThrows = true;

  const durable = markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();

  assert.equal(durable, true, "الكتابة نزلت في طبقة دائمة (كوكي) رغم فشل localStorage");
  assert.equal(hasSeenOnboarding(), true, "تُقرأ من الكوكي");
  assert.equal(isOnboardingPending(), false, "لا تكرار للنوافذ بعد WKWebView reload");
});

/* ── إضافي: زر «إعادة عرض التهيئة» هو الطريق اليدوي الوحيد ─────────── */
test("زر الإعدادات يعيد العرض عند الطلب فقط", () => {
  initOnboardingState();
  markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();
  assert.equal(isOnboardingPending(), false);

  resetOnboardingForDisplay();
  assert.equal(isOnboardingPending(), true, "بعد الطلب اليدوي تُعرض من جديد");

  // ولا تُعاد تلقائيًا مرة أخرى بعد إتمامها
  markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();
  initOnboardingState();
  assert.equal(isOnboardingPending(), false);
});

test("resetOnboardingForSettingsOnly و shouldShowFirstRunFlow مرادفان مستقران", () => {
  const {
    shouldShowFirstRunFlow,
    resetOnboardingForSettingsOnly,
  } = mod;
  initOnboardingState();
  assert.equal(shouldShowFirstRunFlow(), true);
  markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();
  assert.equal(shouldShowFirstRunFlow(), false);
  resetOnboardingForSettingsOnly();
  assert.equal(shouldShowFirstRunFlow(), true);
});

/* ── إضافي: الوسم idempotent ───────────────────────────────────────── */
test("الوسم idempotent — تكراره لا يغيّر شيئًا", () => {
  initOnboardingState();
  assert.equal(markStorageNoticeSeen(), true);
  assert.equal(markStorageNoticeSeen(), true);
  assert.equal(hasSeenStorageNotice(), true);
  assert.equal(hasSeenReminderPrompt(), false, "رايات مستقلة لا تتأثر ببعضها");
});
