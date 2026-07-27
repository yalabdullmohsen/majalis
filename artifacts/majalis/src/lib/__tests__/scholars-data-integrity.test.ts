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

console.log(`\n${"─".repeat(48)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
