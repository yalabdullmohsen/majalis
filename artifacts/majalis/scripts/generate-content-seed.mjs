import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const qaSeedPath = path.resolve(root, "src/lib/qa-seed.ts");
const fawaidSeedPath = path.resolve(root, "src/lib/fawaid-seed.ts");

const QA_CATEGORIES = [
  { id: "seed-cat-aqeedah", name: "العقيدة", slug: "aqeedah" },
  { id: "seed-cat-salah", name: "الصلاة", slug: "salah" },
  { id: "seed-cat-zakat", name: "الزكاة", slug: "zakat" },
  { id: "seed-cat-sawm", name: "الصيام", slug: "sawm" },
  { id: "seed-cat-hajj", name: "الحج", slug: "hajj" },
  { id: "seed-cat-seerah", name: "السيرة", slug: "seerah" },
  { id: "seed-cat-quran", name: "القرآن", slug: "quran" },
  { id: "seed-cat-hadith", name: "الحديث", slug: "hadith" },
  { id: "seed-cat-adab", name: "الآداب", slug: "adab" },
];

const FAWAID_CATEGORIES = [
  "فوائد قرآنية",
  "فوائد حديثية",
  "فوائد عقدية",
  "فوائد فقهية",
  "فوائد تربوية",
  "فوائد دعوية",
  "آداب وأخلاق",
];

const QUIZ_TO_QA_CAT = {
  "الأنبياء|الرسل": "العقيدة",
  "الأحكام|الصلاة": "الصلاة",
  "الأحكام|الطهارة": "الصلاة",
  "الأحكام|الزكاة": "الزكاة",
  "الأحكام|الصيام": "الصيام",
  "الأحكام|الحج": "الحج",
  "السيرة|الدعوة": "السيرة",
  "السيرة|الهجرة": "السيرة",
  "السيرة|المساجd": "السيرة",
  "السيرة|الغزwات": "السيرة",
  "السيرة|الصلح": "السيرة",
  "السيرة|الفتح": "السيرة",
  "الصحابة|السيرة": "السيرة",
  "الصحابة|الخلفاء": "السيرة",
  "الصحابة|الألقاب": "السيرة",
  "الصحابة|أمهات المؤمنين": "السيرة",
  "الصالحون|الحديث": "الحديث",
  "الصالحون|العلماء": "الحديث",
  "الصالحون|الفقh": "الحديث",
  "الصالحون|التفسير": "القرآn",
  "الصالحون|الزهد": "الآdاب",
  "الصحابة|الحديث": "الحديث",
  "الألغاز الشرعية|عام": "الآdاب",
};

const CAT = Object.fromEntries(QA_CATEGORIES.map((c) => [c.slug, c.name]));
const LESSON_TO_QA = {
  عقيدة: CAT.aqeedah,
  فقه: CAT.salah,
  تفسير: CAT.quran,
  حديث: CAT.hadith,
};

function extractQuizRows(source) {
  const rows = [];
  const re =
    /\[\s*"((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\]/g;
  let m;
  while ((m = re.exec(source))) {
    rows.push(m.slice(1, 6).map((s) => s.replace(/\\"/g, '"')));
  }
  return rows;
}

function qa(q, a, ruling = null, evidence = null, reference = null) {
  return [q, a, ruling, evidence, reference];
}

function fw(text, source = null, author = null) {
  return [text, source, author];
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter(([first]) => {
    if (seen.has(first)) return false;
    seen.add(first);
    return true;
  });
}

function extractDemoQa(source) {
  const items = [];
  const re = /id:\s*"demo-qa-\d+"([\s\S]*?)(?=},\s*\{|export const)/g;
  let m;
  while ((m = re.exec(source))) {
    const block = m[0];
    const q = block.match(/question:\s*"((?:\\.|[^"\\])*)"/)?.[1]?.replace(/\\"/g, '"');
    const a = block.match(/answer:\s*"((?:\\.|[^"\\])*)"/)?.[1]?.replace(/\\"/g, '"');
    if (!q || !a) continue;
    const rulingM = block.match(/ruling_type:\s*(null|"([^"]*)")/);
    const evidenceM = block.match(/evidence:\s*(null|"((?:\\.|[^"\\])*)")/);
    const refM = block.match(/reference:\s*(null|"((?:\\.|[^"\\])*)")/);
    items.push([
      q,
      a,
      rulingM?.[2] ?? null,
      evidenceM?.[2]?.replace(/\\"/g, '"') ?? null,
      refM?.[2]?.replace(/\\"/g, '"') ?? null,
    ]);
  }
  return items;
}

function extractDemoFawaid(source) {
  const items = [];
  const re =
    /id:\s*"demo-fawaid-\d+"[\s\S]*?text:\s*"((?:\\.|[^"\\])*)"[\s\S]*?author_name:\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(source))) {
    items.push([m[1].replace(/\\"/g, '"'), null, m[2].replace(/\\"/g, '"')]);
  }
  return items;
}

function extractMiracleBodies(source) {
  const bodies = [];
  const re = /body:\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(source))) {
    const text = m[1].replace(/\\"/g, '"');
    if (text.includes("تعالى")) bodies.push(text);
  }
  return bodies;
}

function extractLessons(source) {
  const items = [];
  const re =
    /title:\s*"((?:\\.|[^"\\])*)"[\s\S]*?category:\s*"((?:\\.|[^"\\])*)"[\s\S]*?description:\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(source))) {
    if (!m[0].includes("demo-lesson")) continue;
    items.push({
      title: m[1].replace(/\\"/g, '"'),
      category: m[2].replace(/\\"/g, '"'),
      description: m[3].replace(/\\"/g, '"'),
    });
  }
  return items;
}

function extractLibrary(source) {
  const items = [];
  const re =
    /id:\s*"demo-library-\d+"[\s\S]*?title:\s*"((?:\\.|[^"\\])*)"[\s\S]*?description:\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(source))) {
    items.push([m[1].replace(/\\"/g, '"'), m[2].replace(/\\"/g, '"')]);
  }
  return items;
}

function extractSheikhBios(source) {
  const items = [];
  const re = /bio:\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(source))) {
    if (source.slice(Math.max(0, (m.index ?? 0) - 80), m.index).includes("demo-sheikh")) {
      items.push(m[1].replace(/\\"/g, '"'));
    }
  }
  return items;
}

function ensureMinRows(rows, min, fillerPool) {
  const out = dedupeRows([...rows]);
  let i = 0;
  while (out.length < min) {
    const item = fillerPool[i % fillerPool.length];
    const tagged = [item[0], ...item.slice(1)];
    if (!out.some((r) => r[0] === tagged[0])) out.push(tagged);
    i += 1;
    if (i > fillerPool.length * 3) break;
  }
  return out.slice(0, Math.max(min, out.length));
}

function buildQaByCategory() {
  const quizSrc = fs.readFileSync(path.join(__dirname, "generate-quiz-questions.mjs"), "utf8");
  const demoSrc = fs.readFileSync(path.join(root, "src/lib/demo-content.ts"), "utf8");
  const buckets = Object.fromEntries(QA_CATEGORIES.map((c) => [c.name, []]));
  const globalPool = [];

  for (const [section, category, , question, answer] of extractQuizRows(quizSrc)) {
    const catName = QUIZ_TO_QA_CAT[section + "|" + category];
    if (!catName) continue;
    const row = qa(question, "الجواب: " + answer + ".", section === "الأحكام" ? "واجب" : null, null, null);
    if (!buckets[catName]) buckets[catName] = [];
    buckets[catName].push(row);
    globalPool.push(row);
  }

  for (const row of extractDemoQa(demoSrc)) {
    buckets[CAT.adab].push(row);
    globalPool.push(row);
  }

  for (const { title, description, category } of extractLessons(demoSrc)) {
    const catName = LESSON_TO_QA[category] ?? CAT.adab;
    const row = qa("ما مضمون " + title + "؟", description, null, null, null);
    buckets[catName].push(row);
    globalPool.push(row);
  }

  for (const [title, description] of extractLibrary(demoSrc)) {
    for (const catName of [CAT.aqeedah, CAT.quran, CAT.adab]) {
      const row = qa("ما فائدة " + title + "؟", description, null, null, null);
      buckets[catName].push(row);
      globalPool.push(row);
    }
  }

  for (const body of extractMiracleBodies(demoSrc)) {
    const row = qa("ما دلالة هذه الآية؟", body, null, body.split("—")[0]?.trim() ?? null, CAT.quran + " الكريم");
    buckets[CAT.quran].push(row);
    globalPool.push(row);
  }

  const out = {};
  for (const cat of QA_CATEGORIES) {
    out[cat.name] = ensureMinRows(buckets[cat.name] ?? [], 13, globalPool).slice(0, Math.max(13, (buckets[cat.name] ?? []).length >= 13 ? (buckets[cat.name] ?? []).length : 13));
    if (out[cat.name].length < 12) {
      throw new Error("Category " + cat.name + " has " + out[cat.name].length);
    }
  }
  return out;
}

function buildFawaidByCategory() {
  const demoSrc = fs.readFileSync(path.join(root, "src/lib/demo-content.ts"), "utf8");
  const quizSrc = fs.readFileSync(path.join(__dirname, "generate-quiz-questions.mjs"), "utf8");
  const buckets = Object.fromEntries(FAWAID_CATEGORIES.map((c) => [c, []]));
  const globalPool = [];

  for (const row of extractDemoFawaid(demoSrc)) {
    buckets[FAWAID_CATEGORIES[4]].push(row);
    globalPool.push(row);
  }
  for (const body of extractMiracleBodies(demoSrc)) {
    const row = fw(body, CAT.quran + " الكريم", null);
    buckets[FAWAID_CATEGORIES[0]].push(row);
    globalPool.push(row);
  }
  for (const { description } of extractLessons(demoSrc)) {
    const row = fw(description, null, "فائدة تربوية");
    buckets[FAWAID_CATEGORIES[4]].push(row);
    globalPool.push(row);
  }
  for (const [, description] of extractLibrary(demoSrc)) {
    const row = fw(description, null, "فائدة مختارة");
    buckets[FAWAID_CATEGORIES[4]].push(row);
    globalPool.push(row);
  }
  for (const bio of extractSheikhBios(demoSrc)) {
    const row = fw(bio, null, "سيرة عالم");
    buckets[FAWAID_CATEGORIES[6]].push(row);
    globalPool.push(row);
  }
  for (const [, , , question, answer] of extractQuizRows(quizSrc)) {
    const row = fw("فائدة: " + answer + " — " + question, null, null);
    buckets[FAWAID_CATEGORIES[1]].push(row);
    globalPool.push(row);
  }

  const hints = [
    [FAWAID_CATEGORIES[0], ["تعالى", "آية"]],
    [FAWAID_CATEGORIES[1], ["فائدة"]],
    [FAWAID_CATEGORIES[2], ["الله", "إيman"]],
    [FAWAID_CATEGORIES[3], ["واجب", "الجواب"]],
    [FAWAID_CATEGORIES[4], ["علم", "مجلس", "فائدة"]],
    [FAWAID_CATEGORIES[5], ["هدى"]],
    [FAWAID_CATEGORIES[6], ["عالم", "تواضع"]],
  ];

  for (const [cat, keys] of hints) {
    for (const item of globalPool) {
      if (buckets[cat].length >= 16) break;
      if (keys.some((k) => item[0].includes(k)) && !buckets[cat].some((r) => r[0] === item[0])) {
        buckets[cat].push(item);
      }
    }
  }

  const out = {};
  for (const cat of FAWAID_CATEGORIES) {
    out[cat] = ensureMinRows(buckets[cat] ?? [], 16, globalPool).slice(0, 16);
    if (out[cat].length < 15) {
      throw new Error("Fawaid " + cat + " has " + out[cat].length);
    }
  }
  return out;
}

function buildQaItems(qaByCategory) {
  const items = [];
  let id = 1;
  const baseDate = new Date("2024-01-01T08:00:00.000Z").getTime();
  for (const cat of QA_CATEGORIES) {
    for (const [question, answer, ruling_type, evidence, reference] of qaByCategory[cat.name]) {
      items.push({
        id: "seed-qa-" + id,
        question,
        answer,
        category_id: cat.id,
        ruling_type: ruling_type ?? null,
        evidence: evidence ?? null,
        reference: reference ?? null,
        status: "published",
        review_status: "approved",
        created_at: new Date(baseDate + id * 3_600_000).toISOString(),
        qa_categories: { name: cat.name, slug: cat.slug },
      });
      id += 1;
    }
  }
  return items;
}

function buildFawaidItems(fawaidByCategory) {
  const items = [];
  let id = 1;
  for (const category of FAWAID_CATEGORIES) {
    for (const [text, source, author_name] of fawaidByCategory[category]) {
      items.push({
        id: "seed-fawaid-" + id,
        text,
        category,
        source: source ?? null,
        author_name: author_name ?? null,
        status: "approved",
      });
      id += 1;
    }
  }
  return items;
}

function generateQaSeedTs(items) {
  return (
    "// Auto-generated by scripts/generate-content-seed.mjs — do not edit manually\n" +
    'import { arabicMatchAny } from "./arabic-search";\n\n' +
    "export const QA_CATEGORIES = " +
    JSON.stringify(QA_CATEGORIES, null, 2) +
    " as const;\n\n" +
    "export const SEED_QA = " +
    JSON.stringify(items, null, 2) +
    ";\n\n" +
    "export function filterSeedQa({\n" +
    "  categoryId,\n" +
    "  search,\n" +
    "}: {\n" +
    "  categoryId?: string;\n" +
    "  search?: string;\n" +
    "}) {\n" +
    '  let items = SEED_QA.filter((q) => q.status === "published");\n' +
    '  if (categoryId && categoryId !== "all") {\n' +
    "    items = items.filter((q) => q.category_id === categoryId);\n" +
    "  }\n" +
    "  if (search?.trim()) {\n" +
    "    const s = search.trim();\n" +
    "    items = items.filter((q) =>\n" +
    "      arabicMatchAny([q.question, q.answer, q.evidence, q.reference, q.qa_categories?.name], s)\n" +
    "    );\n" +
    "  }\n" +
    "  return items;\n" +
    "}\n"
  );
}

function generateFawaidSeedTs(items) {
  const cats = FAWAID_CATEGORIES.map((c) => c.replace("d", "د"));
  return (
    "// Auto-generated by scripts/generate-content-seed.mjs — do not edit manually\n" +
    'import { arabicMatchAny } from "./arabic-search";\n\n' +
    "export const FAWAID_CATEGORIES = " +
    JSON.stringify(cats, null, 2) +
    " as const;\n\n" +
    "export const SEED_FAWAID = " +
    JSON.stringify(items, null, 2) +
    ";\n\n" +
    "export function filterSeedFawaid({\n" +
    "  category,\n" +
    "  search,\n" +
    "}: {\n" +
    "  category?: string;\n" +
    "  search?: string;\n" +
    "}) {\n" +
    '  let items = SEED_FAWAID.filter((f) => f.status === "approved");\n' +
    '  if (category && category !== "all") {\n' +
    "    items = items.filter((f) => f.category === category);\n" +
    "  }\n" +
    "  if (search?.trim()) {\n" +
    "    const s = search.trim();\n" +
    "    items = items.filter((f) => arabicMatchAny([f.text, f.author_name, f.source], s));\n" +
    "  }\n" +
    "  return items;\n" +
    "}\n"
  );
}

// Fix QUIZ map keys at runtime from quiz file pairs
const quizSrcForMap = fs.readFileSync(path.join(__dirname, "generate-quiz-questions.mjs"), "utf8");
for (const [section, category] of extractQuizRows(quizSrcForMap).map((r) => [r[0], r[1]])) {
  const key = section + "|" + category;
  if (!QUIZ_TO_QA_CAT[key]) {
    if (section === "السيرة" || section === "الصحابة") QUIZ_TO_QA_CAT[key] = CAT.seerah;
    if (section === "الصالحون" && category === "التفسير") QUIZ_TO_QA_CAT[key] = CAT.quran;
    if (section === "الصالحون") QUIZ_TO_QA_CAT[key] = CAT.hadith;
    if (section === "الأنبياء") QUIZ_TO_QA_CAT[key] = CAT.aqeedah;
    if (section === "الألغاز الشرعية") QUIZ_TO_QA_CAT[key] = CAT.adab;
    if (section === "الأحكام") {
      if (category === "الزكاة") QUIZ_TO_QA_CAT[key] = CAT.zakat;
      if (category === "الصيام") QUIZ_TO_QA_CAT[key] = CAT.sawm;
      if (category === "الحج") QUIZ_TO_QA_CAT[key] = CAT.hajj;
      if (category === "الصلاة" || category === "الطهارة") QUIZ_TO_QA_CAT[key] = CAT.salah;
    }
  }
}

const seedQa = buildQaItems(buildQaByCategory());
const seedFawaid = buildFawaidItems(buildFawaidByCategory());

fs.mkdirSync(path.dirname(qaSeedPath), { recursive: true });
fs.writeFileSync(qaSeedPath, generateQaSeedTs(seedQa), "utf8");
fs.writeFileSync(fawaidSeedPath, generateFawaidSeedTs(seedFawaid), "utf8");

console.log("QA seed: " + qaSeedPath);
console.log("Fawaid seed: " + fawaidSeedPath);
console.log("عدد أسئلة QA: " + seedQa.length);
console.log("عدد الفوائd: " + seedFawaid.length);
for (const cat of QA_CATEGORIES) {
  console.log("  " + cat.name + ": " + seedQa.filter((q) => q.category_id === cat.id).length);
}
for (const cat of FAWAID_CATEGORIES) {
  console.log("  " + cat + ": " + seedFawaid.filter((f) => f.category === cat).length);
}
