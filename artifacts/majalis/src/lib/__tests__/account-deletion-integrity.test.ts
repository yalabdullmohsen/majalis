/**
 * إثبات مسار حذف الحساب من الكود + مسارات الفشل الحية (بلا حذف مستخدم حقيقي).
 * node --import tsx src/lib/__tests__/account-deletion-integrity.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const handler = readFileSync(resolve(root, "lib/api-handlers/account/delete.js"), "utf8");
const view = readFileSync(resolve(root, "src/pages/account/ui/AccountDeletionView.tsx"), "utf8");
const privacy = readFileSync(resolve(root, "src/views/PrivacyPage.tsx"), "utf8");
const clearLocal = readFileSync(resolve(root, "src/lib/clear-user-local-data.ts"), "utf8");
const dispatch = readFileSync(resolve(root, "lib/api-dispatch.mjs"), "utf8");

assert.match(handler, /admin\.auth\.admin\.deleteUser/, "حذف Auth user عبر Admin API");
assert.match(handler, /requireUser/, "يتطلب جلسة مستخدم");
assert.match(handler, /405/, "يرفض الطرق غير المسموحة");
assert.match(handler, /503/, "فشل عند غياب admin");
assert.match(handler, /تعذّر حذف الحساب/, "رسالة فشل واضحة");
assert.match(handler, /USER_OWNED_TABLES|wipeOwnedUserData/, "مسح بيانات المستخدم صراحة قبل Auth");

assert.match(view, /\/api\/account\/delete/, "الواجهة تستدعي endpoint الحذف");
assert.match(view, /Authorization.*Bearer/, "يرسل JWT");
assert.match(view, /confirmWord !== "حذف"/, "تأكيد كتابي");
assert.match(view, /clearUserLocalDataAndMedia/, "مسح محلي بعد النجاح");
assert.match(view, /logout\(\)/, "إنهاء الجلسة بعد الحذف");
assert.match(
  view,
  /المحتوى العلمي العام المنشور غير المرتبط بملكية حسابك، مثل الدروس والمكتبة والقرآن والأحكام العامة/,
);
assert.doesNotMatch(view, /الفتاوى المنشورة/);

const settings = readFileSync(resolve(root, "src/pages/account/ui/SettingsView.tsx"), "utf8");
assert.match(settings, /settings_delete_account|settings-delete-account/, "مدخل حذف في الإعدادات");
assert.match(settings, /alertdialog/, "حوار تأكيد");

assert.match(clearLocal, /clearUserLocalDataAndMedia/, "مسّاح محلي");
assert.match(dispatch, /accountDeleteRateLimit|account-delete/, "rate limit على الحذف");

assert.match(privacy, /التسجيلات الصوتية: لا تُخزَّن على خوادمنا مطلقًا/);
assert.match(privacy, /الموقع الجغرافي/);
assert.match(privacy, /سجل الاستخدام المرتبط بالحساب: يُحذف مع حذف الحساب/);

const liveHttp = process.env.MAJLIS_AUDIT_LIVE === "1" || process.env.CI !== "true";
const proven = [
  "deleteUser via Admin API (code)",
  "JWT required",
  "local clear + logout on success (code)",
  "rate limit wired (code)",
  "privacy claims present in PrivacyPage (text)",
];

if (liveHttp) {
  const base = process.env.MAJLIS_AUDIT_BASE_URL || "https://majlisilm.com";
  const noAuth = await fetch(`${base}/api/account/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(noAuth.status, 401, "بدون JWT → 401");

  const badAuth = await fetch(`${base}/api/account/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer invalid-token" },
  });
  assert.equal(badAuth.status, 401, "JWT باطل → 401");
  const badBody = await badAuth.json().catch(() => ({}));
  assert.equal(badBody.ok, false);

  const getMethod = await fetch(`${base}/api/account/delete`, { method: "GET" });
  assert.equal(getMethod.status, 405, "GET → 405");
  proven.push("failure paths 401/405 (live HTTP)");
} else {
  proven.push("live HTTP skipped in CI (set MAJLIS_AUDIT_LIVE=1)");
}

console.log(
  JSON.stringify(
    {
      proven,
      notProvenWithoutTestAccount: [
        "CASCADE delete of bookmarks/progress/achievements/profile rows in live DB",
        "active sessions invalidation beyond Auth user delete",
        "network proof that audio never hits Majlisilm servers during recitation",
      ],
    },
    null,
    2,
  ),
);
console.log("account-deletion-integrity: OK");
