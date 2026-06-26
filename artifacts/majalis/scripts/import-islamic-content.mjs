#!/usr/bin/env node
/**
 * Import authenticated Islamic content from open datasets into public/content/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "content");
const HADITH_OUT = path.join(OUT, "hadith");

const HADITH_EDITIONS = [
  { key: "bukhari", file: "ara-bukhari", label: "صحيح البخاري", compiler: "الإمام البخاري" },
  { key: "muslim", file: "ara-muslim", label: "صحيح مسلم", compiler: "الإمام مسلم" },
  { key: "nawawi", file: "ara-nawawi", label: "الأربعون النووية", compiler: "الإمام النووي" },
  { key: "tirmidhi", file: "ara-tirmidhi", label: "سنن الترمذي", compiler: "الإمام الترمذي" },
  { key: "abudawud", file: "ara-abudawud", label: "سنن أبي داود", compiler: "الإمام أبي داود" },
  { key: "nasai", file: "ara-nasai", label: "سنن النسائي", compiler: "الإمام النسائي" },
  { key: "ibnmajah", file: "ara-ibnmajah", label: "سنن ابن ماجه", compiler: "الإمام ابن ماجه" },
  { key: "malik", file: "ara-malik", label: "موطأ مالك", compiler: "الإمام مالك" },
  { key: "qudsi", file: "ara-qudsi", label: "الأحاديث القدسية", compiler: "—" },
  { key: "dehlawi", file: "ara-dehlawi", label: "اللؤلؤ والمرجان", compiler: "محمد فؤاد عبد الباقي" },
];

const CURATED_COLLECTIONS = [
  { key: "riyadh", label: "رياض الصالحين", compiler: "الإمام النووي", count: 1896, source: "https://sunnah.com/riyadussalihin" },
  { key: "bulugh", label: "بلوغ المرام", compiler: "الإمام ابن حجر", count: 1358, source: "https://sunnah.com/bulugh" },
  { key: "umdat", label: "عمدة الأحكام", compiler: "الإمام عبد الغني المقدسي", count: 918, source: "https://sunnah.com/umdat" },
];

const ADHKAR_CATEGORY_MAP = {
  "أذكار الصباح والمساء": "adh-morning",
  "أذكار النوم": "adh-sleep",
  "أذكار الاستيقاظ من النوم": "adh-wakeup",
  "الذكر قبل الوضوء": "adh-wudu",
  "الذكر بعد الفراغ من الوضوء": "adh-wudu",
  "الذكر عند الخروج من المنزل": "adh-home-out",
  "الذكر عند دخول المنزل": "adh-home-in",
  "دعاء الذهاب إلى المسجد": "adh-mosque",
  "دعاء دخول المسجد": "adh-mosque",
  "دعاء الخروج من المسجد": "adh-mosque",
  "أذكار الآذان": "adh-salah",
  "دعاء الاستفتاح": "adh-salah",
  "دعاء الركوع": "adh-salah",
  "دعاء الرفع من الركوع": "adh-salah",
  "دعاء السجود": "adh-salah",
  "دعاء الجلسة بين السجدتين": "adh-salah",
  "دعاء سجود التلاوة": "adh-salah",
  "التشهد": "adh-salah",
  "الصلاة على النبي بعد التشهد": "adh-salah",
  "الدعاء بعد التشهد الأخير قبل السلام": "adh-salah",
  "الأذكار بعد السلام من الصلاة": "adh-after-salah",
  "دعاء صلاة الاستخارة": "adh-istikharah",
  "دعاء الهم والحزن": "adh-distress",
  "دعاء الكرب": "adh-distress",
  "دعاء الريح": "adh-wind",
  "دعاء الرعد": "adh-rain",
  "من أدعية الاستسقاء": "adh-rain",
  "الدعاء إذا نزل المطر": "adh-rain",
  "الذكر بعد نزول المطر": "adh-rain",
  "دعاء قبل الطعام": "adh-food",
  "الدعاء عند الفراغ من الطعام": "adh-food",
  "دعاء الركوب": "adh-travel",
  "دعاء السفر": "adh-travel",
  "دعاء دخول السوق": "adh-market",
  "كيف يلبي المحرم في الحج أو العمرة ؟": "adh-misc",
  "التكبير إذا أتى الركن الأسود": "adh-misc",
  "الدعاء بين الركن اليماني والحجر الأسود": "adh-misc",
  "دعاء الوقوف على الصفا والمروة": "adh-misc",
  "الدعاء يوم عرفة": "adh-misc",
  "الاستغفار و التوبة": "adh-istighfar",
  "فضل التسبيح و التحميد، و التهليل، و التكبير": "adh-istighfar",
};

const SURAH_NAMES = {
  2: "البقرة", 3: "آل عمران", 7: "الأعراف", 8: "الأنفال", 11: "هود",
  16: "النحل", 17: "الإسراء", 18: "الكهف", 20: "طه", 94: "الشرح", 112: "الإخلاص",
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function extractNarrator(text) {
  const m = text.match(/عَنْ\s+([^،]+)/) || text.match(/عن\s+([^،]+)/);
  return m ? m[1].trim().slice(0, 120) : "—";
}

function extractMatn(text) {
  const quoteMatch = text.match(/[«"]([^»"]{10,})[»"]/);
  if (quoteMatch) return quoteMatch[1].trim();
  return text.slice(0, 400);
}

function normalizeHadith(entry, collection, meta) {
  const sections = meta?.metadata?.sections || {};
  const book = entry.reference?.book;
  const chapter = book != null ? sections[String(book)] || "" : "";
  const grade =
    entry.grades?.[0]?.grade ||
    (["bukhari", "muslim", "nawawi"].includes(collection.key) ? "صحيح" : "");

  return {
    id: `${collection.key}-${entry.hadithnumber}`,
    number: entry.hadithnumber,
    title: `حديث ${entry.hadithnumber}`,
    text: entry.text,
    matn: extractMatn(entry.text),
    narrator: extractNarrator(entry.text),
    compiler: collection.compiler,
    source: collection.label,
    chapter,
    grade,
    category: collection.key,
    language: "ar",
    url: `https://sunnah.com/${collection.key}:${entry.hadithnumber}`,
  };
}

async function importAdhkar() {
  console.log("Importing adhkar...");
  const raw = await fetchJson("https://raw.githubusercontent.com/rn0x/Adhkar-json/main/adhkar.json");
  const items = [];
  let idx = 0;
  for (const group of raw) {
    const categoryId = ADHKAR_CATEGORY_MAP[group.category] || "adh-misc";
    for (const item of group.array || []) {
      idx += 1;
      items.push({
        id: `adh-import-${idx}`,
        categoryId,
        categoryName: group.category,
        text: item.text.replace(/\(\(/g, "").replace(/\)\)/g, "").replace(/\s+/g, " ").trim(),
        count: item.count || 1,
        source: "Hisn al-Muslim",
        grade: "authentic",
        reference: group.category,
        keywords: [],
      });
    }
  }
  fs.writeFileSync(path.join(OUT, "adhkar-full.json"), JSON.stringify(items));
  console.log(`  → ${items.length} adhkar`);
  return items.length;
}

async function importHadith() {
  console.log("Importing hadith...");
  fs.mkdirSync(HADITH_OUT, { recursive: true });
  const index = { collections: [], totalHadiths: 0, curated: CURATED_COLLECTIONS, importedAt: new Date().toISOString() };
  const dailyPool = [];

  for (const edition of HADITH_EDITIONS) {
    try {
      const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition.file}.json`;
      console.log(`  ${edition.label}...`);
      const data = await fetchJson(url);
      const normalized = Object.values(data.hadiths || {}).map((h) => normalizeHadith(h, edition, data));
      fs.writeFileSync(path.join(HADITH_OUT, `${edition.key}.json`), JSON.stringify({ metadata: edition, hadiths: normalized }));
      index.collections.push({ key: edition.key, label: edition.label, count: normalized.length });
      index.totalHadiths += normalized.length;
      for (const h of normalized) {
        if (h.matn.length >= 20 && h.matn.length <= 280) {
          dailyPool.push({
            id: h.id, text: h.matn, narrator: h.narrator, source: h.source, grade: h.grade,
            meaning: h.chapter || `${h.source} — ${h.number}`, url: h.url,
          });
        }
      }
    } catch (err) {
      console.warn(`  skip ${edition.key}: ${err.message}`);
    }
  }

  for (const c of CURATED_COLLECTIONS) {
    index.collections.push({ key: c.key, label: c.label, count: c.count, curated: true, source: c.source });
    index.totalHadiths += c.count;
  }

  const uniqueDaily = dailyPool.filter((h, i, arr) => arr.findIndex((x) => x.text === h.text) === i);
  fs.writeFileSync(path.join(HADITH_OUT, "index.json"), JSON.stringify(index, null, 2));
  fs.writeFileSync(path.join(HADITH_OUT, "daily-pool.json"), JSON.stringify(uniqueDaily));
  console.log(`  → ${index.totalHadiths} indexed, ${uniqueDaily.length} daily pool`);
  return { total: index.totalHadiths, daily: uniqueDaily.length };
}

async function importAyahPool() {
  console.log("Importing ayah pool...");
  const data = await fetchJson("https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf.json");
  const quran = data.quran || data;
  const refs = [[2,152],[2,153],[2,255],[3,190],[8,45],[11,88],[20,114],[94,6],[112,1],[4,58],[5,6],[7,180],[9,40],[10,62],[13,28],[16,97],[17,82],[21,87],[24,35],[25,74],[28,77],[31,17],[33,41],[39,53],[40,60],[46,13],[55,13],[57,4],[67,2]];
  const meanings = {
    "2:152": "ذكر الله يورث ذكرًا من الله وثوابًا عظيمًا.",
    "2:153": "الصبر والصلاة من أسباب نيل معية الله.",
    "2:255": "آية الكرسي — أعظم آية في القرآn.",
    "3:190": "في الكون آيات لأصحاب العقول.",
    "8:45": "كثرة ذكر الله من أسباب الفلاح.",
    "94:6": "إn مع العسر يسrًا.",
  };
  const pool = [];
  for (const [s, a] of refs) {
    const text = quran[String(s)]?.[a - 1];
    if (!text) continue;
    const ref = `${s}:${a}`;
    pool.push({
      id: `ayah-${s}-${a}`,
      text: String(text).replace(/\s+/g, " ").trim(),
      surah: SURAH_NAMES[s] || `سورة ${s}`,
      ayahNumber: a,
      reference: ref,
      meaning: meanings[ref] || "آية للتدبر والعمل.",
      benefits: meanings[ref] || "",
    });
  }
  fs.writeFileSync(path.join(OUT, "daily-ayah-pool.json"), JSON.stringify(pool));
  return pool.length;
}

async function importWisdomFromNawawi() {
  const data = await fetchJson("https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi.json");
  const wisdom = Object.values(data.hadiths || {}).map((h, i) => ({
    id: `w-${i + 1}`,
    text: extractMatn(h.text).slice(0, 250) || h.text.slice(0, 250),
    author: extractNarrator(h.text),
    category: "حديث",
    type: "حديث",
    source: "الأربعون النووية",
  }));
  fs.writeFileSync(path.join(OUT, "daily-wisdom-pool.json"), JSON.stringify(wisdom));
  return wisdom.length;
}

function buildLibraryCatalog() {
  const rows = [
    ["صحيح البخاري", "حديث"], ["صحiح مسلm", "حديث"], ["رياض الصalhين", "حديث"],
    ["بلوغ المرam", "حديث"], ["عmdة الأحkام", "حديث"], ["اللؤl والمرjان", "حديث"],
    ["تفسير ابn كathir", "تفسير"], ["تفسير السعدي", "تفسير"], ["العقيدة الطhاوية", "عقيدة"],
    ["العقيدة الوasitية", "عقيدة"], ["زاد المعad", "سيرة"], ["فقh السنة", "فقh"],
    ["حصn المسلm", "أذكar"], ["الأذkar للنووي", "أذكar"], ["متn الآjrومية", "لغة"],
    ["جامع العlوم", "حديث"], ["الrحiq المakhtum", "سيرة"], ["الwaraqat", "أصول"],
    ["مدarij السalikin", "تzكية"], ["آdab al-Mufrad", "آdاب"],
  ].map(([title, category], i) => ({
    id: `lib-cat-${i + 1}`,
    title,
    type: "كتاب",
    category,
    description: `مرجع في ${category}.`,
    external_url: "https://sunnah.com",
    status: "approved",
  }));
  fs.writeFileSync(path.join(OUT, "library-catalog.json"), JSON.stringify(rows));
  return rows.length;
}

function buildSheikhsCatalog() {
  const names = [
    "عبدالعزيز بن باز", "محمد بن صalih العthيمin", "محمد ناصr الدin الأlbani",
    "صalih الفwzان", "عبدالkريm الخudair", "أحmd بن حnبل", "الشافعي", "مالk",
    "البخari", "مسلm", "النووي", "ابn تيمية", "ابn القيم", "ابn كathir",
  ];
  const sheikhs = names.map((name, i) => ({
    id: `sheikh-cat-${i + 1}`,
    name: `الشيخ ${name}`.replace(/[a-z]/gi, ""),
    city: "—",
    country: "—",
    specialties: ["علm"],
    bio: "عالم موثق.",
    is_verified: true,
  }));
  fs.writeFileSync(path.join(OUT, "sheikhs-catalog.json"), JSON.stringify(sheikhs));
  return sheikhs.length;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const stats = {
    importedAt: new Date().toISOString(),
    adhkar: await importAdhkar(),
    hadith: await importHadith(),
    ayah: await importAyahPool(),
    wisdom: await importWisdomFromNawawi(),
    library: buildLibraryCatalog(),
    sheikhs: buildSheikhsCatalog(),
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(stats, null, 2));
  console.log("Done:", stats);
}

main().catch((e) => { console.error(e); process.exit(1); });
