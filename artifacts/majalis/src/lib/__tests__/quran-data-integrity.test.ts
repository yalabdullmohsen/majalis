/**
 * بوابة بيانات القرآن — تأكيد بقاء المصدر بعد إزالة واجهة المصحف.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getSurahs, getSurahById } from "@/lib/quran-data";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const quranDir = resolve(root, "public/data/quran");
const quranV2Dir = resolve(root, "public/data/quran-v2");

const surahs = getSurahs();
assert.equal(surahs.length, 114, "عدد السور يجب أن يكون 114");

const fatiha = getSurahById(1);
assert.ok(fatiha.name.includes("فاتحة") || fatiha.name.includes("الفاتحة") || fatiha.number === 1);
assert.equal(fatiha.number, 1);
assert.ok(fatiha.ayahs >= 7, "الفاتحة لها 7 آيات على الأقل في الميتا");

const baqara = getSurahById(2);
assert.equal(baqara.number, 2);
assert.ok(baqara.ayahs >= 200, "البقرة لها آيات كثيرة");

assert.ok(existsSync(resolve(quranDir, "surah-001.json")), "surah-001.json موجود");
assert.ok(existsSync(resolve(quranDir, "surah-002.json")), "surah-002.json موجود");
assert.ok(existsSync(resolve(quranDir, "pages-manifest.json")), "pages-manifest.json موجود");
assert.ok(existsSync(resolve(quranV2Dir, "chapters.json")), "quran-v2/chapters.json موجود");
assert.ok(existsSync(resolve(quranV2Dir, "pages/page-001.json")), "quran-v2 page-001 موجود");

const surah1 = JSON.parse(readFileSync(resolve(quranDir, "surah-001.json"), "utf8"));
const ayahs = surah1.ayahs ?? surah1.data?.ayahs ?? [];
assert.ok(Array.isArray(ayahs) && ayahs.length >= 7, "آيات الفاتحة قابلة للقراءة من JSON");
const firstText = String(ayahs[0]?.text ?? ayahs[0]?.textUthmani ?? "");
assert.ok(firstText.length > 5, "نص الآية الأولى غير فارغ");

const page1raw = JSON.parse(readFileSync(resolve(quranV2Dir, "pages/page-001.json"), "utf8"));
const pageVerses = Array.isArray(page1raw) ? page1raw : (page1raw.verses ?? []);
const words = pageVerses.flatMap((v: { words?: unknown[] }) => v.words ?? []);
assert.ok(Array.isArray(words) && words.length > 0, "كلمات QPC للصفحة ١ موجودة");

console.log("✓ quran-data-integrity: 114 سور، الفاتحة والبقرة، آيات وكلمات موجودة");
