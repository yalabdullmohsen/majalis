#!/usr/bin/env node
/**
 * build-search-index.ts
 * سكريبت تعبئة فهارس البحث الموحدة (idempotent)
 *
 * الاستخدام:
 *   cd artifacts/majalis
 *   source .env
 *   npx tsx scripts/build-search-index.ts
 *
 * ملاحظة: يتطلب DATABASE_URL في .env
 * الأعمدة المولَّدة تلقائياً (GENERATED ALWAYS AS) لا تحتاج تعبئة يدوية —
 * هذا السكريبت يتحقق من صحة الفهارس ويُبلغ عن الإحصاءات.
 */

import { createClient } from "@supabase/supabase-js";

// ─── إعداد الاتصال ─────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ يجب ضبط VITE_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── جداول الفهرسة ──────────────────────────────────────────────────────────

const TABLES = [
  {
    name: "lessons",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "approved",
    idCol: "id",
    label: "الدروس",
  },
  {
    name: "library_items",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "approved",
    idCol: "id",
    label: "المكتبة",
  },
  {
    name: "scientific_miracles",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "approved",
    idCol: "id",
    label: "الإعجاز العلمي",
  },
  {
    name: "fawaid",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "approved",
    idCol: "id",
    label: "الفوائد",
  },
  {
    name: "qa_questions",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "published",
    idCol: "id",
    label: "الأسئلة والأجوبة",
  },
  {
    name: "verified_hadith_items",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "published",
    idCol: "id",
    label: "الأحاديث الصحيحة",
  },
  {
    name: "akp_stories",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "published",
    idCol: "id",
    label: "القصص الإسلامية",
  },
  {
    name: "sheikhs",
    searchCol: "search_text",
    statusCol: null,
    statusValue: null,
    idCol: "id",
    label: "العلماء والمشايخ",
  },
  {
    name: "fiqh_council_items",
    searchCol: "search_text",
    statusCol: "status",
    statusValue: "published",
    idCol: "slug",
    label: "المجمع الفقهي",
  },
] as const;

// ─── دالة التحقق من جدول ───────────────────────────────────────────────────

async function verifyTable(table: (typeof TABLES)[number]): Promise<{
  ok: boolean;
  total: number;
  indexed: number;
  missing: number;
  label: string;
}> {
  const result = { ok: false, total: 0, indexed: 0, missing: 0, label: table.label };

  try {
    // العدد الكلي (المعتمد فقط)
    let totalQuery = supabase.from(table.name).select("*", { count: "exact", head: true });
    if (table.statusCol && table.statusValue) {
      totalQuery = totalQuery.eq(table.statusCol, table.statusValue);
    }
    const { count: total, error: totalErr } = await totalQuery;
    if (totalErr) {
      console.warn(`  ⚠️ ${table.label}: ${totalErr.message}`);
      return result;
    }
    result.total = total ?? 0;

    // العدد ذو الفهرس غير الفارغ
    let indexedQuery = supabase
      .from(table.name)
      .select("*", { count: "exact", head: true })
      .not(table.searchCol, "is", null);
    if (table.statusCol && table.statusValue) {
      indexedQuery = indexedQuery.eq(table.statusCol, table.statusValue);
    }
    const { count: indexed, error: indexedErr } = await indexedQuery;
    if (indexedErr) {
      // العمود قد لا يكون موجوداً بعد — المعتاد إذا لم يُطبَّق الـ migration
      if (indexedErr.code === "42703") {
        console.warn(`  ⚠️ ${table.label}: عمود search_text غير موجود — طبّق unified_search_index_v1.sql أولاً`);
      } else {
        console.warn(`  ⚠️ ${table.label}: ${indexedErr.message}`);
      }
      return result;
    }
    result.indexed = indexed ?? 0;
    result.missing = result.total - result.indexed;
    result.ok = result.missing === 0;
    return result;
  } catch (err) {
    console.error(`  ❌ ${table.label}:`, err);
    return result;
  }
}

// ─── التحقق من quran_search_index ─────────────────────────────────────────

async function verifyQuranIndex(): Promise<void> {
  console.log("\n📖 التحقق من quran_search_index...");
  const { count, error } = await supabase
    .from("quran_search_index")
    .select("*", { count: "exact", head: true });

  if (error) {
    if (error.code === "42P01") {
      console.log("  ⚠️  الـ view غير موجودة — طبّق unified_search_index_v1.sql");
    } else {
      console.log("  ⚠️  خطأ:", error.message);
    }
    return;
  }
  console.log(`  ✓ quran_search_index: ${count ?? 0} آية مفهرسة`);
  console.log("  ملاحظة: القرآن يأتي من api.alquran.cloud — الفهرس المحلي للنسخ المخزَّنة فقط");
}

// ─── التقرير النهائي ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("════════════════════════════════════════════════════════════");
  console.log("  مجالس العلم — بناء فهرس البحث الموحد");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`  الوقت: ${new Date().toISOString()}`);
  console.log("  الأعمدة مولَّدة تلقائياً (GENERATED ALWAYS AS) — التحقق فقط\n");

  const results = await Promise.all(TABLES.map(verifyTable));

  let totalOk = 0;
  let totalFail = 0;

  console.log("الجدول                    | المعتمد | مفهرس | ناقص | الحالة");
  console.log("─────────────────────────┼─────────┼───────┼──────┼────────");

  for (const r of results) {
    const label = r.label.padEnd(24);
    const total = String(r.total).padStart(7);
    const indexed = String(r.indexed).padStart(5);
    const missing = String(r.missing).padStart(4);
    const status = r.ok ? "✓ OK" : r.total === 0 ? "─ فارغ" : "⚠ ناقص";
    console.log(`${label} | ${total} | ${indexed} | ${missing} | ${status}`);
    if (r.ok || r.total === 0) totalOk++;
    else totalFail++;
  }

  await verifyQuranIndex();

  console.log("\n════════════════════════════════════════════════════════════");
  console.log(`  النتيجة: ${totalOk} ✓ نجح | ${totalFail} ⚠ يحتاج مراجعة`);
  if (totalFail > 0) {
    console.log("  تلميح: تأكد من تطبيق unified_search_index_v1.sql في Supabase");
    console.log("         ثم أعد تشغيل هذا السكريبت للتحقق.");
  } else {
    console.log("  ✓ جميع فهارس البحث جاهزة");
  }
  console.log("════════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("خطأ فادح:", err);
  process.exit(1);
});
