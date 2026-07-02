#!/usr/bin/env node
/**
 * scripts/seed-recommendations.mjs
 *
 * يُنشئ الوسوم الأولية ويربطها بالمحتوى الموجود تلقائياً.
 * الاستخدام:
 *   DATABASE_URL="postgresql://..." node scripts/seed-recommendations.mjs
 */

import pkg from "../node_modules/pg/lib/index.js";
const { Client } = pkg;

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL غير محدد");
  process.exit(1);
}

function buildConfig(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port) || 5432,
    database: u.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
  };
}

// ── الوسوم الأساسية ────────────────────────────────────────────────────────

const SEED_TAGS = [
  // موضوعات فقهية
  { tag_name: "taharah",      tag_name_ar: "الطهارة",            tag_type: "fiqh_chapter" },
  { tag_name: "salah",        tag_name_ar: "الصلاة",             tag_type: "fiqh_chapter" },
  { tag_name: "sawm",         tag_name_ar: "الصيام",             tag_type: "fiqh_chapter" },
  { tag_name: "zakat",        tag_name_ar: "الزكاة",             tag_type: "fiqh_chapter" },
  { tag_name: "hajj",         tag_name_ar: "الحج والعمرة",       tag_type: "fiqh_chapter" },
  { tag_name: "nikah",        tag_name_ar: "النكاح",             tag_type: "fiqh_chapter" },
  { tag_name: "muamalat",     tag_name_ar: "المعاملات",          tag_type: "fiqh_chapter" },
  { tag_name: "janazah",      tag_name_ar: "الجنائز",            tag_type: "fiqh_chapter" },
  { tag_name: "adkar",        tag_name_ar: "الأذكار والدعاء",    tag_type: "topic" },
  { tag_name: "quran_study",  tag_name_ar: "علوم القرآن",        tag_type: "topic" },
  { tag_name: "hadith_study", tag_name_ar: "علوم الحديث",        tag_type: "topic" },
  { tag_name: "aqeedah",      tag_name_ar: "العقيدة",            tag_type: "topic" },
  { tag_name: "seerah",       tag_name_ar: "السيرة النبوية",     tag_type: "topic" },
  { tag_name: "akhlaq",       tag_name_ar: "الأخلاق والآداب",    tag_type: "topic" },
  { tag_name: "dawah",        tag_name_ar: "الدعوة والتربية",    tag_type: "topic" },
  { tag_name: "family",       tag_name_ar: "الأسرة والتربية",    tag_type: "topic" },
  { tag_name: "tafsir",       tag_name_ar: "التفسير",            tag_type: "quran_theme" },
  { tag_name: "tajweed",      tag_name_ar: "التجويد والقراءات",  tag_type: "quran_theme" },
  { tag_name: "miracles",     tag_name_ar: "الإعجاز العلمي",     tag_type: "topic" },
  { tag_name: "contemporary", tag_name_ar: "النوازل المعاصرة",   tag_type: "ruling" },
  { tag_name: "beginner",     tag_name_ar: "للمبتدئين",          tag_type: "general" },
  { tag_name: "advanced",     tag_name_ar: "للمتقدمين",          tag_type: "general" },
  { tag_name: "ramadan",      tag_name_ar: "رمضان",              tag_type: "topic" },
  { tag_name: "hajj_topic",   tag_name_ar: "موسم الحج",         tag_type: "topic" },
];

// ── خرائط الكلمات المفتاحية للوسوم ────────────────────────────────────────

const KEYWORD_TAG_MAP = [
  { keywords: ["طهارة","وضوء","غسل","تيمم","نجاسة"], tag: "taharah" },
  { keywords: ["صلاة","صلات","ركعة","ركوع","سجود","أذان","إقامة","نافلة"], tag: "salah" },
  { keywords: ["صيام","صوم","رمضان","إفطار","سحور","فطر"], tag: "sawm" },
  { keywords: ["زكاة","صدقة","نصاب","فطرة"], tag: "zakat" },
  { keywords: ["حج","عمرة","مكة","منى","عرفة","طواف","إحرام"], tag: "hajj" },
  { keywords: ["نكاح","زواج","طلاق","مهر","خطبة","عقد"], tag: "nikah" },
  { keywords: ["بيع","ربا","معاملة","عقد","تجارة","مال"], tag: "muamalat" },
  { keywords: ["جنازة","وفاة","ميت","تغسيل","دفن","عزاء"], tag: "janazah" },
  { keywords: ["ذكر","دعاء","استغفار","تسبيح","صباح","مساء"], tag: "adkar" },
  { keywords: ["قرآن","تفسير","آية","سورة","تلاوة","حفظ"], tag: "quran_study" },
  { keywords: ["حديث","سنة","صحيح","رواة","إسناد"], tag: "hadith_study" },
  { keywords: ["عقيدة","توحيد","إيمان","أسماء","صفات","غيب"], tag: "aqeedah" },
  { keywords: ["سيرة","نبي","صحابة","غزوة","هجرة","مكة","مدينة"], tag: "seerah" },
  { keywords: ["أخلاق","آداب","تواضع","صدق","أمانة","تربية"], tag: "akhlaq" },
  { keywords: ["دعوة","تبليغ","إصلاح","وعظ","خطبة"], tag: "dawah" },
  { keywords: ["أسرة","ولد","زوج","زوجة","والدين","أبناء","بيت"], tag: "family" },
  { keywords: ["تفسير","معنى","آية","تأويل"], tag: "tafsir" },
  { keywords: ["تجويد","مخارج","قراءة","نطق","ترتيل"], tag: "tajweed" },
  { keywords: ["إعجاز","علمي","معجزة","كون","خلق","تشريح"], tag: "miracles" },
  { keywords: ["معاصر","حديث","عصر","تقنية","إنترنت","رقمي"], tag: "contemporary" },
  { keywords: ["رمضان","فطر","أضحى","شوال","عشر"], tag: "ramadan" },
  { keywords: ["حج","ذي الحجة","عرفة","أضحية"], tag: "hajj_topic" },
];

function matchTags(text, allTags) {
  if (!text) return [];
  const lower = text.toLowerCase().replace(/ال/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
  const matched = new Set();
  for (const { keywords, tag } of KEYWORD_TAG_MAP) {
    for (const kw of keywords) {
      const kwNorm = kw.replace(/ال/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
      if (lower.includes(kwNorm)) {
        matched.add(tag);
        break;
      }
    }
  }
  return [...matched];
}

async function run() {
  const client = new Client(buildConfig(DB_URL));
  await client.connect();
  console.log("✅ متصل بقاعدة البيانات\n");

  // ── 1. إنشاء الوسوم ─────────────────────────────────────────────────────
  console.log("📌 إنشاء الوسوم الأساسية...");
  let tagsCreated = 0;

  for (const tag of SEED_TAGS) {
    await client.query(`
      INSERT INTO content_tags (tag_name, tag_name_ar, tag_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (tag_name) DO NOTHING
    `, [tag.tag_name, tag.tag_name_ar, tag.tag_type]);
    tagsCreated++;
  }

  // جلب كل الوسوم مع IDs
  const { rows: allTags } = await client.query(`SELECT id, tag_name FROM content_tags`);
  const tagByName = Object.fromEntries(allTags.map((t) => [t.tag_name, t.id]));
  console.log(`   ✅ ${tagsCreated} وسم جاهز (${allTags.length} إجمالي)\n`);

  // ── 2. ربط الدروس بالوسوم ────────────────────────────────────────────────
  await seedContentTags(client, tagByName, "lessons", "lesson", (r) =>
    `${r.title || ""} ${r.category || ""} ${(r.keywords || []).join(" ")}`
  );

  // ── 3. ربط الأحاديث بالوسوم ──────────────────────────────────────────────
  await seedContentTags(client, tagByName, "verified_hadith_items", "hadith", (r) =>
    `${r.title || ""} ${r.text?.slice(0, 200) || ""} ${(r.keywords || []).join(" ")} ${r.chapter || ""}`
  );

  // ── 4. ربط الفتاوى بالوسوم ───────────────────────────────────────────────
  await seedContentTags(client, tagByName, "fatwas", "fatwa", (r) =>
    `${r.question || ""} ${r.category || ""} ${(r.keywords || []).join(" ")}`
  );

  // ── 5. ربط الفوائد بالوسوم ────────────────────────────────────────────────
  await seedContentTags(client, tagByName, "fawaid", "benefit", (r) =>
    `${r.text || ""} ${r.category || ""} ${r.topic || ""}`
  );

  // ── 6. ربط الكتب بالوسوم ──────────────────────────────────────────────────
  await seedContentTags(client, tagByName, "library_items", "book", (r) =>
    `${r.title || ""} ${r.category || ""} ${(r.keywords || []).join(" ")}`
  );

  // ── 7. ربط المعجزات العلمية ───────────────────────────────────────────────
  await seedContentTags(client, tagByName, "scientific_miracles", "miracle", (r) =>
    `${r.title || ""} ${r.category || ""} ${r.body?.slice(0, 200) || ""}`,
    "miracles"  // وسم افتراضي
  );

  // ── 8. إنشاء علاقات المحتوى (content_relationships) ─────────────────────
  console.log("\n🔗 إنشاء علاقات المحتوى (نفس الوسوم)...");
  let relCreated = 0;

  // ربط المحتوى الذي يشترك في نفس الوسوم
  const { rows: tagRels } = await client.query(`
    SELECT DISTINCT
      a.content_id AS src_id, a.content_type AS src_type,
      b.content_id AS tgt_id, b.content_type AS tgt_type,
      COUNT(a.tag_id) AS shared_tags
    FROM content_tag_relations a
    JOIN content_tag_relations b ON a.tag_id = b.tag_id
      AND (a.content_id != b.content_id OR a.content_type != b.content_type)
    GROUP BY a.content_id, a.content_type, b.content_id, b.content_type
    HAVING COUNT(a.tag_id) >= 2
    LIMIT 2000
  `);

  for (const rel of tagRels) {
    const weight = Math.min(0.3 + rel.shared_tags * 0.1, 0.9);
    await client.query(`
      INSERT INTO content_relationships (source_id, source_type, target_id, target_type, relationship_type, weight)
      VALUES ($1, $2, $3, $4, 'thematic', $5)
      ON CONFLICT (source_id, source_type, target_id, target_type) DO NOTHING
    `, [rel.src_id, rel.src_type, rel.tgt_id, rel.tgt_type, weight]);
    relCreated++;
  }

  console.log(`   ✅ ${relCreated} علاقة تلقائية من مشاركة الوسوم\n`);

  // ── ملخص ─────────────────────────────────────────────────────────────────
  const { rows: counts } = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM content_tags)          AS tags,
      (SELECT COUNT(*) FROM content_tag_relations) AS tag_rels,
      (SELECT COUNT(*) FROM content_relationships) AS relationships
  `);
  console.log("─".repeat(50));
  console.log(`📋 النتيجة النهائية:`);
  console.log(`   الوسوم:            ${counts[0].tags}`);
  console.log(`   ربط الوسوم:        ${counts[0].tag_rels}`);
  console.log(`   العلاقات:          ${counts[0].relationships}`);
  console.log("─".repeat(50));

  await client.end();
  console.log("\n✅ اكتمل بذر بيانات التوصيات");
}

async function seedContentTags(client, tagByName, tableName, contentType, textExtractor, defaultTag = null) {
  console.log(`📎 ${tableName} → ${contentType}...`);
  let added = 0;

  try {
    const { rows } = await client.query(`SELECT * FROM ${tableName} LIMIT 1000`);
    for (const row of rows) {
      const text = textExtractor(row);
      const matchedTagNames = matchTags(text, tagByName);

      if (defaultTag && !matchedTagNames.length) matchedTagNames.push(defaultTag);
      if (!matchedTagNames.length) continue;

      for (const tagName of matchedTagNames) {
        const tagId = tagByName[tagName];
        if (!tagId) continue;

        await client.query(`
          INSERT INTO content_tag_relations (content_id, content_type, tag_id, weight)
          VALUES ($1, $2, $3, 1.0)
          ON CONFLICT (content_id, content_type, tag_id) DO NOTHING
        `, [String(row.id), contentType, tagId]);
        added++;
      }
    }
    console.log(`   ✅ ${rows.length} سجل → ${added} ربط وسم`);
  } catch (err) {
    if (err.message.includes("does not exist")) {
      console.log(`   ⏭️ الجدول غير موجود — تخطي`);
    } else {
      console.log(`   ⚠️ ${err.message.split("\n")[0]}`);
    }
  }
}

run().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
