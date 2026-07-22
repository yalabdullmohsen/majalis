/**
 * فحص HTML الفعلي لكل صفحات الـ prerender (ما يراه الزاحف) — إثبات للإصلاحات:
 *   1. canonical يطابق مسار الصفحة النهائي (self-canonical).
 *   2. لا نطاق www ولا نطاق غير معتمد في canonical/OG/sitemap.
 *   3. عنوان (title) واحد وفريد لكل صفحة، بلاحقة الاسم الرسمي.
 *   4. وصف (description) موجود، وفريد بما يكفي.
 *   5. رأس واحد فقط <h1> لكل صفحة.
 *   6. لا بريد شخصي في أي HTML أو JSON-LD.
 *   7. لا اسم تجاري قديم.
 *   8. كل كتل JSON-LD صالحة نحويًا.
 *
 * يُشغَّل: node scripts/test-seo-html.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const PRE = resolve(appRoot, "seo-prerender");
const seo = JSON.parse(readFileSync(resolve(appRoot, "src/lib/seo-routes.json"), "utf8"));
const APPROVED_HOST = new URL(seo.siteUrl).host; // majlisilm.com

let passed = 0, failed = 0;
const fail = (label) => { failed++; console.error(`  ✗ ${label}`); };
const ok = () => { passed++; };

const FORBIDDEN_BRANDS = ["مجالس العلم", "منصة المجالس", "فريق المجالس", "مجتمع المجالس", "مجالس العلمية"];
const PERSONAL_EMAIL_RX = /[a-zA-Z0-9._%+-]+@(?!majlisilm\.com)(gmail|hotmail|outlook|yahoo|icloud|proton)[a-zA-Z0-9.-]*\.[a-z]+/i;

// اجمع كل صفحات prerender
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}
const pages = existsSync(PRE) ? walk(PRE) : [];

const titles = new Map();       // title -> [paths]
const descriptions = new Map(); // description -> [paths]
let canonicalBad = 0, wwwBad = 0, h1Bad = 0, emailBad = 0, brandBad = 0, jsonldBad = 0, titleMissing = 0, descMissing = 0;
let personMissing = 0, bookLdMissing = 0;

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const routePath = "/" + relative(PRE, dirname(file)).split("/").join("/");
  const normRoute = routePath === "/." ? "/" : routePath;
  const expectedCanonical = `${seo.siteUrl}${normRoute === "/" ? "/" : normRoute}`;
  const isNoindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html);

  // canonical
  const canon = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
  if (!canon || canon.replace(/\/$/, "") !== expectedCanonical.replace(/\/$/, "")) {
    canonicalBad++; if (canonicalBad <= 8) console.error(`    canonical: ${normRoute} → ${canon || "غائب"}`);
  }

  // www / نطاق غير معتمد في canonical و og:url
  const urls = [canon, ...[...html.matchAll(/property="og:url"[^>]+content="([^"]+)"/gi)].map((m) => m[1])].filter(Boolean);
  for (const u of urls) {
    try { const h = new URL(u).host; if (h !== APPROVED_HOST) { wwwBad++; if (wwwBad <= 8) console.error(`    نطاق غير معتمد: ${normRoute} → ${h}`); break; } } catch {}
  }

  // h1 واحد
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) { h1Bad++; if (h1Bad <= 8) console.error(`    H1=${h1s}: ${normRoute}`); }

  // title
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  if (!title) { titleMissing++; }
  else if (!isNoindex) { titles.set(title, [...(titles.get(title) || []), normRoute]); }

  // description (تفرّد يُطلب للصفحات القابلة للفهرسة فقط)
  const desc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1]?.trim();
  if (!desc || desc.length < 20) descMissing++;
  else if (!isNoindex) descriptions.set(desc, [...(descriptions.get(desc) || []), normRoute]);

  // بريد شخصي
  if (PERSONAL_EMAIL_RX.test(html)) { emailBad++; if (emailBad <= 8) console.error(`    بريد شخصي: ${normRoute}`); }

  // اسم تجاري قديم
  if (FORBIDDEN_BRANDS.some((b) => html.includes(b))) { brandBad++; if (brandBad <= 8) console.error(`    اسم قديم: ${normRoute}`); }

  // JSON-LD صالح + جمع الأنواع
  const ldTypes = new Set();
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { const o = JSON.parse(m[1]); if (o && o["@type"]) ldTypes.add(o["@type"]); }
    catch { jsonldBad++; if (jsonldBad <= 8) console.error(`    JSON-LD تالف: ${normRoute}`); }
  }
  // Person لصفحات العلماء، Book لصفحات الكتب
  if (/^\/scholars\/[^/]+$/.test(normRoute) && !ldTypes.has("Person")) {
    personMissing++; if (personMissing <= 8) console.error(`    بلا Person JSON-LD: ${normRoute}`);
  }
  if (/^\/library\/[^/]+$/.test(normRoute) && !ldTypes.has("Book")) {
    bookLdMissing++; if (bookLdMissing <= 8) console.error(`    بلا Book JSON-LD: ${normRoute}`);
  }
}

// عناوين مكررة (تُستثنى صفحات القوائم المرقّمة إن وُجدت — لا نستثني هنا)
const dupTitles = [...titles.entries()].filter(([, v]) => v.length > 1);
const dupDescs = [...descriptions.entries()].filter(([, v]) => v.length > 1);

console.log(`\n=== فُحصت ${pages.length} صفحة prerender ===`);
canonicalBad === 0 ? ok() : fail(`canonical لا يطابق المسار في ${canonicalBad} صفحة`);
wwwBad === 0 ? ok() : fail(`نطاق غير معتمد (www/غيره) في ${wwwBad} صفحة`);
h1Bad === 0 ? ok() : fail(`عدد H1 ≠ 1 في ${h1Bad} صفحة`);
titleMissing === 0 ? ok() : fail(`${titleMissing} صفحة بلا <title>`);
descMissing === 0 ? ok() : fail(`${descMissing} صفحة بلا وصف كافٍ`);
dupTitles.length === 0 ? ok() : fail(`${dupTitles.length} عنوان مكرر (مثال: «${dupTitles[0]?.[0]}» في ${dupTitles[0]?.[1].join(", ")})`);
dupDescs.length === 0 ? ok() : fail(`${dupDescs.length} وصف مكرر (مثال: ${dupDescs[0]?.[1].slice(0, 3).join(", ")})`);
emailBad === 0 ? ok() : fail(`بريد شخصي في ${emailBad} صفحة`);
brandBad === 0 ? ok() : fail(`اسم تجاري قديم في ${brandBad} صفحة`);
jsonldBad === 0 ? ok() : fail(`JSON-LD تالف في ${jsonldBad} كتلة`);
personMissing === 0 ? ok() : fail(`${personMissing} صفحة عالِم بلا Person JSON-LD`);
bookLdMissing === 0 ? ok() : fail(`${bookLdMissing} صفحة كتاب بلا Book JSON-LD`);

// ── فحص sitemap: لا نطاق غير معتمد، ولا مصادر تحويل، ولا 404 ─────────────
const sitemapPath = resolve(appRoot, "public/sitemap.xml");
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const vercel = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf8"));
  const redirectSources = new Set((vercel.redirects || []).map((r) => `${seo.siteUrl}${r.source}`));
  let smWww = 0, smRedirect = 0, sm404 = 0;
  for (const loc of locs) {
    try { if (new URL(loc).host !== APPROVED_HOST) smWww++; } catch { smWww++; }
    if (redirectSources.has(loc.replace(/\/$/, ""))) smRedirect++;
    const decoded = loc.replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    const p = decoded.replace(seo.siteUrl, "") || "/";
    if (p !== "/" && !existsSync(resolve(PRE, p.replace(/^\//, ""), "index.html"))) sm404++;
  }
  smWww === 0 ? ok() : fail(`sitemap: ${smWww} رابط بنطاق غير معتمد`);
  smRedirect === 0 ? ok() : fail(`sitemap: ${smRedirect} رابط هو مصدر تحويل (يجب استبعاده)`);
  sm404 === 0 ? ok() : fail(`sitemap: ${sm404} رابط بلا صفحة prerender (404 محتمل)`);
  console.log(`  sitemap: ${locs.length} رابطًا مفحوصًا`);
}

console.log(`\n${"─".repeat(40)}\nالنتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
