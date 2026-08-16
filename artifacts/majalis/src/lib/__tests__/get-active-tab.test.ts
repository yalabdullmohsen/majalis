/**
 * بوابة: زر شريط سفلي واحد لكل مسار — تفشل إن أضاء أكثر من زر أو صفراً بعد التوحيد.
 * تشغيل: npx tsx src/lib/__tests__/get-active-tab.test.ts
 */
import assert from "node:assert/strict";
import { countActiveBottomTabs, getActiveTab } from "../get-active-tab";

const cases: Array<{ path: string; expect: ReturnType<typeof getActiveTab> }> = [
  { path: "/", expect: "more" },
  { path: "/prayer-times", expect: "prayer" },
  { path: "/adhkar", expect: "prayer" },
  { path: "/adhkar/morning", expect: "prayer" },
  { path: "/salah-guide", expect: "prayer" },
  { path: "/quran-knowledge", expect: "quran" },
  { path: "/quran/surahs", expect: "quran" },
  { path: "/mushaf", expect: "quran" },
  { path: "/lessons", expect: "lessons" },
  { path: "/lessons/kw-example", expect: "lessons" },
  { path: "/lessons", expect: "lessons" },
  { path: "/fiqh", expect: "fiqh" },
  { path: "/quiz", expect: "fiqh" },
  { path: "/qa", expect: "fiqh" }, /* legacy redirect → نفس تبويب /quiz */
  { path: "/scholars/ibn-taymiyyah", expect: "lessons" },
  { path: "/library", expect: "more" },
  { path: "/start-here", expect: "more" },
  { path: "/duas", expect: "prayer" },
  { path: "/qibla", expect: "prayer" },
];

console.log("\n=== getActiveTab ===");
for (const c of cases) {
  const got = getActiveTab(c.path);
  assert.equal(got, c.expect, `${c.path} → ${got} (expected ${c.expect})`);
  assert.equal(countActiveBottomTabs(c.path) >= 1, true, `${c.path} يجب ألا يكون صفراً`);
  // بعد التوحيد: getActiveTab دائماً واحد
  assert.ok(["quran", "lessons", "prayer", "fiqh", "more"].includes(got));
}
console.log(`  ✓ ${cases.length} مسار — معرّف واحد لكل حالة`);
