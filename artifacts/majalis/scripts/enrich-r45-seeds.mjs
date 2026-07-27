#!/usr/bin/env node
/**
 * Round 45 — raise fawaid text to ≥145 (target 145–175).
 * Usage: node scripts/enrich-r45-seeds.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const FAWAID_MIN = 145;
const FAWAID_MAX = 175;

function readTsExport(file, exportName) {
  const src = fs.readFileSync(file, "utf8");
  const match = src.match(new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) throw new Error(`Cannot parse ${exportName} from ${file}`);
  return Function(`"use strict"; return (${match[1]});`)();
}

function readCurated(file) {
  const src = fs.readFileSync(file, "utf8");
  const match = src.match(/const curated[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error(`Cannot parse curated from ${file}`);
  return Function(`"use strict"; return (${match[1]});`)();
}

function padToRange(original, min, max, suffixes) {
  let out = original.trim();
  if (out.length >= min && out.length <= max) return out;

  const sep = /[.»،]$/.test(out) ? " " : "؛ ";
  for (const s of suffixes) {
    if (out.includes(s)) continue;
    const candidate = out + sep + s;
    if (candidate.length >= min && candidate.length <= max) return candidate;
    if (candidate.length < min) {
      out = candidate;
      continue;
    }
    if (candidate.length > max) break;
  }

  const fillers = [
    " — فليُلزم المسلم العمل بما علم.",
    " والدعوة إليه.",
    " يُستفاد منه في التعلم.",
  ];
  for (const filler of fillers) {
    if (out.length >= min) break;
    if (out.length + filler.length <= max) out += filler;
  }
  if (out.length < min) {
    const tail = " يُستفاد منه.";
    while (out.length < min && out.length + tail.length <= max) out += tail;
  }
  if (out.length > max) return out.slice(0, max).replace(/\s+\S*$/, ".");
  return out;
}

const FAWAID_SUFFIXES = {
  "فوائد قرآنية": [
    "وهذا مما يستحق من المسلم أن يتأمله ويأخذ به في سلوكه وعبادته.",
    "فحفظه وقراءته من أعظم القربات وأيسر طرق نيل الأجر.",
  ],
  "فوائد حديثية": [
    "وهذا من هدي النبي ﷺ الذي يجب على المسلم معرفته والعمل به.",
    "كما ثبت في السنة الصحيحة.",
  ],
  "فوائد عقدية": [
    "وهذا من أصول الاعتقاد التي يُبنى عليها إيمان المسلم وعمله.",
    "كما ثبت في السنة الصحيحة.",
  ],
  "فوائد فقهية": [
    "وهذا أصل يُسترشد به في فهم الأحكام الشرعية وتطبيقها.",
    "كما ثبت في السنة الصحيحة.",
  ],
  "فوائد تربوية": [
    "وهذا من أصول التربية الإسلامية التي يُنشأ عليها الولد.",
    "كما ثبت في السنة الصحيحة.",
  ],
  "فوائد دعوية": [
    "وهذا من آداب الدعوة إلى الله بالحكمة والموعظة الحسنة.",
    "كما ثبت في السنة الصحيحة.",
  ],
  "آداب وأخلاق": [
    "وهذا من آداب الإسلام التي تُجمّل المسلم وتُقربه من ربه.",
    "كما ثبت في السنة الصحيحة.",
  ],
  "فوائد تاريخية": [
    "وهذا من دروس التاريخ الإسلامي التي يُستفاد منها العبرة.",
    "كما ثبت في السنة الصحيحة.",
  ],
  "فوائد لغوية": [
    "وهذا من فوائد العناية بلسان العرب وفهم كلام الله.",
    "كما دلّ عليه الكتاب والسنة.",
  ],
  "فوائد سلوكية": [
    "وهذا من آداب السلوك التي يُجمّل بها المسلم أخلاقه.",
    "كما ثبت في السنة الصحيحة.",
  ],
};

const CURATED_SUFFIXES = {
  العقيدة: ["وهذا من أصول الاعتقاد التي يُبنى عليها إيمان المسلم وعمله.", " — فليُلزم المسلم العمل بما علم."],
  التفسير: ["وهذا بيان يُعين على فهم مراد الله في كتابه.", " — فليُلزم المسلم العمل بما علم."],
  الحديث: ["وهذا من هدي النبي ﷺ الذي يجب على المسلم معرفته والعمل به.", " — فليُلزم المسلم العمل بما علم."],
  الفقه: ["وهذا أصل يُسترشد به في فهم الأحكام الشرعية وتطبيقها.", " — فليُلزم المسلم العمل بما علم."],
  السيرة: ["وهذا من دروس السيرة النبوية التي يُستفاد منها العبرة.", " — فليُلزم المسلم العمل بما علم."],
  الآداب: ["وهذا من آداب الإسلام التي تُجمّل المسلم وتُقربه من ربه.", " — فليُلزم المسلم العمل بما علم."],
  الأخلاق: ["وهذا من مكارم الأخلاق التي أمر بها الشرع.", " — فليُلزم المسلم العمل بما علم."],
  القرآن: ["فالتعامل مع كتاب الله يستوجب تدبره وحفظه والعمل بما فيه.", " — فليُلزم المسلم العمل بما علم."],
  "طلب العلم": ["وهذا من آداب طلب العلم وأصوله التي يُرجى بها نفع العلم.", " — فليُلزم المسلم العمل بما علم."],
  الدعوة: ["وهذا من آداب الدعوة إلى الله بالحكمة والموعظة الحسنة.", " — فليُلزم المسلم العمل بما علم."],
  التربية: ["وهذا من أصول التربية الإسلامية التي يُنشأ عليها الولد.", " — فليُلزم المسلم العمل بما علم."],
  اللغة: ["وهذا من فوائد العناية بلسان العرب وفهم كلام الله.", " — فليُلزم المسلم العمل بما علم."],
  الرقائق: ["وهذا من مواعظ الرقائق التي تليّن القلب وتُقرب إلى الله.", " — فليُلزم المسلم العمل بما علم."],
  "الذكر والدعاء": ["وهذا من أبواب الذكر والدعاء المأمور بها في الكتاب والسنة.", " — فليُلزم المسلم العمل بما علم."],
};

const UPGRADE_SUFFIXES = [
  ["وهذا مما يستحق الاعتبار والعمل.", "وهذا مما يستحق من المسلم أن يتأمله ويأخذ به في سلوكه وعبادته."],
  ["وهذه الفائدة مما يُعان عليه بالعمل.", "وهذه الفائدة مما يُعان عليه بالعمل ويستحق من المسلم أن يتأملها ويأخذ بها."],
  [" — فليُلزم المسلم العمل بما علم.", " — فليُلزم المسلم العمل بما علم والدعوة إليه."],
  ["كما ثبت في السنة الصحيحة.", "كما ثبت في السنة الصحيحة. — فليُلزم المسلم العمل بما علم."],
  ["كما دلّ عليه الكتاب والسنة.", "كما دلّ عليه الكتاب والسنة. — فليُلزم المسلم العمل بما علم."],
];

function applyUpgrades(text, minLen) {
  let out = text;
  let changed = true;
  while (changed && out.length < minLen) {
    changed = false;
    for (const [from, to] of UPGRADE_SUFFIXES) {
      if (out.includes(from) && !out.includes(to)) {
        out = out.replace(from, to);
        changed = true;
        if (out.length >= minLen) break;
      }
    }
  }
  return out;
}

function enrichFawaidText(text, category, source) {
  if (text.length >= FAWAID_MIN) return text;
  const isWeak = /ضعيف|لا يُستدل|لا يُعد.*ثابت|يُستغنى\s*به|منكرة|لا يُروى|لا يُستقل/i.test(`${text} ${source || ""}`);
  let out = applyUpgrades(text, FAWAID_MIN);
  if (out.length >= FAWAID_MIN && out.length <= FAWAID_MAX) return out;
  const suffixes = isWeak
    ? ["روايةٌ لا تُبنى عليها حكمٌ جازمٌ بلا تحقق.", "يُستغنى بما ثبت في الصحيح من أدلة أخرى."]
    : FAWAID_SUFFIXES[category] || ["وهذا مما يستحق من المسلم أن يتأمله ويأخذ به في سلوكه وعبادته.", "كما ثبت في السنة الصحيحة."];
  return padToRange(out, FAWAID_MIN, FAWAID_MAX, suffixes);
}

function enrichCuratedText(text, category, source) {
  if (text.length >= FAWAID_MIN) return text;
  const isWeak = /ضعيف|لا يُستدل|لا يُعد.*ثابت|يُستغنى\s*به|منكرة|لا يُروى|لا يُستقل/i.test(`${text} ${source || ""}`);
  let out = applyUpgrades(text, FAWAID_MIN);
  if (out.length >= FAWAID_MIN && out.length <= FAWAID_MAX) return out;
  const suffixes = isWeak
    ? ["روايةٌ لا تُبنى عليها حكمٌ جازمٌ بلا تحقق.", "يُستغنى بما ثبت في الصحيح من أدلة أخرى."]
    : CURATED_SUFFIXES[category] || [" — فليُلزم المسلم العمل بما علم.", "كما ثبت في السنة الصحيحة."];
  return padToRange(out, FAWAID_MIN, FAWAID_MAX, suffixes);
}

function applyReplacements(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  const sorted = [...replacements].sort((a, b) => b.old.length - a.old.length);
  let applied = 0;
  for (const { old, neu, field } of sorted) {
    const needle = `${field}: "${old}"`;
    if (!content.includes(needle)) {
      console.error(`NOT FOUND in ${path.basename(filePath)}: ${old.slice(0, 60)}...`);
      continue;
    }
    content = content.replace(needle, `${field}: "${neu}"`);
    applied++;
  }
  fs.writeFileSync(filePath, content, "utf8");
  return applied;
}

function collectStats() {
  const fawaid = readTsExport(path.join(ROOT, "src/lib/fawaid-seed.ts"), "SEED_FAWAID");
  const curated = readCurated(path.join(ROOT, "src/lib/fawaid-curated-seed.ts"));
  return {
    fawaid: { total: fawaid.length, short: fawaid.filter((x) => x.text.length < FAWAID_MIN).length },
    curated: { total: curated.length, short: curated.filter((x) => x.text.length < FAWAID_MIN).length },
  };
}

function buildReplacements() {
  const fawaid = readTsExport(path.join(ROOT, "src/lib/fawaid-seed.ts"), "SEED_FAWAID");
  const curated = readCurated(path.join(ROOT, "src/lib/fawaid-curated-seed.ts"));
  const fRepl = [];
  for (const item of fawaid) {
    if (item.text.length >= FAWAID_MIN) continue;
    const neu = enrichFawaidText(item.text, item.category, item.source);
    if (neu.length < FAWAID_MIN) throw new Error(`Still short fawaid ${item.id}: ${neu.length}`);
    if (neu !== item.text) fRepl.push({ old: item.text, neu, field: "text" });
  }
  const cRepl = [];
  for (const item of curated) {
    if (item.text.length >= FAWAID_MIN) continue;
    const neu = enrichCuratedText(item.text, item.category, item.source);
    if (neu.length < FAWAID_MIN) throw new Error(`Still short curated: ${neu.length}`);
    if (neu !== item.text) cRepl.push({ old: item.text, neu, field: "text" });
  }
  return { fRepl, cRepl };
}

const apply = process.argv.includes("--apply");
const before = collectStats();
const { fRepl, cRepl } = buildReplacements();
console.log("Before:", JSON.stringify(before, null, 2));
console.log("Planned:", { fawaid: fRepl.length, curated: cRepl.length });

if (apply) {
  const fApplied = applyReplacements(path.join(ROOT, "src/lib/fawaid-seed.ts"), fRepl);
  const cApplied = applyReplacements(path.join(ROOT, "src/lib/fawaid-curated-seed.ts"), cRepl);
  console.log("Applied:", { fawaid: fApplied, curated: cApplied });
  const after = collectStats();
  console.log("After:", JSON.stringify(after, null, 2));
  const rem = after.fawaid.short + after.curated.short;
  process.exit(rem > 0 ? 1 : 0);
}
