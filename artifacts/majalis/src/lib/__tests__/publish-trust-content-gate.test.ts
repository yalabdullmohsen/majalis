/**
 * بوابة نشر موثوق: تمنع محتوى منشورًا بلا عنوان، أو بعبارات تجريبية ظاهرة،
 * أو بإيموجي، أو بـ slugs مكررة، أو بروابط داخلية غير صالحة الشكل.
 * التشغيل: node --import tsx src/lib/__tests__/publish-trust-content-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const FORBIDDEN = [
  "يحتاج مراجعة",
  "قيد الإضافة",
  "قيد الإعداد",
  "placeholder",
  "TODO",
  "FIXME",
] as const;

/** «قريبًا» ممنوعة كعبارة واجهة؛ تُستثنى الصياغات العربية السليمة مثل «كان قريبًا من». */
function hasForbiddenSoon(text: string): boolean {
  if (!text.includes("قريبًا") && !text.includes("قريبا")) return false;
  const cleaned = text
    .replace(/كان قريبًا/g, "")
    .replace(/كان قريبا/g, "")
    .replace(/قريبًا من/g, "")
    .replace(/قريبا من/g, "");
  return /قريبًا|قريبا/.test(cleaned);
}

const EMOJI_RE =
  /(?:[\u{1F300}-\u{1FAFF}]|\p{Emoji_Presentation}|(?:\p{Extended_Pictographic}\uFE0F))/u;

const people = JSON.parse(read("public/data/quran-people/people.json"));
const list = (people.people || []) as {
  slug?: string;
  nameAr?: string;
  definition?: string;
  whyMentioned?: string;
  lessons?: string[];
  status?: string;
  relatedLinks?: { href?: string; label?: string }[];
  occurrences?: unknown[];
}[];

assert.ok(Array.isArray(list) && list.length > 0, "people.json محمّل");

const slugs = list.map((p) => p.slug).filter(Boolean) as string[];
assert.equal(new Set(slugs).size, slugs.length, "لا slugs مكررة في أعلام القرآن");

const published = list.filter((p) => p.status === "published");
assert.ok(published.length >= 80, `منشور ≥80 (الآن ${published.length})`);

for (const p of published) {
  assert.ok((p.nameAr || "").trim().length > 0, `عنوان مطلوب: ${p.slug}`);
  assert.ok((p.definition || "").trim().length >= 160, `تعريف منشور ≥160: ${p.slug}`);
  assert.ok(
    Array.isArray(p.occurrences) && p.occurrences.length > 0,
    `مواضع آيات مطلوبة: ${p.slug}`,
  );
  const blob = [p.nameAr, p.definition, p.whyMentioned, ...(p.lessons || [])].join("\n");
  for (const phrase of FORBIDDEN) {
    assert.ok(!blob.includes(phrase), `${p.slug}: بلا «${phrase}»`);
  }
  assert.ok(!hasForbiddenSoon(blob), `${p.slug}: بلا «قريبًا» واجهية`);
  assert.ok(!EMOJI_RE.test(blob), `${p.slug}: بلا إيموجي`);
  assert.ok(
    (p.whyMentioned || "").trim().length >= 60,
    `سبب الذكر ≥60: ${p.slug}`,
  );
  assert.doesNotMatch(
    p.whyMentioned || "",
    /والحكمة الجامعة من ذكر الأعلام/,
    `لا whyMentioned عام: ${p.slug}`,
  );
  assert.ok(
    !(p.lessons || []).some((l) =>
      /للعبرة والتوحيد لا للاشتغال|وليسأل القارئ|تُقرأ على النفس/.test(l),
    ),
    `لا دروس حشو آلي: ${p.slug}`,
  );
  for (const link of p.relatedLinks || []) {
    const href = (link.href || "").trim();
    assert.ok(href.startsWith("/"), `${p.slug}: رابط داخلي يبدأ بـ / (${href})`);
    assert.ok(!href.includes("://"), `${p.slug}: لا روابط خارجية في relatedLinks`);
    assert.ok(
      /^\/[a-z0-9/_\u0600-\u06FF-]+$/i.test(href),
      `${p.slug}: شكل رابط صالح (${href})`,
    );
  }
}

const fiqhHub = read("src/lib/fiqh-hub-topics.ts");
assert.doesNotMatch(fiqhHub, /emoji:\s*"[^"]*[\u{1F300}-\u{1FAFF}]/u, "لا إيموجي في بطاقات الفقه");
for (const phrase of FORBIDDEN) {
  assert.ok(!fiqhHub.includes(phrase), `fiqh-hub بلا «${phrase}»`);
}

const libraryCatalog = read("src/lib/library-catalog.ts").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
).replace(/\/\/.*$/gm, "");
for (const phrase of ["يحتاج مراجعة", "قيد الإضافة", "المصدر قيد الإضافة"] as const) {
  assert.ok(!libraryCatalog.includes(phrase), `المكتبة لا تعرض «${phrase}» للمستخدم`);
}

console.log("publish-trust-content-gate: ok");
