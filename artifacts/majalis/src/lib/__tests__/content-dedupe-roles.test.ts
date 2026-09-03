/**
 * اختبارات منع تكرار الألقاب وأوصاف المحتوى.
 * التشغيل: node --import tsx src/lib/__tests__/content-dedupe-roles.test.ts
 */
import {
  formatSheikhName,
  stripSheikhHonorifics,
  isSummaryPrefixOfFull,
  normalizeProseForCompare,
} from "../sheikh-name";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== أدوار/ألقاب الشيوخ ===");
assert(formatSheikhName("الشيخ") === "", "لقب بلا اسم → فارغ");
assert(formatSheikhName("الشيخة") === "", "لقب مؤنث بلا اسم → فارغ");
assert(formatSheikhName("الشيخ: سالم الطويل") === "الشيخ: سالم الطويل", "لا مضاعفة الشيخ:");
assert(formatSheikhName("سالم الطويل") === "الشيخ: سالم الطويل", "إضافة لقب مرة واحدة");
assert(formatSheikhName("د. أحمد") === "الشيخ: أحمد" || formatSheikhName("د. أحمد").includes("أحمد"), "إزالة د.");
assert(stripSheikhHonorifics("الأستاذ: الأستاذ") === "" || !/الأستاذ:\s*الأستاذ/.test(formatSheikhName("الأستاذ")), "منع تكرار أستاذ");
assert(!/الشيخ:\s*الشيخ$/.test(formatSheikhName("الشيخ")), "لا الشيخ: الشيخ");

console.log("\n=== تطبيع الملخص/النبذة ===");
assert(
    isSummaryPrefixOfFull(
      "نبذة قصيرة عن الإمام ومساره العلمي عبر القرون مع بيان مختصر",
      "نبذة قصيرة عن الإمام ومساره العلمي عبر القرون مع بيان مختصر ثم تفاصيل أطول بكثير هنا",
    ),
    "بادئة",
  );
assert(isSummaryPrefixOfFull("نص واحد كامل.", "نص واحد كامل."), "تطابق كامل");
assert(!isSummaryPrefixOfFull("موضوع مختلف", "نبذة أخرى تمامًا عن عالم"), "غير متطابق");
assert(normalizeProseForCompare("أ  ب…") === normalizeProseForCompare("أ ب"), "تطبيع مسافات وحذف");

console.log("\n=== prerender كتب: بلا تكرار «عن الكتاب» مع نفس الوصف ===");
{
  const root = resolve("seo-prerender/library");
  if (!existsSync(root)) {
    console.log("  (تخطي — لا prerender للمكتبة بعد)");
  } else {
    let dup = 0;
    let checked = 0;
    for (const dir of readdirSync(root)) {
      const f = join(root, dir, "index.html");
      if (!existsSync(f)) continue;
      const html = readFileSync(f, "utf8");
      checked++;
      const about = html.match(/<h2>عن الكتاب<\/h2>\s*<p>([^<]*)<\/p>/);
      const lead = html.match(/<article>\s*<h1>[^<]*<\/h1>\s*<p>([^<]*)<\/p>/);
      if (about && lead && normalizeProseForCompare(about[1]) === normalizeProseForCompare(lead[1])) {
        dup++;
      }
    }
    assert(checked > 0, `فُحص ${checked} كتابًا`);
    assert(dup === 0, `لا تكرار وصف (${dup})`);
  }
}

console.log("\n=== بريد محظور ===");
{
  const site = readFileSync(resolve("site.config.json"), "utf8");
  assert(!/info@majlisilm\.com/i.test(site), "لا info@majlisilm في site.config");
  assert(!/Majlisilm\.app@gmail\.com/i.test(site), "لا بريد gmail القديم في site.config");
  assert(/info@ssunnah\.com/i.test(site), "البريد الرسمي info@ssunnah.com موجود");
}

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
if (failed) process.exit(1);
