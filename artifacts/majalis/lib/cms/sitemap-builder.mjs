/**
 * Dynamic sitemap + RSS from live Supabase (no build snapshot).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "../..");

function loadSeoConfig() {
  try {
    const raw = readFileSync(join(APP_ROOT, "src/lib/seo-routes.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return { siteUrl: "https://www.ssunnah.com", routes: [] };
  }
}

function escapeXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function fetchDynamicUrls() {
  const admin = getSupabaseAdmin();
  const urls = [];

  // ── بيانات ثابتة: التاريخ الإسلامي والكتب من JSON ──
  const historyFiles = [
    "seerah.json", "rashidun.json", "umayyad.json", "abbasid.json", "andalus.json",
    "seljuk-ayyubid.json", "mamluk.json", "ottoman.json", "civilization.json", "personalities.json",
  ];
  for (const file of historyFiles) {
    try {
      const items = JSON.parse(readFileSync(join(APP_ROOT, `src/data/islamic-history/${file}`), "utf8"));
      for (const item of items) {
        urls.push({ loc: `/tarikh-islami/${item.id}`, priority: 0.76, changefreq: "monthly" });
      }
    } catch { /* optional */ }
  }

  // المكتبة العامة أُزيلت من الواجهة وSEO — لا تُدرَج /library في الخريطة
  // (المسارات القديمة تُحوَّل إلى /search عبر vercel + AppRoutes).

  // اكتُشف 2026-07-18: جدول fiqh_council_sessions غير موجود في القاعدة الحية.
  // منتج المجمع/القرارات أُزيل — لا تُدرَج جلسات أو قرارات من كاتالوج أو جداول council.
  // مرآة fiqh-sessions-list.json فارغة عمدًا؛ لا روابط ميتة في الخريطة.

  if (!admin) return urls;

  const [
    lessons, updates, learningPaths,
    rulings, universities, annualCourses,
  ] = await Promise.all([
    admin.from("lessons").select("id, updated_at, slug").eq("status", "approved").limit(2000),
    // ملاحظة (2026-07-26، تدقيق جدول fawaid): استعلام fawaid أُزيل من هنا
    // لسببين معًا — (١) لا مسار `/fawaid/:id` في src/App.tsx إطلاقًا (المسار
    // الوحيد هو `/fawaid` صفحة القائمة)، فكل رابط كان سيُولَّد هنا هو 404
    // لمحركات البحث؛ نفس قرار إزالة fatwas أعلاه. (٢) لا عمود updated_at في
    // جدول fawaid أصلًا، فالاستعلام كان يفشل صامتًا (42703) ولا يُنتج شيئًا.
    // ملاحظة: استعلام fatwas أُزيل هنا (2026-07-18) — قسم الفتوى حُذف من
    // التطبيق بالكامل في جلسة سابقة، و/fatwa و/fatwa/:id في src/App.tsx
    // كليهما مجرد Redirect (لـ/fiqh و/rulings على التوالي) لا صفحة حقيقية،
    // فإدراج روابطهما في sitemap.xml كان سيُرسِل محركات البحث لروابط
    // تُعيد التوجيه فوراً بلا فائدة (جدول fatwas نفسه فارغ حالياً 0 صف
    // approved، فلم يكن هذا يُنتج روابط فعلية بعد، لكنه كود ميت يستحق
    // الإزالة قبل أن يُضاف محتوى للجدول بالخطأ مستقبلاً).
    admin.from("platform_updates").select("id, updated_at").eq("status", "approved").limit(200),
    // اكتُشف 2026-07-18: /learning/paths/:slug (كل الـ15 مساراً التعليمية
    // المبنية بكثافة هذه الجلسة) كانت غائبة تماماً عن sitemap.xml الحي —
    // seo-routes.json (المصدر الثابت لـbuildSitemapXml) لا يحوي أي إدخال
    // فردي لمسار، وfetchDynamicUrls لم يكن يستعلم جدول learning_paths
    // إطلاقاً. تحقَّق مباشرة من https://majlisilm.com/sitemap.xml
    // الحي: يحوي فقط /learning/paths (الفهرس) بلا أي مسار فردي. أُضيف
    // استعلام حي هنا (لا مرآة ثابتة) ليبقى متزامناً تلقائياً مع أي مسار
    // جديد يُنشَر مستقبلاً.
    admin.from("learning_paths").select("id, slug, updated_at").eq("status", "published").limit(200),
    // اكتُشف 2026-07-18 (بمتابعة نفس التدقيق): محتوى حي آخر له صفحات
    // تفصيل فعلية (*DetailPage.tsx حقيقية في src/views) لكن لم يكن أيٌّ
    // منها مُستعلَماً هنا — أكبرها موسوعة الأحكام. شروط الفلترة
    // مطابقة حرفياً لسياسات RLS/الخدمات الحية المستهلِكة لكل جدول.
    // جداول fiqh_council_* أُزيلت من الخريطة والتغذية — المنتج ملغى.
    // /sheikhs و /qa لا تُدرَج في الخريطة — لا استعلام بلا استخدام.
    admin.from("sharia_rulings").select("id, updated_at").eq("status", "approved").limit(1000),
    admin.from("universities").select("id, slug, updated_at").eq("is_published", true).limit(100),
    admin.from("annual_courses").select("id, external_key, updated_at").eq("status", "approved").limit(100),
  ]);

  for (const row of lessons.data || []) {
    const lessonId = row.external_key || row.slug || row.id;
    urls.push({ loc: `/lessons/${lessonId}`, lastmod: row.updated_at, priority: 0.85 });
  }
  // /sheikhs أُلغيت لصالح /lessons — لا تُدرَج في الخريطة
  // /library أُزيلت علنًا — لا تُدرَج من library_items
  // /qa دُمجت في /quiz — لا تُدرَج مسارات أسئلة منفردة
  for (const row of updates.data || []) {
    urls.push({ loc: `/updates/${row.id}`, lastmod: row.updated_at, priority: 0.65 });
  }
  for (const row of learningPaths.data || []) {
    urls.push({ loc: `/learning/paths/${row.slug || row.id}`, lastmod: row.updated_at, priority: 0.7 });
  }
  for (const row of rulings.data || []) {
    urls.push({ loc: `/rulings/${row.id}`, lastmod: row.updated_at, priority: 0.7 });
  }
  for (const row of universities.data || []) {
    urls.push({ loc: `/universities/${row.slug || row.id}`, lastmod: row.updated_at, priority: 0.65 });
  }
  for (const row of annualCourses.data || []) {
    urls.push({ loc: `/annual-courses/${row.external_key || row.id}`, lastmod: row.updated_at, priority: 0.65 });
  }

  return urls;
}

export async function buildSitemapXml() {
  const config = loadSeoConfig();
  const base = config.siteUrl.replace(/\/+$/, "");
  const staticRoutes = (config.routes || []).filter((r) => r.sitemap !== false);

  const dynamic = await fetchDynamicUrls();
  const seen = new Set();

  const entries = [];
  for (const r of staticRoutes) {
    const loc = `${base}${r.path}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    entries.push({
      loc,
      priority: r.priority ?? 0.5,
      changefreq: r.changefreq || "weekly",
    });
  }

  for (const d of dynamic) {
    const loc = `${base}${d.loc}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    entries.push({
      loc,
      priority: d.priority ?? 0.6,
      changefreq: "weekly",
      lastmod: d.lastmod ? new Date(d.lastmod).toISOString().slice(0, 10) : undefined,
    });
  }

  const body = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${Number(e.priority).toFixed(2)}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export async function buildFeedXml() {
  const config = loadSeoConfig();
  const base = config.siteUrl.replace(/\/+$/, "");
  const admin = getSupabaseAdmin();

  // منتج المجمع/القرارات أُزيل — التغذية تعرض دروسًا ودورات فقط (بلا قرارات مجمعيّة).
  let entries = [];
  if (admin) {
    const [lessons, courses] = await Promise.all([
      admin
        .from("lessons")
        .select("id, title, description, updated_at, slug")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(30),
      admin
        .from("annual_courses")
        .select("id, title, summary, updated_at, created_at, external_key")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

    entries = [
      ...(lessons.data || []).map((row) => ({
        title: row.title,
        link: `${base}/lessons/${row.slug || row.id}`,
        description: row.description || "",
        date: row.updated_at,
      })),
      ...(courses.data || []).map((row) => ({
        title: `[دورة علمية] ${row.title}`,
        link: `${base}/annual-courses/${row.external_key || row.id}`,
        description: row.summary || "",
        date: row.updated_at || row.created_at,
      })),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  const rssItems = entries
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml((item.description || "").slice(0, 300))}</description>
      <pubDate>${item.date ? new Date(item.date).toUTCString() : new Date().toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.siteName || "سُنّة")}</title>
    <link>${escapeXml(base)}</link>
    <description>آخر الإضافات العلمية — دروس ودورات موثّقة</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;
}
