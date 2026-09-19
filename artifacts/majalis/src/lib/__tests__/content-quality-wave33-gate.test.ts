/**
 * Wave 33 — فراغات/أخطاء عامة (شاشات·مشايخ·قرآن·أذكار·مصحف) + SEO ≥75 للمسارات العامة الرقيقة.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave33-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const shell = read("src/components/design-system/screens/ScreenShell.tsx");
assert.match(shell, /emptyTitle = EMPTY\.data/);
assert.doesNotMatch(shell, /emptyTitle = "لا محتوى حالياً"/);

const teacher = read("src/pages/lessons/TeacherDetailPage.tsx");
assert.match(teacher, /EMPTY\.search/);
assert.doesNotMatch(teacher, /لم نجد شيخًا بهذا المعرّف/);

const person = read("src/pages/quran/ui/QuranPersonDetailView.tsx");
assert.match(person, /EMPTY\.search/);
assert.doesNotMatch(person, /لم نجد هذه الشخصية في الفهرس المنشور/);

const nation = read("src/views/NationDetailPage.tsx");
assert.match(nation, /EMPTY\.search/);
assert.doesNotMatch(nation, /لم نجد هذه الأمة/);

const home = read("src/components/HomeDashboard.tsx");
assert.match(home, /STATUS\.loadError/);
assert.match(home, /EMPTY\.bookmarks/);
assert.doesNotMatch(home, /تعذّر تحميل بيانات القراءة المحلية/);

const player = read("src/components/quran/QuranPlayerView.tsx");
assert.match(player, /STATUS\.loadError/);
assert.doesNotMatch(player, /تعذّر تحميل نص السورة/);

const hifz = read("src/components/quran/HifzAudioLoopPlayer.tsx");
assert.match(hifz, /STATUS\.loadError/);
assert.match(hifz, /STATUS\.contentLoading/);
assert.doesNotMatch(hifz, /تعذّر تحميل نص السورة/);

const viewer = read("src/components/QuranViewer.tsx");
assert.match(viewer, /STATUS\.networkError/);
assert.match(viewer, /STATUS\.loadError/);
assert.match(viewer, /EMPTY\.data/);
assert.doesNotMatch(viewer, /تعذّر تحميل السورة\. تحقق من الاتصال/);

const adhkar = read("src/components/adhkar/AdhkarRemindersCard.tsx");
assert.match(adhkar, /STATUS\.networkError/);
assert.doesNotMatch(adhkar, /تعذّر جدولة تذكيرات الذكر/);
assert.doesNotMatch(adhkar, /تعذّر حفظ التذكيرات/);

const verified = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
assert.match(verified, /STATUS\.loadError/);
assert.doesNotMatch(verified, /setError\("تعذّر تحميل الصفحة"\)/);

const nextReader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(nextReader, /STATUS\.loadError/);
assert.doesNotMatch(nextReader, /setError\("تعذّر تحميل الصفحة"\)/);

const ayah = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
assert.match(ayah, /EMPTY\.data/);
assert.match(ayah, /STATUS\.loadError/);
assert.doesNotMatch(ayah, /لا توجد أحكام تجويد متاحة لهذه الآية حاليًا/);

const lessons = read("src/pages/lessons/ui/LessonsView.tsx");
assert.match(lessons, /EMPTY\.data/);
assert.doesNotMatch(lessons, /لا يوجد مؤرشف حالياً/);

const seo = JSON.parse(read("src/lib/seo-routes.json")) as {
  routes: Array<{ path: string; description?: string }>;
};
const enriched = [
  "/calendar",
  "/privacy",
  "/annual-courses",
  "/qibla",
  "/jumuah",
  "/family",
  "/settings",
  "/stats",
];
for (const path of enriched) {
  const r = seo.routes.find((x) => x.path === path);
  assert.ok(r?.description && r.description.length >= 75, `${path} SEO ≥75`);
}
assert.match(read("src/lib/seo-routes.json"), /جدول شهري وأسبوعي ويومي لمواعيد الدروس والحلقات العلمية مع متابعة الحضور في سُنّة/);
assert.match(read("src/lib/seo-routes.json"), /احسب اتجاه القبلة بدقة بحسب موقعك الجغرافي باستخدام البوصلة الرقمية في سُنّة/);

console.log("content-quality-wave33-gate.test.ts: ok");
