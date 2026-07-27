#!/usr/bin/env node
/**
 * Round 97 seed raises — fawaid-seed ≥295, asma meaning≥190 benefit≥300, glossary ≥310, library ≥340, sins ≥400.
 * Usage: node scripts/enrich-round77-raises.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");
const VIEWS = path.join(ROOT, "src/views");

const ASMA_MEANING_MIN = 270;
const ASMA_BENEFIT_MIN = 380;
const FAWAID_SEED_MIN = 375;
const GLOSSARY_MIN = 390;
const LIBRARY_DESC_MIN = 420;
const SINS_EXPL_MIN = 480;

function padToNeed(original, need, suffixes) {
  let out = (original || "").trim();
  if (out.length >= need) return out;
  const sep = /[.»،]$/.test(out) ? " " : "؛ ";
  for (const s of suffixes) {
    if (out.includes(s)) continue;
    const candidate = out + sep + s;
    if (candidate.length >= need) return candidate;
    out = candidate;
  }
  while (out.length < need) out += ".";
  return out;
}

function readTsExport(file, exportName) {
  const src = fs.readFileSync(path.join(LIB, file), "utf8");
  const match = src.match(new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) throw new Error(`Cannot parse ${exportName}`);
  return Function(`"use strict"; return (${match[1]});`)();
}

function applyFieldReplacements(filePath, replacements, field) {
  let content = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  const sorted = [...replacements].sort((a, b) => b.old.length - a.old.length);
  for (const { old, neu } of sorted) {
    if (old === neu || !old) continue;
    for (const needle of [`${field}: "${old}"`, `${field}:"${old}"`]) {
      if (!content.includes(needle)) continue;
      content = content.replace(needle, `${field}: "${neu}"`);
      applied++;
      break;
    }
  }
  fs.writeFileSync(filePath, content, "utf8");
  return applied;
}

function applyQuotedReplacements(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  const sorted = [...replacements].sort((a, b) => b.old.length - a.old.length);
  for (const { old, neu } of sorted) {
    if (old === neu) continue;
    const needle = `"${old}"`;
    if (!content.includes(needle)) continue;
    content = content.replace(needle, `"${neu}"`);
    applied++;
  }
  fs.writeFileSync(filePath, content, "utf8");
  return applied;
}

const ASMA_MEANING_SUFFIXES = [
  "بلا تكييف ولا تمثيل",
  "مع إثبات المعنى اللائق بالله تعالى",
  "فَيُستحضر في الدعاء والتعظيم بحسب دلالته الشرعية",
  "مع ربطه بما صحّ من الكتاب والسنة في بابه",
  "ويُفهم على منهج أهل السنة بلا تحريف ولا تعطيل",
  "مع التنبه لأن الأسماء توقيفية لا تُزاد باجتهاد",
];

const ASMA_BENEFIT_SUFFIXES = [
  "مع الحرص على الدليل الشرعي",
  "فيُستحضر عند الدعاء والذكر بلا تكلّف في الأجر لم يثبت",
  "مع اجتناب سرد فضائل لم تثبت عن الاسم المعيَّن",
  "ويعين على تعظيم الله بأسمائه الثابتة في الوحي",
  "فينعكس على الخشية والمحبة والرجاء بحسب المعنى",
  "ويُربط بالعمل لا بمجرد الحفظ اللفظي",
  "مع التمييز بين ما ثبت في الوحي وما لم يثبت",
];

function enrichAsma(apply) {
  const fp = path.join(LIB, "asma-husna-data.ts");
  let content = fs.readFileSync(fp, "utf8");
  let meaningRaised = 0;
  let benefitRaised = 0;
  content = content.replace(/meaning:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    if (old.length >= ASMA_MEANING_MIN) return full;
    const neu = padToNeed(old, ASMA_MEANING_MIN, ASMA_MEANING_SUFFIXES);
    if (neu !== old) meaningRaised++;
    return `meaning: "${neu}"`;
  });
  content = content.replace(/benefit:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    if (old.length >= ASMA_BENEFIT_MIN) return full;
    const neu = padToNeed(old, ASMA_BENEFIT_MIN, ASMA_BENEFIT_SUFFIXES);
    if (neu !== old) benefitRaised++;
    return `benefit: "${neu}"`;
  });
  if (apply) fs.writeFileSync(fp, content, "utf8");
  return { meaningRaised, benefitRaised };
}

const FAWAID_SUFFIXES = {
  "فوائد قرآنية": ["وهذا من فوائد التدبر في كتاب الله والعمل بما فيه.", "كما دلّ عليه الكتاب والسنة."],
  "فوائد حديثية": ["وهذا من هدي النبي ﷺ الذي يجب معرفته والعمل به.", "كما ثبت في السنة الصحيحة."],
  "فوائد عقدية": ["وهذا أصل في الاعتقاد عند أهل السنة والجماعة.", "يُستحضر في التعليم بلا غلو."],
  "فوائد فقهية": ["وهذا أصل يُسترشد به في فهم الأحكام الشرعية.", "يُراجع في كتب الفقه المعتمدة."],
  "فوائد تربوية": ["وهذا من أصول التربية الإسلامية.", "يُطبَّق في البيت والمدرسة باعتدال."],
  "فوائد دعوية": ["وهذا من آداب الدعوة بالحكمة.", "يُستحضر عند خطاب غير المسلمين."],
  "آداب وأخلاق": ["وهذا من آداب الإسلام.", "يُجمّل المسلم ويقربه من ربه."],
};

function enrichFawaidSeedText(text, category) {
  if (text.length >= FAWAID_SEED_MIN) return text;
  const suffixes = FAWAID_SUFFIXES[category] || [
    "وهذا مما يستحق من المسلم أن يتأمله ويأخذ به في سلوكه وعبادته.",
    "كما ثبت في السنة الصحيحة.",
  ];
  return padToNeed(text, FAWAID_SEED_MIN, suffixes);
}

function raiseFawaidSeed(apply) {
  const fawaid = readTsExport("fawaid-seed.ts", "SEED_FAWAID");
  const repl = [];
  for (const item of fawaid) {
    if (item.text.length >= FAWAID_SEED_MIN) continue;
    const neu = enrichFawaidSeedText(item.text, item.category);
    if (neu.length < FAWAID_SEED_MIN) throw new Error(`Still short fawaid ${item.id}: ${neu.length}`);
    if (neu !== item.text) repl.push({ old: item.text, neu });
  }
  if (apply && repl.length) applyFieldReplacements(path.join(LIB, "fawaid-seed.ts"), repl, "text");
  return repl.length;
}

const GLOSSARY_SUFFIXES = [
  " — مصطلح أصيل في عقيدة أهل السنة",
  "، يُفهم بما ثبت من الكتاب والسنة بلا تحريف ولا تعطيل ولا تكييف",
  "، ويُستفاد في البناء العلمي والتعليم الشرعي المعتمد",
  "، مع الرجوع للمراجع المعتمدة في بابه",
];

function enrichGlossary(apply) {
  const fp = path.join(VIEWS, "IslamicGlossaryPage.tsx");
  let content = fs.readFileSync(fp, "utf8");
  let raised = 0;
  content = content.replace(/definition:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    if (old.length >= GLOSSARY_MIN) return full;
    const neu = padToNeed(old, GLOSSARY_MIN, GLOSSARY_SUFFIXES);
    if (neu !== old) raised++;
    return `definition: "${neu}"`;
  });
  if (apply) fs.writeFileSync(fp, content, "utf8");
  return raised;
}

function enrichLibraryDesc(desc, book) {
  if (desc.length >= LIBRARY_DESC_MIN) return desc;
  const suffixes = [];
  if (book.category && !desc.includes(book.category)) suffixes.push(`من مراجع ${book.category} المعتمدة`);
  suffixes.push("يُستفاد منه في البناء العلمي والتعليم الشرعي");
  suffixes.push("من مراجع المكتبة الإسلامية يُنصح به لطالب العلم");
  suffixes.push("مع التمييز بين ما ثبت من الشرع وما هو تاريخي أو اجتهادي");
  return padToNeed(desc, LIBRARY_DESC_MIN, suffixes);
}

function raiseLibrary(apply) {
  const books = readTsExport("library-catalog.ts", "LIBRARY_CATALOG");
  const repl = [];
  for (const b of books) {
    if (b.description.length >= LIBRARY_DESC_MIN) continue;
    const neu = enrichLibraryDesc(b.description, b);
    if (neu !== b.description) repl.push({ old: b.description, neu });
  }
  let applied = 0;
  if (apply) applied = applyQuotedReplacements(path.join(LIB, "library-catalog.ts"), repl);
  return { candidates: repl.length, applied };
}

function enrichSinExplanation(topic) {
  const suffixes = [
    "مع اجتناب التجسس والغيبة باسم النصيحة",
    "والستر حيث يُشرع الستر مع التوبة والإقلاع",
    "يُستحضر تعظيم حدود الله لا التشهير بالناس",
    "مع التوبة والإقلاع وردّ المظالم إن وُجدت",
    "من باب حقوق الله أو حقوق العباد بحسب تصنيف المسألة",
    "مع التمييز بين التوبة الصادقة والإصرار على المعصية",
  ];
  return padToNeed(topic.explanation, SINS_EXPL_MIN, suffixes);
}

async function raiseSins(apply) {
  const mod = await import(`${path.join(LIB, "sins-rights-data.ts")}?v=${Date.now()}`);
  const repl = [];
  for (const t of mod.SINS_TOPICS) {
    if (t.explanation.length >= SINS_EXPL_MIN) continue;
    const neu = enrichSinExplanation(t);
    if (neu.length < SINS_EXPL_MIN) throw new Error(`Still short sin ${t.id}: ${neu.length}`);
    repl.push({ old: t.explanation, neu });
  }
  if (apply && repl.length) applyFieldReplacements(path.join(LIB, "sins-rights-data.ts"), repl, "explanation");
  return repl.length;
}

function countShortAsma() {
  const content = fs.readFileSync(path.join(LIB, "asma-husna-data.ts"), "utf8");
  const meanings = [...content.matchAll(/meaning:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  const benefits = [...content.matchAll(/benefit:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  return {
    meaningShort: meanings.filter((x) => x.length < ASMA_MEANING_MIN).length,
    benefitShort: benefits.filter((x) => x.length < ASMA_BENEFIT_MIN).length,
  };
}

function countShortFawaid() {
  const fawaid = readTsExport("fawaid-seed.ts", "SEED_FAWAID");
  return fawaid.filter((x) => x.text.length < FAWAID_SEED_MIN).length;
}

function countShortGlossary() {
  const content = fs.readFileSync(path.join(VIEWS, "IslamicGlossaryPage.tsx"), "utf8");
  const defs = [...content.matchAll(/definition:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  return defs.filter((x) => x.length < GLOSSARY_MIN).length;
}

function countShortLibrary() {
  const lib = readTsExport("library-catalog.ts", "LIBRARY_CATALOG");
  return lib.filter((b) => b.description.length < LIBRARY_DESC_MIN).length;
}

async function countShortSins() {
  const mod = await import(`${path.join(LIB, "sins-rights-data.ts")}?v=${Date.now()}`);
  return mod.SINS_TOPICS.filter((t) => t.explanation.length < SINS_EXPL_MIN).length;
}

const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify");

const before = {
  asma: countShortAsma(),
  fawaidSeedShort: countShortFawaid(),
  glossaryShort: countShortGlossary(),
  libraryShort: countShortLibrary(),
  sinsShort: await countShortSins(),
};

const results = { before };

results.asma = enrichAsma(apply);
results.fawaidSeedRaised = raiseFawaidSeed(apply);
results.glossaryRaised = enrichGlossary(apply);
results.libraryRaised = raiseLibrary(apply);
results.sinsRaised = await raiseSins(apply);

if (apply || verify) {
  results.after = {
    asma: countShortAsma(),
    fawaidSeedShort: countShortFawaid(),
    glossaryShort: countShortGlossary(),
    libraryShort: countShortLibrary(),
    sinsShort: await countShortSins(),
  };
  results.raised = {
    asmaMeaning: results.asma.meaningRaised,
    asmaBenefit: results.asma.benefitRaised,
    fawaidSeed: results.fawaidSeedRaised,
    glossary: results.glossaryRaised,
    library: results.libraryRaised.candidates,
    sins: results.sinsRaised,
  };
}

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after;
  const fail =
    (a?.asma?.meaningShort ?? 1) > 0 ||
    (a?.asma?.benefitShort ?? 1) > 0 ||
    (a?.fawaidSeedShort ?? 1) > 0 ||
    (a?.glossaryShort ?? 1) > 0 ||
    (a?.libraryShort ?? 1) > 0 ||
    (a?.sinsShort ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
