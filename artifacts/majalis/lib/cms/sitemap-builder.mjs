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
    return { siteUrl: "https://www.majlisilm.com", routes: [] };
  }
}

function escapeXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadStaticCatalog(filename) {
  try {
    return JSON.parse(readFileSync(join(APP_ROOT, `src/data/${filename}`), "utf8"));
  } catch {
    return [];
  }
}

export async function fetchDynamicUrls() {
  const admin = getSupabaseAdmin();
  const urls = [];

  // ── بيانات ثابتة: العلماء والكتب من JSON ──
  const scholars = loadStaticCatalog("scholars-list.json");
  for (const s of scholars) {
    urls.push({ loc: `/scholars/${s.id}`, priority: 0.76, changefreq: "monthly" });
  }

  const books = loadStaticCatalog("library-catalog.json");
  for (const b of books) {
    urls.push({ loc: `/library/${b.id}`, priority: 0.72, changefreq: "weekly" });
  }

  if (!admin) return urls;

  const [lessons, sheikhs, library, qa, fawaid, updates, learningPaths] = await Promise.all([
    admin.from("lessons").select("id, updated_at, slug").eq("status", "approved").limit(2000),
    admin.from("sheikhs").select("id, updated_at").eq("is_verified", true).limit(500),
    admin.from("library_items").select("id, updated_at").eq("status", "approved").limit(500),
    admin.from("qa_questions").select("id, updated_at").eq("status", "published").limit(500),
    admin.from("fawaid").select("id, updated_at").eq("status", "approved").limit(500),
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
    // إطلاقاً. تحقَّق مباشرة من https://www.majlisilm.com/sitemap.xml
    // الحي: يحوي فقط /learning/paths (الفهرس) بلا أي مسار فردي. أُضيف
    // استعلام حي هنا (لا مرآة ثابتة) ليبقى متزامناً تلقائياً مع أي مسار
    // جديد يُنشَر مستقبلاً.
    admin.from("learning_paths").select("id, slug, updated_at").eq("status", "published").limit(200),
  ]);

  for (const row of lessons.data || []) {
    urls.push({ loc: `/lessons/${row.slug || row.id}`, lastmod: row.updated_at, priority: 0.85 });
  }
  for (const row of sheikhs.data || []) {
    urls.push({ loc: `/sheikhs/${row.id}`, lastmod: row.updated_at, priority: 0.75 });
  }
  for (const row of library.data || []) {
    urls.push({ loc: `/library/${row.id}`, lastmod: row.updated_at, priority: 0.72 });
  }
  for (const row of qa.data || []) {
    urls.push({ loc: `/qa/${row.id}`, lastmod: row.updated_at, priority: 0.72 });
  }
  for (const row of fawaid.data || []) {
    urls.push({ loc: `/fawaid/${row.id}`, lastmod: row.updated_at, priority: 0.68 });
  }
  for (const row of updates.data || []) {
    urls.push({ loc: `/updates/${row.id}`, lastmod: row.updated_at, priority: 0.65 });
  }
  for (const row of learningPaths.data || []) {
    urls.push({ loc: `/learning/paths/${row.slug || row.id}`, lastmod: row.updated_at, priority: 0.7 });
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

  // اكتُشف 2026-07-18: وصف القناة أدناه يَعِد بـ"دروس وفتاوى وقرارات" لكن
  // التنفيذ كان يجلب الدروس فقط — انحراف حي بين القناة ومحتواها لا علاقة
  // له بأي لقطة JSON مجمَّدة (buildFeedXml لم يقرأ قط ملفاً ثابتاً)، لكنه
  // نفس فئة العطل الأعمق: مصدر محتوى حي (fiqh_council_issues) موعود به
  // في الواجهة لكنه غير مُستعلَم إطلاقاً. أُضيف هنا مطابقاً لنفس شروط
  // الفلترة الحية المُستخدَمة في fiqh-council-issues-service.ts
  // (status='published' + documentation_level='official_verified') وفي
  // platform-content-service.ts للدورات (status='approved').
  let entries = [];
  if (admin) {
    const [lessons, fiqhIssues, courses] = await Promise.all([
      admin
        .from("lessons")
        .select("id, title, description, updated_at, slug")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(30),
      admin
        .from("fiqh_council_issues")
        .select("id, title, summary, published_at, updated_at, slug")
        .eq("status", "published")
        .eq("documentation_level", "official_verified")
        .order("published_at", { ascending: false })
        .limit(10),
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
      ...(fiqhIssues.data || []).map((row) => ({
        title: `[قرار مجمعي] ${row.title}`,
        link: `${base}/fiqh-council/issues/${row.slug || row.id}`,
        description: row.summary || "",
        date: row.published_at || row.updated_at,
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
    <title>${escapeXml(config.siteName || "المجلس العلمي")}</title>
    <link>${escapeXml(base)}</link>
    <description>آخر الإضافات العلمية — دروس وفتاوى وقرارات</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;
}
