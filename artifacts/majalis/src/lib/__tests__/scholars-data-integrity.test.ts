/**
 * اختبارات وحدة — سلامة بيانات العلماء
 *
 * يحرس ثلاث دعاوى تكسرها أخطاء البيانات الصامتة:
 *   ١. لا سجلَّين للشخص التاريخي نفسه (تكرار: nawawi/al-nawawi، al-mizzi/al-mizzi-2 …).
 *   ٢. لا رابط باسم عالِم وصفحته عن عالِم آخر — أخطر خطأ في المنصة
 *      (كان id="ibn-al-qayyim-alt" واسمه «السخاوي»، وid="ibn-uthaymeen-older" واسمه «الخضير»).
 *   ٣. لا سجل يدّعي verificationStatus:"verified" بلا مصدر ولا مُراجِع.
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/scholars-data-integrity.test.ts
 */

import { readFileSync } from "node:fs";
import { SCHOLARS, type Scholar } from "../scholars-data";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    if (detail) console.error(`         ${detail}`);
    failed++;
  }
}

// ─────────────── أدوات تطبيع عربي ───────────────

const AR_STOPWORDS = new Set([
  "الامام", "امام", "الشيخ", "شيخ", "الحافظ", "حافظ", "العلامه", "علامه",
  "ابن", "بن", "ابو", "ابي", "اب", "ابا", "عبد", "الدين", "المعروف", "الله",
]);

/** إزالة التشكيل، وتوحيد أإآ→ا، ة→ه، ى→ي */
function normalizeArabic(s: string): string {
  return s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/[«»""'’()،,.؀-؅ﷺ-﷽]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** هوية الشخص: الاسم بلا ألقاب ولا «ال» التعريف — «الإمام النووي» و«النووي» ⇒ «نووي» */
function identityName(name: string): string {
  return normalizeArabic(name)
    .split(" ")
    .filter((t) => t && !AR_STOPWORDS.has(t))
    .map((t) => t.replace(/^ال/, ""))
    .filter(Boolean)
    .join(" ");
}

// ─── هيكل صوتي (consonant skeleton) لمقارنة المعرّف اللاتيني بالاسم العربي ───

const AR_CONSONANT: Record<string, string> = {
  ا: "", ي: "", و: "", ه: "h", ب: "b", ت: "t", ث: "t", ج: "j", ح: "h", خ: "k",
  د: "d", ذ: "d", ر: "r", ز: "z", س: "s", ش: "s", ص: "s", ض: "d", ط: "t",
  ظ: "z", ع: "", غ: "g", ف: "f", ق: "k", ك: "k", ل: "l", م: "m", ن: "n",
};

function arabicSkeleton(token: string): string {
  let out = "";
  for (const ch of token.replace(/^ال/, "")) out += AR_CONSONANT[ch] ?? "";
  return out.replace(/(.)\1+/g, "$1");
}

function latinSkeleton(token: string): string {
  return token
    .toLowerCase()
    .replace(/['`’]/g, "")
    .replace(/kh/g, "k").replace(/sh/g, "s").replace(/th/g, "t")
    .replace(/gh/g, "g").replace(/dh/g, "d").replace(/ch/g, "s")
    .replace(/ph/g, "f").replace(/q/g, "k").replace(/c/g, "k")
    .replace(/[aeiouwy]/g, "")
    .replace(/(.)\1+/g, "$1");
}

function editDistance(a: string, b: string): number {
  const m: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}

function skeletonsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // «تيمية» ⇒ tmh و taymiyya ⇒ tm — الاحتواء يكفي ولو قصر الجذر
  if (a.length >= 2 && b.length >= 2 && (a.includes(b) || b.includes(a))) return true;
  return Math.min(a.length, b.length) >= 3 && editDistance(a, b) <= 1;
}

/** مقاطع لاتينية لا تحمل هوية (نسب/ألقاب/لواحق تقنية) */
const LATIN_STOPWORDS = new Set([
  "al", "el", "ul", "ad", "ibn", "bin", "ben", "abu", "abi", "abd", "abdel",
  "abdul", "abdes", "allah", "din", "imam", "sheikh", "shaykh", "hafiz",
  "alt", "old", "older", "new", "copy", "ext", "senior", "junior", "scholar",
  "1", "2", "3", "4",
]);

/** هل يتقاطع المعرّف مع اسم صاحبه؟ */
function idMatchesName(s: Scholar): { ok: boolean; segments: string[] } {
  const nameSkeletons = normalizeArabic(`${s.name} ${s.fullName}`)
    .split(" ")
    .map(arabicSkeleton)
    .filter((x) => x.length >= 2);

  const segments = s.id
    .split("-")
    .filter((seg) => !LATIN_STOPWORDS.has(seg.toLowerCase()))
    .filter((seg) => latinSkeleton(seg).length >= 2);

  // معرّف مبني كلّه من نسب/ألقاب (نادر) — لا نستطيع الحكم عليه، نعدّه سليماً
  if (segments.length === 0) return { ok: true, segments };

  const ok = segments.some((seg) => nameSkeletons.some((ns) => skeletonsMatch(latinSkeleton(seg), ns)));
  return { ok, segments };
}

// ═══════════════════════════════════════════════════════════════

console.log(`\nعدد السجلات: ${SCHOLARS.length}`);

console.log("\n=== ١) لا معرّفات (id) مكررة ===");

const ids = SCHOLARS.map((s) => s.id);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
assert(dupIds.length === 0, `كل المعرّفات فريدة (${ids.length})`, `مكرر: ${[...new Set(dupIds)].join(", ")}`);

console.log("\n=== ٢) لا اسم مُطبَّع مكرر (شخصان بنفس الاسم) ===");

const byIdentity = new Map<string, string[]>();
for (const s of SCHOLARS) {
  const key = identityName(s.name);
  byIdentity.set(key, [...(byIdentity.get(key) ?? []), s.id]);
}
const dupNames = [...byIdentity.entries()].filter(([, list]) => list.length > 1);
assert(
  dupNames.length === 0,
  "لا شخص مسجَّل بمعرّفين مختلفين (بعد تطبيع الاسم)",
  dupNames.map(([k, v]) => `«${k}» → [${v.join(", ")}]`).join(" | ")
);

console.log("\n=== ٣) لا شخص واحد مسجَّل مرتين (نفس fullName + نفس died) ===");

const byFullName = new Map<string, string[]>();
for (const s of SCHOLARS) {
  const key = `${normalizeArabic(s.fullName)}::${s.died}`;
  byFullName.set(key, [...(byFullName.get(key) ?? []), s.id]);
}
const dupIdentities = [...byFullName.entries()].filter(([, list]) => list.length > 1);
assert(
  dupIdentities.length === 0,
  "لا اسم كامل + تاريخ وفاة مكرران",
  dupIdentities.map(([k, v]) => `${k} → [${v.join(", ")}]`).join(" | ")
);

console.log("\n=== ٤) لا لواحق تقنية في المعرّف (-alt / -old / -2 …) ===");

const SUSPICIOUS_SUFFIX = /-(alt|old|older|copy|new|ext|senior|junior|scholar)$|-\d+$/;
const suffixed = SCHOLARS.filter((s) => SUSPICIOUS_SUFFIX.test(s.id));
assert(
  suffixed.length === 0,
  "لا معرّف يحمل لاحقة فضّ تصادم",
  suffixed.map((s) => `${s.id} (${s.name})`).join(", ")
);

console.log("\n=== ٥) لا معرّف بمحارف غير آمنة في المسار ===");

const unsafe = SCHOLARS.filter((s) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id));
assert(unsafe.length === 0, "كل المعرّفات kebab-case آمنة في URL", unsafe.map((s) => s.id).join(", "));

console.log("\n=== ٦) لا رابط باسم عالِم آخر (تقاطع المعرّف مع الاسم) ===");

// حارسٌ للكاشف نفسه: لو تراخى المطابق حتى صار يقبل كل شيء، سقط الفحص بلا ضجيج.
// هذه الأربعة أخطاء حقيقية كانت في الملف — يجب أن يظل الكاشف يمسكها.
const REGRESSION_FIXTURES: Array<Pick<Scholar, "id" | "name" | "fullName">> = [
  { id: "ibn-al-qayyim-alt", name: "السخاوي", fullName: "محمد بن عبد الرحمن بن محمد السخاوي" },
  { id: "ibn-uthaymeen-older", name: "الشيخ عبد الكريم الخضير", fullName: "عبد الكريم بن عبد الله الخضير" },
  { id: "ibn-uthaymin-ext", name: "الشيخ ابن جبرين", fullName: "عبد الله بن عبد الرحمن بن جبرين" },
  { id: "al-ghazali-junior", name: "ابن عطاء الله السكندري", fullName: "أحمد بن محمد ابن عطاء الله الشاذلي" },
];
const missedFixtures = REGRESSION_FIXTURES.filter((f) => idMatchesName(f as Scholar).ok);
assert(
  missedFixtures.length === 0,
  "الكاشف نفسه ما زال يمسك أخطاء الـslug المعروفة",
  missedFixtures.map((f) => `${f.id} / ${f.name}`).join(", ")
);

const mismatched = SCHOLARS.map((s) => ({ s, m: idMatchesName(s) })).filter(({ m }) => !m.ok);
assert(
  mismatched.length === 0,
  "كل معرّف تتقاطع كلماته المفتاحية مع اسم صاحبه",
  mismatched.map(({ s, m }) => `${s.id} ≠ «${s.name}» [مقاطع: ${m.segments.join(",")}]`).join(" | ")
);

console.log("\n=== ٧) حقول الحوكمة ===");

const badStatus = SCHOLARS.filter(
  (s) => !["draft", "pending_review", "reviewed", "verified"].includes(s.verificationStatus)
);
assert(badStatus.length === 0, "كل سجل له verificationStatus صالح", badStatus.map((s) => s.id).join(", "));

const falselyVerified = SCHOLARS.filter(
  (s) => s.verificationStatus === "verified" && (!s.sources?.length || !s.reviewedBy)
);
assert(
  falselyVerified.length === 0,
  'لا سجل "verified" بلا sources و reviewedBy',
  falselyVerified.map((s) => s.id).join(", ")
);

console.log("\n=== ٨) كل حقل died غير فارغ ===");

const missingDied = SCHOLARS.filter((s) => !s.died || s.died.trim() === "");
assert(missingDied.length === 0, `كل السجلات (${SCHOLARS.length}) لديها تاريخ وفاة`);

console.log("\n=== ٩) تحويلات 301 متسقة مع البيانات ===");

const redirects: Array<{ from: string; to: string; reason: string }> = JSON.parse(
  readFileSync(new URL("../../../scripts/redirects.scholars.json", import.meta.url), "utf8")
);
const idSet = new Set(ids);
const danglingTargets = redirects.filter((r) => !idSet.has(r.to.replace("/scholars/", "")));
assert(
  danglingTargets.length === 0,
  `كل هدف تحويل (${redirects.length}) يشير إلى سجل موجود`,
  danglingTargets.map((r) => r.to).join(", ")
);

const liveSources = redirects.filter((r) => idSet.has(r.from.replace("/scholars/", "")));
assert(
  liveSources.length === 0,
  "لا تحويل من معرّف ما زال حيًّا (سيبتلع صفحة صالحة)",
  liveSources.map((r) => r.from).join(", ")
);

console.log("\n=== ١٠) scholars-list.json (يغذّي /api/sitemap و/api/feed الحيّين) لا ينجرف عن المصدر ===");

// اكتُشف 2026-07-18: src/data/scholars-list.json كان مجمَّداً عند 78 عالماً
// بينما SCHOLARS الحي وصل 96 — هذا الملف يُستهلَك في
// lib/cms/sitemap-builder.mjs الذي يبني /api/sitemap و/api/feed المسجَّلين
// فعلياً في lib/api-dispatch.mjs (وvercel.json يُعيد توجيه /sitemap.xml
// و/feed.xml إليهما مباشرة) — انجراف هذا الملف يعني صفحات علماء غائبة عن
// خريطة الموقع الحقيقية المُرسَلة لمحركات البحث. إن فشل هذا الفحص:
// npx tsx scripts/regen-scholars-list-json.mjs
const scholarsListJson: Array<{ id: string; name: string; died: string }> = JSON.parse(
  readFileSync(new URL("../../data/scholars-list.json", import.meta.url), "utf8")
);
const listIds = new Set(scholarsListJson.map((s) => s.id));
const missingFromList = ids.filter((id) => !listIds.has(id));
const orphanedInList = [...listIds].filter((id) => !idSet.has(id));
assert(
  missingFromList.length === 0 && orphanedInList.length === 0,
  `scholars-list.json يطابق SCHOLARS الحي (${scholarsListJson.length}/${SCHOLARS.length})`,
  `غائب: ${missingFromList.join(", ") || "—"} | يتيم: ${orphanedInList.join(", ") || "—"} — شغّل: npx tsx scripts/regen-scholars-list-json.mjs`
);

console.log(`\n${"─".repeat(48)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
