/**
 * بوابة: منطق فحص النسخة + «لاحقًا» المستمر + فشل الشبكة الصامت.
 * تشغيل: npx tsx src/lib/__tests__/version-check-soft-update.test.ts
 */
import assert from "node:assert/strict";
import {
  DISMISSED_VERSION_KEY,
  VERSION_CHECK_INTERVAL_MS,
  checkForUpdate,
  clearDismissedVersion,
  getDismissedVersion,
  isNewVersionAvailable,
  isSameDeployVersion,
  normalizeVersionId,
  setDismissedVersion,
} from "../version-check";

assert.ok(VERSION_CHECK_INTERVAL_MS > 0);
assert.equal(typeof isNewVersionAvailable, "function");
assert.equal(typeof checkForUpdate, "function");

// ——— helpers: localStorage + fetch mocks ———
type Store = Map<string, string>;
const memory: Store = new Map();

const localStorageMock = {
  getItem: (k: string) => (memory.has(k) ? memory.get(k)! : null),
  setItem: (k: string, v: string) => {
    memory.set(k, String(v));
  },
  removeItem: (k: string) => {
    memory.delete(k);
  },
  clear: () => memory.clear(),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

type FetchFn = typeof fetch;
let fetchImpl: FetchFn = (async () => {
  throw new Error("fetch not stubbed");
}) as FetchFn;

(globalThis as { fetch: FetchFn }).fetch = ((...args: Parameters<FetchFn>) =>
  fetchImpl(...args)) as FetchFn;

function stubVersionJson(
  body: Record<string, unknown> | null,
  opts: { ok?: boolean; networkError?: boolean } = {},
) {
  fetchImpl = (async () => {
    if (opts.networkError) throw new TypeError("Failed to fetch");
    if (opts.ok === false) {
      return new Response("err", { status: 500 });
    }
    if (body == null) {
      return new Response("null", { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as FetchFn;
}

function reset() {
  memory.clear();
  clearDismissedVersion();
}

// 1. نفس الإصدار → لا تظهر النافذة
{
  reset();
  stubVersionJson({ shortCommit: "abcdef12", commitSha: "abcdef12", commit: "abcdef12" });
  const r = await checkForUpdate("abcdef12ffffff");
  assert.equal(r.currentVersion, "abcdef12");
  assert.equal(r.remoteVersion, "abcdef12");
  assert.equal(r.updateAvailable, false);
  assert.equal(r.updateRequired, false);
  assert.equal(r.networkError, false);
}

// 2. إصدار أحدث → تظهر النافذة
{
  reset();
  stubVersionJson({ shortCommit: "99999999", commitSha: "99999999" });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, true);
  assert.equal(r.updateRecommended, true);
  assert.equal(r.updateRequired, false);
  assert.equal(r.currentVersion, "abcdef12");
  assert.equal(r.remoteVersion, "99999999");
}

// 3. الضغط على «لاحقًا» → لا تظهر ثانية لنفس النشر
{
  reset();
  setDismissedVersion("99999999");
  stubVersionJson({ shortCommit: "99999999" });
  const r = await checkForUpdate("abcdef12");
  assert.equal(getDismissedVersion(), "99999999");
  assert.equal(r.lastDismissedVersion, "99999999");
  assert.equal(r.updateAvailable, false);
  assert.equal(r.skipVersion, "99999999");
}

// 4. إصدار أحدث جديد بعد التجاهل → تظهر
{
  reset();
  setDismissedVersion("99999999");
  stubVersionJson({ shortCommit: "aaaa1111" });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, true);
  assert.equal(r.remoteVersion, "aaaa1111");
  assert.notEqual(r.remoteVersion, r.lastDismissedVersion);
}

// 5. فشل الشبكة → لا تظهر
{
  reset();
  stubVersionJson(null, { networkError: true });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, false);
  assert.equal(r.networkError, true);
  assert.equal(r.remoteVersion, null);
}

// 6. localStorage فارغ → يعمل بصورة صحيحة
{
  reset();
  assert.equal(getDismissedVersion(), null);
  stubVersionJson({ shortCommit: "bbbb2222" });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, true);
  assert.equal(r.lastDismissedVersion, null);
}

// 7. first launch (بلا dismissed) + نفس النسخة → لا نافذة
{
  reset();
  stubVersionJson({ commit: "abcdef12" });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, false);
}

// 8. update required → يعمل ويتجاوز التجاهل
{
  reset();
  setDismissedVersion("ffff0000");
  stubVersionJson({ shortCommit: "ffff0000", forceUpdate: true });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, true);
  assert.equal(r.updateRequired, true);
  assert.equal(r.updateRecommended, false);
}

// 9. update optional → يعمل مع «لاحقًا»
{
  reset();
  stubVersionJson({ shortCommit: "cccc3333", updateRequired: false });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, true);
  assert.equal(r.updateRequired, false);
  assert.equal(r.updateRecommended, true);
  setDismissedVersion(r.remoteVersion!);
  stubVersionJson({ shortCommit: "cccc3333" });
  const again = await checkForUpdate("abcdef12");
  assert.equal(again.updateAvailable, false);
}

// 10. TestFlight / App Store لا يتعارضان — المقارنة بادئة commit وليست semver نصي
{
  assert.equal(normalizeVersionId("1.10.0"), "1.10.0");
  // مقارنة النشر: بادئة مطابقة فقط — لا ترتيب معجمي لـ "1.9" vs "1.10"
  assert.equal(isSameDeployVersion("abcdef12", "abcdef12zzzz"), true);
  assert.equal(isSameDeployVersion("abcdef12", "abcdef99"), false);
  // HTTP 500 لا يفتح نافذة
  reset();
  stubVersionJson(null, { ok: false });
  const r = await checkForUpdate("abcdef12");
  assert.equal(r.updateAvailable, false);
  assert.equal(r.networkError, true);
  // حمولة فارغة المعرف
  stubVersionJson({ builtAt: "2026-01-01" });
  const empty = await checkForUpdate("abcdef12");
  assert.equal(empty.updateAvailable, false);
  assert.equal(empty.remoteVersion, null);
}

// isNewVersionAvailable يمر عبر checkForUpdate
{
  reset();
  stubVersionJson({ shortCommit: "dddd4444" });
  assert.equal(await isNewVersionAvailable("abcdef12"), true);
  setDismissedVersion("dddd4444");
  assert.equal(await isNewVersionAvailable("abcdef12"), false);
  stubVersionJson({ shortCommit: "abcdef12" });
  assert.equal(await isNewVersionAvailable("abcdef12"), false);
}

assert.equal(DISMISSED_VERSION_KEY, "majalis_update_dismissed_version");
assert.equal("AUTO_RELOAD_GRACE_MS" in (await import("../version-check")), false);

console.log("  ✓ version-check soft update (قرار النافذة + لاحقًا مستمر + شبكة صامتة)");
