/**
 * بوابة ٣ — عمق متون كوربوسات الأقسام حرفًا/حقلًا.
 * تمشي JSON المنشور وتفرض حدًّا أدنى لكل حقل نصي جوهري، مع منع الفراغ والحشو.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-corpus-depth-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUDITED_TEXT_FIELDS,
  MIN_FIELD_CHARS,
  STRICT_BODY_MIN_BY_PATH,
} from "../content-audit/corpora-roots";
import { findCharIssues } from "../content-audit/walk-corpora";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const JSON_ROOTS = [
  "public/data/quran-people",
  "public/data/knowledge",
  "public/data/stories",
  "public/data/quiz",
  "public/data/qa",
  "public/data/hadith-verified",
  "content/fiqh",
];

const SKIP_DIR = /(^|\/)(\.backup|backup|node_modules|deleted-|needs-post-review|governance|release-audit)(\/|$)/i;

type Finding = string;
const findings: Finding[] = [];
let fieldsChecked = 0;
let filesChecked = 0;

function walkJsonFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const abs = join(dir, ent.name);
    const rel = relative(appRoot, abs);
    if (SKIP_DIR.test(rel)) continue;
    if (ent.isDirectory()) walkJsonFiles(abs, out);
    else if (/\.json$/i.test(ent.name) && !ent.name.endsWith(".backup.json")) {
      try {
        if (statSync(abs).size <= 8_000_000) out.push(abs);
      } catch {
        /* ignore */
      }
    }
  }
  return out;
}

function minFor(field: string, fileRel: string): number | undefined {
  // شروحات الأسئلة التعليمية قد تكون كلمة موجزة (مثل «صحيح») — لا نفرض مقالًا
  if (/\/quiz\//.test(fileRel) && field === "explanation") return 1;
  if (/\/hadith-verified\//.test(fileRel) && field === "explanation") return 4;
  if (/\/hadith-verified\//.test(fileRel) && field === "text") return 4;
  for (const rule of STRICT_BODY_MIN_BY_PATH) {
    if (rule.field === field && rule.match.test(fileRel)) return rule.min;
  }
  return MIN_FIELD_CHARS[field];
}

function auditString(value: string, field: string, pathHint: string, fileRel: string) {
  const trimmed = value.trim();
  fieldsChecked += 1;
  const min = minFor(field, fileRel);
  if (min != null && trimmed.length > 0 && trimmed.length < min) {
    findings.push(`${pathHint}.${field}: أقصر من ${min} حرفًا (${trimmed.length})`);
  }
  if (trimmed.length === 0 && (field === "title" || field === "name" || field === "nameAr" || field === "label")) {
    findings.push(`${pathHint}.${field}: فارغ`);
  }
  // رفض سجلات القوالب حيث القيمة = اسم الحقل نفسه (title:"title")
  if (trimmed === field || trimmed === "null" || trimmed === "undefined") {
    findings.push(`${pathHint}.${field}: قيمة قالبية «${trimmed}»`);
  }
  if (/\.{4,}/.test(trimmed)) {
    findings.push(`${pathHint}.${field}: حشو نقاط ≥4`);
  }
  const issues = findCharIssues(trimmed);
  if (issues.replacement || issues.pua || issues.control) {
    findings.push(`${pathHint}.${field}: تلف حروف (${issues.samples[0] || ""})`);
  }
  if (min != null && trimmed.length >= min) {
    let letters = 0;
    for (let i = 0; i < trimmed.length; i += 1) {
      const c = trimmed.charCodeAt(i);
      if (
        (c >= 0x0600 && c <= 0x06ff) ||
        (c >= 65 && c <= 90) ||
        (c >= 97 && c <= 122) ||
        (c >= 0x30 && c <= 0x39)
      ) {
        letters += 1;
      }
    }
    if (letters < 2) findings.push(`${pathHint}.${field}: بلا حروف حقيقية`);
  }
}

function walkValue(value: unknown, pathHint: string, depth: number, fileRel: string) {
  if (depth > 14) return;
  if (typeof value === "string") return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkValue(v, `${pathHint}[${i}]`, depth + 1, fileRel));
    return;
  }
  if (!value || typeof value !== "object") return;
  const obj = value as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && AUDITED_TEXT_FIELDS.has(k)) {
      auditString(v, k, pathHint, fileRel);
    } else {
      walkValue(v, `${pathHint}.${k}`, depth + 1, fileRel);
    }
  }
}

for (const rootRel of JSON_ROOTS) {
  const files = walkJsonFiles(resolve(appRoot, rootRel));
  for (const abs of files) {
    filesChecked += 1;
    const rel = relative(appRoot, abs).replace(/\\/g, "/");
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(abs, "utf8"));
    } catch (e) {
      findings.push(`${rel}: JSON غير صالح (${String(e).slice(0, 80)})`);
      continue;
    }
    walkValue(data, rel, 0, rel);
  }
}

/** بذور TypeScript الحرجة للأقسام — فحص وجود + منع حقول فارغة ظاهرة */
const SEED_FILES = [
  "src/lib/prophets-data.ts",
  "src/lib/library-catalog.ts",
  "src/data/islamic-history/index.ts",
  "src/lib/adhkar-seed.ts",
  "src/lib/nations-seed.ts",
  "src/lib/islamic-stories-seed.ts",
  "src/lib/fiqh-hub-topics.ts",
  "src/lib/quiz-seed.ts",
  "src/config/sections.registry.ts",
];

for (const rel of SEED_FILES) {
  const abs = resolve(appRoot, rel);
  assert.ok(existsSync(abs), `بذرة موجودة: ${rel}`);
  const text = readFileSync(abs, "utf8");
  filesChecked += 1;
  assert.equal(extname(rel), ".ts");
  const issues = findCharIssues(text);
  assert.equal(issues.replacement, 0, `${rel}: بلا U+FFFD`);
  assert.equal(issues.pua, 0, `${rel}: بلا PUA`);
  assert.doesNotMatch(text, /\bTODO\b|\bFIXME\b/, `${rel}: بلا TODO/FIXME`);
  assert.doesNotMatch(text, /لorem ipsum|coming soon/i, `${rel}: بلا حشو لاتيني`);
  // حقول نصية فارغة شائعة في الكائنات
  const emptyField = text.match(
    /(title|name|nameAr|description|summary|definition|body|text)\s*:\s*["'`]\s*["'`]/,
  );
  assert.equal(emptyField, null, `${rel}: لا حقل جوهري فارغ (${emptyField?.[0] || ""})`);
}

assert.ok(filesChecked >= 30, `ملفات مُدقَّقة ≥30 (الآن ${filesChecked})`);
assert.ok(fieldsChecked >= 200, `حقول نصية مُدقَّقة ≥200 (الآن ${fieldsChecked})`);

if (findings.length) {
  console.error("\nفشل بوابة عمق المتون:");
  for (const f of findings.slice(0, 50)) console.error(`  ✗ ${f}`);
  if (findings.length > 50) console.error(`  … و${findings.length - 50} أخرى`);
  process.exit(1);
}

console.log(
  `content-audit-corpus-depth-gate: ok — ${filesChecked} ملفًا · ${fieldsChecked} حقلًا`,
);
