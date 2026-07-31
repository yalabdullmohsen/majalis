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

console.log("\n=== ٩ب) تحويلات /scholars/ في vercel.json — الملف المُنفَّذ فعلاً على الإنتاج ===");

// اكتُشف 2026-07-27 بضرب الموقع الحيّ (نظير ما وقع في /library/ بـج-٢٧٧):
// كانت في vercel.json كتلةُ تحويلاتٍ قديمة تسبق الكتلة الصحيحة، وفيرسل
// يُنفِّذ أوّل قاعدة مطابقة — فكان /scholars/amir-al-san'ani و
// /scholars/ibn-uthaymeen-older يحوّلان إلى amir-al-sanani و
// abdulkarim-alkhudair وهما معرّفان غير موجودين ⇒ 404 على الإنتاج،
// بينما القاعدتان الصحيحتان (al-amir-al-sanani و abd-al-karim-al-khudair)
// أبعدُ في الملف فلا تُنفَّذان أبداً. فحصُ redirects.scholars.json وحده
// لا يكشف هذا لأنه لا يقرأ vercel.json.
const vercelJson: { redirects?: Array<{ source: string; destination: string }> } = JSON.parse(
  readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8")
);
/** فيرسل يطابق المسار بعد فكّ الترميز، فـ%27 و(') قاعدة واحدة */
const decodePath = (p: string) => {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
};
const scholarRules = (vercelJson.redirects ?? [])
  .filter((r) => String(r.source).startsWith("/scholars/"))
  .map((r) => ({ from: decodePath(String(r.source)), to: decodePath(String(r.destination)) }));

const vercelDeadTargets = scholarRules.filter((r) => !idSet.has(r.to.replace("/scholars/", "")));
assert(
  vercelDeadTargets.length === 0,
  `كل هدف تحويل في vercel.json (${scholarRules.length}) سجلٌّ موجود`,
  vercelDeadTargets.map((r) => `${r.from} ⇐ ${r.to}`).join(", ")
);

const vercelLiveSources = scholarRules.filter((r) => idSet.has(r.from.replace("/scholars/", "")));
assert(
  vercelLiveSources.length === 0,
  "لا قاعدة في vercel.json تحوّل معرّفًا ما زال حيًّا (ستبتلع صفحة صالحة)",
  vercelLiveSources.map((r) => r.from).join(", ")
);

/** أوّل قاعدة مطابقة هي المُنفَّذة — وما بعدها لا أثر له */
const firstMatch = new Map<string, string>();
const shadowed: string[] = [];
for (const rule of scholarRules) {
  const previous = firstMatch.get(rule.from);
  if (previous === undefined) firstMatch.set(rule.from, rule.to);
  else if (previous !== rule.to) shadowed.push(`${rule.from}: يُنفَّذ ${previous} ويُهمَل ${rule.to}`);
}
assert(shadowed.length === 0, "لا قاعدتين متعارضتين لنفس المصدر في vercel.json", shadowed.join(" | "));

const loops = [...firstMatch].filter(([from, to]) => firstMatch.get(to) === from);
assert(
  loops.length === 0,
  "لا حلقة تحويل في vercel.json",
  loops.map(([from, to]) => `${from} ⇄ ${to}`).join(", ")
);

/** التطابق مع المصدر المعتمد: ما يُنفَّذ فعلاً = ما يقوله redirects.scholars.json */
const canonical = new Map(redirects.map((r) => [decodePath(r.from), r.to]));
const drift: string[] = [];
for (const [from, to] of canonical) {
  const live = firstMatch.get(from);
  if (live === undefined) drift.push(`${from}: في redirects.scholars.json وغائب عن vercel.json`);
  else if (live !== to) drift.push(`${from}: المعتمد ${to} والمُنفَّذ ${live}`);
}
for (const [from] of firstMatch) {
  if (!canonical.has(from)) drift.push(`${from}: في vercel.json وغائب عن redirects.scholars.json`);
}
assert(
  drift.length === 0,
  `vercel.json يطابق redirects.scholars.json (${canonical.size} قاعدة)`,
  drift.join(" | ")
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

// اكتُشف 2026-07-31 (ج-٣٩١): مقابلة المعرِّفات وحدها تمرّ خضراء والنص منحرف —
// كان `fawzan.died` في المرآة «حيّ (معاصر)» والمصدر الحي «حي (معاصر)». وهذه
// المرآة تغذّي /api/sitemap و/api/feed، فالمعروض لمحركات البحث نصٌّ لا يراه
// زائر الصفحة. فالحدّ هنا 0 على الحقلين المشتركين نصًّا لا على المعرِّفات فقط.
const scholarById = new Map(SCHOLARS.map((s) => [s.id, s]));
const listTextDrift = scholarsListJson.flatMap((j) => {
  const live = scholarById.get(j.id);
  if (!live) return [];
  const out: string[] = [];
  if (live.name !== j.name) out.push(`${j.id}.name: مرآة «${j.name}» ≠ حي «${live.name}»`);
  if (live.died !== j.died) out.push(`${j.id}.died: مرآة «${j.died}» ≠ حي «${live.died}»`);
  return out;
});
assert(
  listTextDrift.length === 0,
  `scholars-list.json يطابق المصدر الحي نصًّا لا معرِّفات (${scholarsListJson.length * 2} حقلاً)`,
  `${listTextDrift.slice(0, 8).join(" | ")} — شغّل: npx tsx scripts/regen-scholars-list-json.mjs`
);

// حارسٌ للحارس: لو انكسر التوليد فأخرج مصفوفة فارغة، مرّت المقابلة أعلاه
// فارغةً بلا خرق. فالعدد نفسه شرطٌ مستقل.
assert(
  scholarsListJson.length === SCHOLARS.length && scholarsListJson.length > 0,
  `عدد صفوف المرآة يساوي عدد المصدر الحي (${scholarsListJson.length}/${SCHOLARS.length})`,
  "مرآة فارغة أو ناقصة تُفرِّغ فحص التطابق النصي أعلاه من معناه"
);

console.log("\n=== ١١) ربط مؤلّفي المكتبة بصفحات العلماء (ما يصل الزائر لا ما في البيانات) ===");

// اكتُشف 2026-07-27: صفحة الكتاب تربط اسم المؤلف بصفحة العالم عبر
// resolveAuthorScholarLink، وكان 112 من 173 كتاباً بلا رابط — لا لغياب
// صفحة العالم بل لاختلاف صيغة الاسم بين الملفَّين («الإمام النووي» في
// scholars-data.ts مقابل «الإمام يحيى بن شرف النووي» في فهرس المكتبة)،
// مع عتبة تشابهٍ (>=8 حرفاً) لا تبلغها نسبةٌ قصيرة كـ«النووي». والفحص
// هنا يحرس الطرفين معاً: أن الروابط الصحيحة لا تسقط، وأن خفض الشرط لا
// يُنتج نسبةً خاطئة — والنسبة الخاطئة أسوأ من غياب الرابط.
const { resolveAuthorScholarLink } = await import("../author-scholar-links");
const { LIBRARY_CATALOG } = await import("../library-catalog");

const MUST_LINK: Array<[string, string]> = [
  ["الإمام يحيى بن شرف النووي", "nawawi"],
  ["الإمام محمد بن إدريس الشافعي", "shafi"],
  ["الإمام أبو محمد الحسين بن مسعود البغوي", "baghawi"],
  ["الإمام ابن رشد القرطبي", "ibn-rushd"], // لا القرطبي المفسِّر
  ["الإمام ابن أبي حاتم الرازي", "ibn-abi-hatim"], // «ابن أبي…» أصلُ الاسم لا كنية
  ["الإمام شهاب الدين القرافي المالكي", "al-qarafi"], // نسبةُ المذهب من حقل madhhab
];
const wrongLinks = MUST_LINK.filter(([author, id]) => resolveAuthorScholarLink(author).scholarId !== id).map(
  ([author, id]) => `«${author}» ⇐ المتوقَّع ${id} والواقع ${resolveAuthorScholarLink(author).scholarId ?? "لا رابط"}`
);
assert(wrongLinks.length === 0, `${MUST_LINK.length} صيغةَ اسمٍ تُربط بصاحبها`, wrongLinks.join(" | "));

const MUST_NOT_LINK: Array<[string, string]> = [
  ["أبو القاسم القشيري", "لا يُنسب لمسلم بن الحجاج القشيري"],
  ["محمد بن أبي بكر الرازي", "صاحب مختار الصحاح لا الفخر الرازي"],
  ["الإمامان جلال الدين المحلي وجلال الدين السيوطي", "مؤلِّفان لا واحد"],
  ["الإمام أبو حامد الغزالي", "ملتبس بين الغزاليَّين ⇒ يبقى بلا رابط"],
];
const falseLinks = MUST_NOT_LINK.filter(([author]) => resolveAuthorScholarLink(author).href).map(
  ([author, why]) => `«${author}» رُبط بـ${resolveAuthorScholarLink(author).scholarId} — ${why}`
);
assert(falseLinks.length === 0, `${MUST_NOT_LINK.length} صيغةً ملتبسةً تبقى بلا رابط`, falseLinks.join(" | "));

// كل رابطٍ يصدر فعلاً يجب أن يشترك مع اسم العالم المعروض في جزءٍ مميّز
const authorNorm = (v: string) =>
  v
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^؀-ۿa-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && t !== "ابن" && t !== "الامام");
const byIdForLinks = new Map(SCHOLARS.map((s) => [s.id, s]));
const unshared: string[] = [];
let linkedBooks = 0;
for (const book of LIBRARY_CATALOG) {
  const link = resolveAuthorScholarLink(book.author);
  if (!link.scholarId) continue;
  linkedBooks += 1;
  const scholar = byIdForLinks.get(link.scholarId);
  const scholarTokens = new Set(authorNorm(scholar?.name || ""));
  if (!authorNorm(book.author).some((t) => scholarTokens.has(t))) {
    unshared.push(`${book.id}: «${book.author}» ⇐ ${scholar?.name}`);
  }
}
assert(unshared.length === 0, "لا رابط مؤلِّفٍ بلا جزءٍ مشترك مع اسم العالم المعروض", unshared.join(" | "));
assert(
  linkedBooks >= 121,
  `تغطية الربط لا ترتدّ (${linkedBooks}/${LIBRARY_CATALOG.length} كتاباً مربوطاً، الحدّ 121)`,
  "انخفضت التغطية — راجع تغييرك في author-scholar-links.ts"
);

console.log("\n=== ١٢) شارات «أبرز المؤلفات» تحمل عناوين لا أوصافَ حجم ===");

// اكتُشف 2026-07-27: key_works للسنوسي كانت ["أم البراهين", "العقيدة الوسطى",
// "الكبرى"] — والثالثة ليست عنواناً بل وصفُ حجمٍ اختُصر اتّكاءً على أختها
// المجاورة. والواجهة تطبع كل عنصر شارةً مستقلّة، فيقرأ الزائر «الكبرى» وحدها
// بلا مضاف. والقاعدة هنا بالمعنى لا باللفظ: تسقط الشارةُ إذا كانت وصفَ حجمٍ
// مفرداً *وفي السجل نفسه* أختٌ تنتهي بوصف حجمٍ من العائلة نفسها (أي أنّ
// الاختصار وقع اتّكاءً عليها) — فلا تُمسّ عناوينُ صحيحةٌ كـ«الوسيط» و«الوجيز»
// للواحدي، إذ لا أختَ لها من هذا النمط.
const SIZE_WORDS = new Set(["الكبرى", "الصغرى", "الوسطى", "الكبير", "الصغير", "الوسيط", "الأوسط"]);
const ellipticalWorks: string[] = [];
for (const s of SCHOLARS) {
  const works = (s.key_works ?? []).map((w) => w.trim()).filter(Boolean);
  const hasSizeSibling = works.some((w) => {
    const parts = w.split(/\s+/);
    return parts.length > 1 && SIZE_WORDS.has(parts[parts.length - 1]);
  });
  if (!hasSizeSibling) continue;
  for (const w of works) {
    if (w.split(/\s+/).length === 1 && SIZE_WORDS.has(w)) {
      ellipticalWorks.push(`${s.id}: «${w}»`);
    }
  }
}
assert(
  ellipticalWorks.length === 0,
  "لا شارةَ مؤلَّفٍ مختصرةً إلى وصف حجمٍ اتّكاءً على أختها",
  ellipticalWorks.join(" | ")
);

const emptyWorks = SCHOLARS.filter((s) => (s.key_works ?? []).some((w) => !w || !w.trim()));
assert(emptyWorks.length === 0, "لا شارةَ مؤلَّفٍ فارغة", emptyWorks.map((s) => s.id).join(", "));

const dupWorks = SCHOLARS.filter((s) => {
  const works = (s.key_works ?? []).map((w) => w.trim());
  return new Set(works).size !== works.length;
});
assert(dupWorks.length === 0, "لا شارةَ مؤلَّفٍ مكرَّرة داخل السجل نفسه", dupWorks.map((s) => s.id).join(", "));

console.log("\n=== ١٣) روابط «أبرز المؤلفات» تُحيل إلى كتاب صاحبها لا كتابِ غيره ===");

// اكتُشف 2026-07-31: كان resolveScholarWorkLink يقبل «كلمةً جوهريةً مشتركة»
// (أربعة أحرف فأكثر) فأحال ٢٠٤ روابط من ٣٠٥ إلى كتابٍ لمؤلِّفٍ آخر — «الشرح
// الممتع» لابن عثيمين إلى «إرشاد الساري» للقسطلاني، و«خلق المسلم» للغزالي
// إلى «صحيح مسلم». والعلاج: إلغاء ذلك الفرع، واشتراط موافقة النسبة عند
// وجود قرينتها. وهذا الفحص يحرس الطرفين: ٠ نسبةٍ خاطئة، وتغطيةٌ لا ترتدّ.
const { resolveScholarWorkLink } = await import("../scholar-library-links");
const catalogById = new Map(LIBRARY_CATALOG.map((b) => [b.id, b]));
const misattributed: string[] = [];
let linkedWorks = 0;
for (const s of SCHOLARS) {
  for (const work of s.key_works ?? []) {
    const link = resolveScholarWorkLink(work, s.name);
    if (!link.bookId) continue;
    linkedWorks += 1;
    const book = catalogById.get(link.bookId);
    if (!book) {
      misattributed.push(`${s.id}: «${work}» ⇐ معرِّف كتابٍ غير موجود ${link.bookId}`);
      continue;
    }
    // «ابن القيم» في الترجمة و«ابن قيم الجوزية» في الفهرس اسمٌ واحد
    const bare = (v: string) => authorNorm(v).map((t) => (t.startsWith("ال") && t.length > 4 ? t.slice(2) : t));
    const scholarTokens = new Set(bare(s.name));
    if (!bare(book.author).some((t) => scholarTokens.has(t))) {
      misattributed.push(`${s.id} «${work}» ⇒ ${book.id} «${book.title}» لـ${book.author}`);
    }
  }
}
assert(
  misattributed.length === 0,
  "لا رابطَ مؤلَّفٍ يُحيل إلى كتابٍ لمؤلِّفٍ لا يشترك مع العالم في جزءٍ مميِّز",
  misattributed.slice(0, 12).join(" | ")
);
assert(
  linkedWorks >= 90,
  `تغطية ربط المؤلفات لا ترتدّ (${linkedWorks} عملاً مربوطاً، الحدّ 90)`,
  "انخفضت التغطية — راجع تغييرك في scholar-library-links.ts"
);

// عناوينُ متجانسة لمؤلِّفَين مختلفَين في الفهرس نفسه: لا يجوز أن يقع الرابط
// على غير صاحبه لمجرَّد اتّفاق العنوان.
const HOMONYM_WORKS: Array<[string, string, string]> = [
  ["الإمام النسائي", "السنن الكبرى", "سنن البيهقي لا النسائي"],
  ["الإمام أحمد", "الزهد", "زهد ابن المبارك لا أحمد"],
  ["الإمام محمد الشيباني", "المبسوط", "مبسوط السرخسي لا الشيباني"],
  ["ابن حزم الأندلسي", "الإحكام في أصول الأحكام", "إحكام الآمدي لا ابن حزم"],
];
const homonymHits = HOMONYM_WORKS.filter(([name, work]) => resolveScholarWorkLink(work, name).bookId).map(
  ([name, work, why]) => `«${work}» لـ${name} رُبط بـ${resolveScholarWorkLink(work, name).bookId} — ${why}`
);
assert(homonymHits.length === 0, `${HOMONYM_WORKS.length} عنواناً متجانساً يبقى بلا رابط`, homonymHits.join(" | "));

console.log("\n=== ١٤) حقل quote قولُ صاحبه لا قولٌ فيه ولا قولُ صحابيٍّ ===");

// اكتُشف 2026-07-31 (ج-٣٩١): الصفحة تعرض المقولة منسوبةً صراحةً إلى صاحبها
// (`<footer>— {scholar.name}</footer>` في ScholarProfilePage)، وكان فيها ثلاثُ
// مقولاتٍ لا تصحّ نسبتها إليه:
//   • ابن ماجه (ت٢٧٣هـ): «كتبتُ عن رسول الله ﷺ ما لم يكتبه أحد قبلي» — دعوى
//     صحبةٍ مستحيلةٌ زمنياً، وأصلُها حديث عبد الله بن عمرو بن العاص
//     (سنن أبي داود ٣٦٤٦، ومسند أحمد) بلفظ «كنت أكتب كل شيء أسمعه…».
//   • مسلم وابن خزيمة: ثناءٌ عليهما بضمير الغائب يُسمِّيهما — فهو قولُ غيرهما
//     فيهما لا قولُهما.
// والحدّ هنا 0: مقولةٌ تذكر اسم صاحبها بضمير الغائب أو تدّعي سماعاً من النبي ﷺ
// لمن وُلد بعد عصر الصحابة، تُحذَف أو تُنقَل إلى موضعها الصحيح — ولا تُصاغ صياغةً
// جديدة.
const SELF_NAME_STOPWORDS = new Set([
  ...AR_STOPWORDS,
  "محمد", "احمد", "علي", "عمر", "حسن", "حسين", "ابراهيم", "يوسف", "عثمان",
  "يحيي", "صالح", "اسماعيل", "سليمان", "عبدالله",
]);
const hijriYear = (died: string): number | null => {
  const m = died.match(/[٠-٩0-9]+/);
  if (!m) return null;
  const digits = [...m[0]].map((c) => (/[٠-٩]/.test(c) ? String("٠١٢٣٤٥٦٧٨٩".indexOf(c)) : c)).join("");
  return Number.parseInt(digits, 10);
};
const selfReferential = SCHOLARS.filter((s) => s.quote).flatMap((s) => {
  const nq = normalizeArabic(s.quote as string);
  const own = [
    ...new Set([...normalizeArabic(s.name).split(/\s+/), ...normalizeArabic(s.fullName).split(/\s+/)]),
  ].filter((w) => w.length > 3 && !SELF_NAME_STOPWORDS.has(w));
  const hits = own.filter((w) => nq.includes(w));
  return hits.length ? [`${s.id}: «${s.quote}» يذكر «${hits.join("، ")}» بضمير الغائب`] : [];
});
assert(
  selfReferential.length === 0,
  `لا مقولةَ عالِمٍ تُثني عليه باسمه (${SCHOLARS.filter((s) => s.quote).length} مقولة)`,
  selfReferential.join(" | ")
);

const impossibleCompanionship = SCHOLARS.filter((s) => s.quote).flatMap((s) => {
  const year = hijriYear(s.died);
  if (year === null || year <= 150) return []; // عصر الصحابة وكبار التابعين
  const q = s.quote as string;
  return /(كتبتُ|كتبت|سمعتُ|سمعت|رأيتُ|رأيت|سألتُ|سألت)\s+(عن|من)?\s*(رسول الله|النبي)/.test(q)
    ? [`${s.id} (ت${s.died}): «${q}» — دعوى سماعٍ مباشرٍ ممن لم يُدرك النبي ﷺ`]
    : [];
});
assert(
  impossibleCompanionship.length === 0,
  "لا مقولةَ تدّعي صحبةً لمن وُلد بعد عصرها",
  impossibleCompanionship.join(" | ")
);

console.log("\n=== ١٥) عنوانُ المؤلَّف لصاحبه: لا كتابَ يُنسب إلى غير مؤلِّفه ===");

// اكتُشف 2026-07-31 (ج-٣٩٢): سجلُّ ابن جبرين (ت١٤٣٠هـ، حنبلي) كان يحمل في
// key_works وفي bio معاً كتابَين ليسا له البتّة:
//   • «فتح القريب المجيب شرح كتاب التقريب» — لمحمد بن قاسم الغزّي الشافعي
//     (ت٩١٨هـ)، شرحُ متن أبي شجاع.
//   • «التوضيح والبيان لشجرة الإيمان» — لعبد الرحمن بن ناصر السعدي (ت١٣٧٦هـ)،
//     وهو نفسُه صاحبُ سجلٍّ في هذا الملف (al-saadi).
// ولم يمسكهما الفحص ١٣ لأنّه لا يفحص إلا ما ردَّه resolveScholarWorkLink برابطٍ،
// والرابطُ نفسُه يشترط موافقة النسبة ⇒ فالمخالِفُ يسقط قبل أن يُفحَص. والعلاجُ
// جبهتان: (أ) مقابلةُ العنوان بفهرس المكتبة بالتطبيع وحدَه — بلا اشتراط قرينةِ
// نسبةٍ — فمن طابقَ كتاباً لمؤلِّفٍ لا يشاركه في جزءٍ مميِّز فهو خرقُ نسبةٍ؛
// (ب) جدولُ عناوينَ مضبوطةِ النسبة من خارج الفهرس، ومنها الكتابان أعلاه.
// وحدُّه المعلوم: المقابلةُ بالعنوان التامِّ بعد التطبيع لا بالاحتواء، كيلا يقع
// إنذارٌ كاذبٌ على العناوين المتقاربة — فمن أراد التوسعة فليُضِف صيغةَ العنوان
// كما تُكتب في key_works إلى الجدول (كما فُعل بصيغتَي «فتح القريب المجيب»).
// ألفاظٌ لا تُميِّز شخصاً بعينه، فمشاركتُها لا تُثبت أنّ الكتاب لصاحب السجل:
// الألقابُ («الشيخ»، «الإمام»)، وأشطُر الأسماء المركّبة الشائعة («عبد» و«الرحمن»
// و«الله»)، إذ اسمُ الأبِ في سجلٍّ قد يوافق اسمَ مؤلِّفٍ آخر (ابنُ جبرين أبوه
// «عبد الرحمن» والسعديُّ اسمُه «عبد الرحمن») فيمرّ الخرقُ بقرينةٍ كاذبة.
const WEAK_NAME_TOKENS = new Set(["شيخ", "امام", "حافظ", "علامه", "عبد", "رحمن", "الله", "ابو", "ابي", "دين"]);
const bareTok = (v: string) =>
  authorNorm(v)
    .map((t) => (t.startsWith("ال") && t.length > 4 ? t.slice(2) : t))
    .filter((t) => !WEAK_NAME_TOKENS.has(t));
const workKey = (v: string) => normalizeArabic(v.replace(/\(.*?\)/g, "")).trim();

// عناوينُ متجانسةٌ حقيقيّةٌ: كتابانِ مختلفانِ لمؤلِّفَينِ باسمٍ واحد (وثِّقت ج-٣٩١)
const HOMONYM_TITLES = new Set(
  [
    "الزهد", // لأحمد ولأبي داود ولابن المبارك
    "السنن الكبرى", // للنسائي وللبيهقي
    "المبسوط", // للشيباني وللسرخسي
    "شرح السنة", // للمزني وللبغوي
    "الإحكام في أصول الأحكام", // لابن حزم وللآمدي
    "دلائل النبوة", // لأبي نعيم وللبيهقي
  ].map(workKey)
);

const catalogByTitle = new Map<string, string[]>();
for (const b of LIBRARY_CATALOG) {
  const k = workKey(b.title);
  catalogByTitle.set(k, [...(catalogByTitle.get(k) ?? []), b.author]);
}

// (ب) عناوينُ خارج الفهرس ثبتت نسبتُها لغير من قد تُنسب إليه
const WORK_TRUE_AUTHORS: Array<[string, string]> = [
  ["فتح القريب المجيب شرح كتاب التقريب", "محمد بن قاسم الغزي"],
  ["فتح القريب المجيب في شرح ألفاظ التقريب", "محمد بن قاسم الغزي"],
  ["التوضيح والبيان لشجرة الإيمان", "عبد الرحمن بن ناصر السعدي"],
];
const trueAuthorByWork = new Map(WORK_TRUE_AUTHORS.map(([w, a]) => [workKey(w), a]));

const wrongAuthorWorks: string[] = [];
for (const s of SCHOLARS) {
  // الاسمُ المعروض + نسبةُ صاحبِ السجل (آخرُ جزءٍ من الاسم الكامل) — لا كلُّ
  // أجزاء الاسم الكامل، كي لا يكون اسمُ الأبِ أو الجدِّ قرينةَ نسبةٍ للكتاب.
  const fullTokens = bareTok(s.fullName);
  const scholarTokens = new Set([...bareTok(s.name), ...fullTokens.slice(-1)]);
  for (const work of s.key_works ?? []) {
    const k = workKey(work);
    if (HOMONYM_TITLES.has(k)) continue;
    const claimants = [...(catalogByTitle.get(k) ?? [])];
    const known = trueAuthorByWork.get(k);
    if (known) claimants.push(known);
    if (!claimants.length) continue;
    if (!claimants.some((a) => bareTok(a).some((t) => scholarTokens.has(t)))) {
      wrongAuthorWorks.push(`${s.id}: «${work}» ⇐ لـ${claimants.join(" / ")}`);
    }
  }
}
assert(
  wrongAuthorWorks.length === 0,
  `لا عنوانَ في key_works ينتسب إلى غير مؤلِّفه (${WORK_TRUE_AUTHORS.length} عنواناً مضبوطاً + ${LIBRARY_CATALOG.length} من الفهرس)`,
  wrongAuthorWorks.slice(0, 12).join(" | ")
);

// ١٦) عنوانٌ لا وجودَ له: صنفٌ لا يمسكُه الفحصُ ١٥ بحكمِ بنائه (ج-٣٩٣).
// الفحصُ ١٥ يقابلُ العنوانَ بمؤلِّفٍ معلوم، فإن كان العنوانُ لا يقابلُ كتاباً
// موجوداً أصلاً — تصحيفاً عن عنوانٍ قريبٍ أو خلطاً بعنوانِ كتابٍ آخرَ — فلا
// مُدَّعِيَ له في الفهرس ولا في الجدول، فيسقطُ من المرمى ويُعرَضُ للزائر.
// وهذه العناوينُ حُذفت في ج-٣٩٣ بعد تقصّي وجودِها فلم يثبت، فتُمنع عودتُها
// في `key_works` وفي `bio` معاً (فالخرقُ في ج-٣٩٢ كان مطبوعاً في الحقلَين).
console.log("\n=== ١٦) عنوانُ مؤلَّفٍ لا يثبتُ وجودُه لا يعود ===");
const RETIRED_WORK_TITLES: Array<[string, string]> = [
  ["غرائب الأوابد", "تصحيفٌ عن «غرائب الاغتراب ونزهة الألباب» للآلوسي"],
  ["المنهج السديد في شرح كتاب التوحيد", "كتابُ السعديِّ «القول السديد شرح كتاب التوحيد»، و«المنهج السديد» شرحٌ لجوهرة التوحيد لغيره"],
  ["الجواب المفيد في الرد على المعترضين", "لا يثبتُ للمنذريِّ عنوانٌ بهذا اللفظ"],
];
const retiredHits: string[] = [];
for (const s of SCHOLARS) {
  const haystack = [...(s.key_works ?? []), s.bio ?? ""].map(workKey);
  for (const [title, why] of RETIRED_WORK_TITLES) {
    const k = workKey(title);
    if (haystack.some((h) => h.includes(k))) retiredHits.push(`${s.id}: «${title}» — ${why}`);
  }
}
assert(
  retiredHits.length === 0,
  `لا عنوانَ مسحوبَ الثبوت يعود (${RETIRED_WORK_TITLES.length} عنواناً مرصوداً)`,
  retiredHits.join(" | ")
);

console.log(`\n${"─".repeat(48)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
