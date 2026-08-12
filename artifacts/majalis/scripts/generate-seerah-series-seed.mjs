// يولّد SQL لإعادة تنظيم محتوى السيرة الموجود فعلاً في SeerahPage.tsx (12
// مرحلة حقيقية منشورة على الإنتاج) كسلسلة دروس حقيقية — إعادة تنظيم لمحتوى
// معتمد موجود، لا توليد نص جديد. يُشغَّل مرة واحدة يدويًا، الناتج يُراجَع ثم
// يُطبَّق عبر supabase db query --file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "src", "views", "SeerahPage.tsx"), "utf8");

const phasesMatch = src.match(/const PHASES:[^=]*=\s*(\[[\s\S]*?\n\];)/);
const sourcesMatch = src.match(/const SOURCES = (\[[\s\S]*?\];)/);
if (!phasesMatch || !sourcesMatch) throw new Error("تعذّر استخراج PHASES/SOURCES من SeerahPage.tsx");

// نزيل مرجع Icon (قيمة TS معرّفة، لا يمكن eval كـ JSON) قبل التقييم.
const phasesSrc = phasesMatch[1].replace(/Icon:\s*\w+,/g, "");
// eslint-disable-next-line no-eval
const PHASES = eval(phasesSrc);
// eslint-disable-next-line no-eval
const SOURCES = eval(sourcesMatch[1]);

const CATEGORY_SLUG_BY_PHASE = {
  "lineage-birth": "mawlid-nashaa",
  "childhood": "mawlid-nashaa",
  "youth": "arab-qabl-islam",
  "prophethood": "bitha-dawa-sirriyya",
  "secret-dawah": "bitha-dawa-sirriyya",
  "open-dawah": "dawa-jahriyya-makka",
  "year-of-sorrow": "dawa-jahriyya-makka",
  "hijra": "hijra",
  "ghazawat": "ahd-madani-ghazawat",
  "hudaybiyya-mecca": "ahd-madani-ghazawat",
  "farewell": "wafah-nabawiyya",
  "death": "wafah-nabawiyya",
};

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const lines = [];
lines.push("-- مولَّد آليًا عبر scripts/generate-seerah-series-seed.mjs — لا يُعدَّل يدويًا، أعد التوليد بدلاً من ذلك.");
lines.push("DO $$");
lines.push("DECLARE");
lines.push("  v_series_id UUID;");
for (const p of PHASES) lines.push(`  v_lesson_${p.num}_id UUID;`);
lines.push("BEGIN");
lines.push(`  IF EXISTS (SELECT 1 FROM lesson_series WHERE slug = 'seerah-kamila') THEN`);
lines.push(`    RAISE NOTICE 'سلسلة السيرة موجودة مسبقًا — تخطّي (idempotent)'; RETURN;`);
lines.push(`  END IF;`);
lines.push("");
lines.push(`  INSERT INTO lesson_series (slug, title, description, category_id, level, status, sort_order)`);
lines.push(`  VALUES ('seerah-kamila', 'السيرة النبوية الكاملة — من المولد إلى الوفاة',`);
lines.push(`    'رحلة زمنية مرتبة عبر ${PHASES.length} مرحلة من حياة النبي ﷺ، من نسبه ومولده حتى وفاته، بأحداثها الرئيسية وأدلتها من كتب السيرة المعتمدة.',`);
lines.push(`    (SELECT id FROM categories WHERE slug = 'seerah-nabawiyya'), 'beginner', 'published', 1)`);
lines.push(`  RETURNING id INTO v_series_id;`);
lines.push("");

for (const p of PHASES) {
  const catSlug = CATEGORY_SLUG_BY_PHASE[p.id] || "seerah-nabawiyya";
  lines.push(`  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)`);
  lines.push(`  VALUES (${sqlStr(p.title)}, ${sqlStr(p.desc)}, 'سيرة', (SELECT id FROM categories WHERE slug = ${sqlStr(catSlug)}), 'قراءة', false, 'approved', 'قراءة ذاتية', ${sqlStr("seerah-kamila:" + p.id)})`);
  lines.push(`  RETURNING id INTO v_lesson_${p.num}_id;`);
  lines.push("");

  lines.push(`  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_${p.num}_id, ${p.num}, true);`);

  lines.push(`  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES`);
  lines.push(`    (v_lesson_${p.num}_id, 'body', 'ملخص المرحلة', ${sqlStr(p.desc)}, 1),`);
  lines.push(`    (v_lesson_${p.num}_id, 'objectives', 'الموضوعات', ${sqlStr(p.topics.join(" — "))}, 2),`);
  lines.push(`    (v_lesson_${p.num}_id, 'timeline_events', 'الأحداث الرئيسية (${p.year})', ${sqlStr(p.keyEvents.map((e, i) => (i + 1) + ". " + e).join("\n"))}, 3);`);
  lines.push("");

  for (const [i, source] of SOURCES.entries()) {
    lines.push(`  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_${p.num}_id, 'book', ${sqlStr(source)}, ${i + 1});`);
  }
  lines.push("");
}

lines.push(`  RAISE NOTICE 'زُرعت سلسلة السيرة الكاملة: % مرحلة، % استشهاد لكل مرحلة', ${PHASES.length}, ${SOURCES.length};`);
lines.push("END $$;");

const outPath = path.join(here, "..", "supabase", "learn_library_v1_seerah_series_seed.sql");
fs.writeFileSync(outPath, lines.join("\n") + "\n");
console.log("كُتب:", outPath, "—", PHASES.length, "مرحلة،", SOURCES.length, "مصدر لكل مرحلة");
