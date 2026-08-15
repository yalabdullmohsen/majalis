/**
 * اختبارات جودة البيانات — تفشل عند أخطاء بيانات مثبتة.
 * node --import tsx test/data-quality.spec.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { PROPHETS } = await import(pathToFileURL(path.join(root, "src/lib/prophets-data.ts")).href);
const { LIBRARY_CATALOG, LIBRARY_ID_ALIASES, resolveLibraryBookId } = await import(
  pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href,
);
const { SCHOLARS } = await import(pathToFileURL(path.join(root, "src/lib/scholars-data.ts")).href);

const GENERIC = new Set(["كتاب شرعي", "صفحة شرعية", "عالم شرعي", "قصة سورة", "موضوع شرعي"]);
const FAKE_SOURCE = ["رابط القراءة", "المصدر: رابط القراءة"];
const BOILER = ["تُربط سيرته", "يُستحضر المآل", "الصبر على مقتضاه", "ويُسأل الله التوفيق للعمل"];
const OLD_A = ["info", "@", "majlisilm", ".", "com"].join("");
const OLD_B = ["yalabdullmohsen1", "@", "gmail", ".", "com"].join("");

const bookIds = new Set<string>();
for (const b of LIBRARY_CATALOG as Array<{ id: string; title: string; author: string; source_title?: string; description: string }>) {
  assert.equal(bookIds.has(b.id), false, `duplicate book ${b.id}`);
  bookIds.add(b.id);
  assert.equal(GENERIC.has(b.title.trim()), false, `generic title ${b.id}`);
  assert.ok(b.author?.trim(), `empty author ${b.id}`);
  assert.equal(/shamaild/.test(b.id), false, `typo slug ${b.id}`);
  for (const f of FAKE_SOURCE) {
    assert.equal((b.source_title || "").includes(f), false, `${b.id} fake source`);
    assert.equal(b.description.includes(f), false, `${b.id} desc fake source`);
  }
  assert.equal(b.title.includes("undefined"), false);
  assert.equal(b.title === "null", false);
}

assert.equal(resolveLibraryBookId("book-shamaild-tirmidhi"), "book-shamaail-tirmidhi");
assert.ok(LIBRARY_ID_ALIASES["book-shamaild-tirmidhi"]);
assert.ok(bookIds.has("book-shamaail-tirmidhi"));

const scholarIds = new Set<string>();
for (const s of SCHOLARS as Array<{ id: string; name: string; fullName: string; bio: string }>) {
  assert.equal(scholarIds.has(s.id), false, `dup scholar ${s.id}`);
  scholarIds.add(s.id);
  assert.ok(s.name?.trim() && s.fullName?.trim(), s.id);
  assert.equal(GENERIC.has(s.name.trim()), false, s.id);
  assert.equal(s.bio.includes(OLD_A) || s.bio.includes(OLD_B), false, s.id);
}

const prophetSlugs = new Set<string>();
const bios = new Map<string, number>();
for (const p of PROPHETS as Array<{ slug: string; arabicName: string; surahCount: number; mainSurahs: string[]; briefBio: string }>) {
  assert.equal(prophetSlugs.has(p.slug), false, p.slug);
  prophetSlugs.add(p.slug);
  assert.equal(typeof p.surahCount, "number");
  assert.ok(p.mainSurahs?.length, p.slug);
  for (const ph of BOILER) {
    assert.equal(p.briefBio.includes(ph), false, `${p.slug}: ${ph}`);
  }
  const k = p.briefBio.replace(/\s+/g, " ").trim();
  bios.set(k, (bios.get(k) || 0) + 1);
}
for (const [bio, n] of bios) {
  assert.equal(n, 1, `duplicate bio: ${bio.slice(0, 40)}`);
}

// redirect موجود
const vercel = fs.readFileSync(path.join(root, "vercel.json"), "utf8");
assert.match(vercel, /book-shamaild-tirmidhi[\s\S]*book-shamaail-tirmidhi/);

console.log("data-quality.spec OK");
