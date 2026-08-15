#!/usr/bin/env node
/**
 * بوابة تدقيق الأمم السابقة + الذين ذكروا في القرآن (SEO + بيانات).
 * التشغيل: node --import tsx scripts/test-nations-quran-people-audit.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { NATIONS } = await import(resolve(root, "src/lib/nations-seed.ts"));

const peoplePath = resolve(root, "public/data/quran-people/people.json");
const catalog = JSON.parse(readFileSync(peoplePath, "utf8"));
const people = catalog.people || [];
const published = people.filter((p) => p.status === "published");

const REQUIRED_NATION_NAMES = [
  "قوم نوح",
  "عاد",
  "ثمود",
  "قوم إبراهيم",
  "قوم لوط",
  "أهل مَدْيَن وأصحاب الأيكة",
  "قوم فرعون والملأ",
  "بنو إسرائيل",
  "أصحاب السبت",
  "أصحاب القرية",
  "أصحاب الرَّسّ",
  "قوم تُبَّع",
  "سَبَأ",
  "أصحاب الجنة",
  "أصحاب الفيل",
  "يأجوج ومأجوج",
  "القرون والأمم التي لم تُسمَّ",
];

const LOCATION_OK = /تقريبي|لا يُجزم|غير محدد|لم يُعيَّن|لم تُسمَّ|ليس في نص|لم يرد تعيين/;
const PLACE_NEEDS_MARKER = /على المشهور|موقع تقريبي|approx|إحداث|مدائن|مأرب|البدع|الأحقاف|الحِجر|مَدْين/;
const ISRAILIYAT_AS_FACT =
  /الإسرائيليات(?![^.]{0,80}(لا يُعتمد|لا يُبنى|لم يثبت|لا تُصدَّق|لا تُذكر كحقيقة|للتوقف|لا يعتمد))/;
const HARUT_EXPANSION = /هبوط|زُهرة|عقوبة الملك|المرأة|الزنا|معلّقين|بابل.*قصّة/;

let fails = 0;
function check(cond, msg) {
  if (!cond) {
    fails += 1;
    console.error(`✗ ${msg}`);
  } else {
    console.log(`✓ ${msg}`);
  }
}

/* ── 1) تغطية الأمم ───────────────────────────────────────── */
check(NATIONS.length >= 17, `عدد الأمم ≥ 17 (الآن ${NATIONS.length})`);
for (const name of REQUIRED_NATION_NAMES) {
  check(
    NATIONS.some((n) => n.name === name || n.aliases?.includes(name)),
    `أمة مطلوبة موجودة: ${name}`,
  );
}

const firaun = NATIONS.find((n) => n.slug === "qawm-firaun");
check(!!firaun, "قوم فرعون موجود");
check(
  /الناجون من الغرق/.test(firaun?.survivors || "") && /المؤمنون المذكورون/.test(firaun?.survivors || ""),
  "قوم فرعون يفصل الناجين من الغرق عن المؤمنين المذكورين",
);

const nationsUi = readFileSync(resolve(root, "src/views/NationsPage.tsx"), "utf8");
check(
  /بالآيات، وما صح من السنة عند وجوده/.test(nationsUi),
  "عبارة المنهجية الصحيحة في صفحة الأمم",
);
check(!/بالآيات والأحاديث الصحيحة/.test(nationsUi), "لا تعميم «بالآيات والأحاديث الصحيحة» على القسم");

/* ── 2) مواقع تقريبية ─────────────────────────────────────── */
for (const n of NATIONS) {
  if (n.approxLocation?.label) {
    check(
      LOCATION_OK.test(n.approxLocation.label),
      `approxLocation لـ ${n.slug} يذكر تقريبي/لا يُجزم`,
    );
  }
  if (PLACE_NEEDS_MARKER.test(n.place || "")) {
    check(LOCATION_OK.test(n.place), `مكان ${n.slug} يحمل تنبيه تقريبي/عدم جزم`);
  }
}

/* ── 3) لا إسرائيليات كحقائق ───────────────────────────────── */
let israilHits = [];
for (const n of NATIONS) {
  for (const ch of n.chapters || []) {
    for (const para of ch.body || []) {
      if (ISRAILIYAT_AS_FACT.test(para)) israilHits.push(`${n.slug}:${ch.id}`);
    }
  }
  for (const row of n.establishedVsDisputed || []) {
    if (row.status === "ثابت" && /إسرائيل/.test(`${row.claim} ${row.note || ""}`)) {
      israilHits.push(`${n.slug}:ثابت-إسرائيلي`);
    }
  }
}
check(israilHits.length === 0, `لا إسرائيليات منشورة كحقائق${israilHits.length ? ` — ${israilHits.slice(0, 5).join(", ")}` : ""}`);

/* ── 4) الذين ذكروا في القرآن ─────────────────────────────── */
check(published.length >= 41, `شخصيات منشورة ≥ 41 بعد آزر (الآن ${published.length})`);
const azar = published.find((p) => p.slug === "azar");
check(!!azar, "آزر منشور في /quran/people");
check(azar?.nameAr === "آزر", "اسم آزر عربي صحيح");
check(Array.isArray(azar?.occurrences) && azar.occurrences.some((o) => o.surah === 6 && o.ayah === 74), "آزر: الأنعام 74");

for (const p of published) {
  check(Array.isArray(p.occurrences) && p.occurrences.length > 0, `${p.slug}: له occurrences`);
  for (const o of p.occurrences || []) {
    check(Number.isFinite(o.surah) && o.surah >= 1 && o.surah <= 114, `${p.slug}: surah صالح`);
    check(Number.isFinite(o.ayah) && o.ayah >= 1, `${p.slug}: ayah صالح`);
  }
}

const dhul = published.find((p) => p.slug === "dhul-kifl");
check(!!dhul?.cautionNote && /خلاف|لا يُتوسع/.test(dhul.cautionNote), "ذو الكفل له cautionNote");

for (const slug of ["harut", "marut"]) {
  const p = published.find((x) => x.slug === slug);
  check(!!p, `${slug} منشور`);
  check(/يُلتزم بما ورد في الآية/.test(p?.definition || ""), `${slug}: تعريف مقتصر على الآية`);
  check(!HARUT_EXPANSION.test(`${p?.definition || ""}${p?.whyMentioned || ""}`), `${slug}: بلا توسع قصصي`);
}

/* ── 5) SEO prerender — ليس homepage fallback ─────────────── */
const HOME_TITLE = "المجلس العلمي | دروس شرعية ودورات علمية";
const routes = [
  "/nations",
  "/nations/aad",
  "/nations/thamud",
  "/nations/qawm-firaun",
  "/quran/people",
  "/quran/people/maryam",
  "/quran/people/harut",
  "/quran/people/marut",
  "/quran/people/azar",
];

const seoRoutes = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8"));
const staticPaths = new Set((seoRoutes.routes || []).map((r) => r.path));
check(staticPaths.has("/nations"), "seo-routes يتضمن /nations");
check(staticPaths.has("/quran/people"), "seo-routes يتضمن /quran/people");

for (const route of routes) {
  const file = resolve(root, "seo-prerender", route.replace(/^\//, ""), "index.html");
  if (!existsSync(file)) {
    // قبل generate:seo قد لا يوجد — نفحص المصدر البرمجي كحد أدنى
    const gen = readFileSync(resolve(root, "scripts/generate-seo.mjs"), "utf8");
    check(
      gen.includes("`/nations/${n.slug}`") || gen.includes("/nations/${n.slug}"),
      `generate-seo يولّد تفاصيل الأمم (${route})`,
    );
    check(
      gen.includes("`/quran/people/${person.slug}`") || gen.includes("/quran/people/${person.slug}"),
      `generate-seo يولّد تفاصيل الشخصيات (${route})`,
    );
    continue;
  }
  const html = readFileSync(file, "utf8");
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
  const canonical = (html.match(/rel="canonical"\s+href="([^"]+)"/i) || [])[1] || "";
  const h1 = (html.match(/<h1[^>]*>([^<]*)<\/h1>/i) || [])[1] || "";
  check(title !== HOME_TITLE, `${route}: title ليس homepage (${title.slice(0, 40)})`);
  check(canonical.includes(route) || canonical.endsWith(route), `${route}: canonical صحيح (${canonical})`);
  check(h1.length > 0 && !/منصة الدروس الشرعية/.test(h1), `${route}: h1 خاص بالصفحة`);
}

if (fails > 0) {
  console.error(`\nفشل ${fails} فحصًا في nations-quran-people-audit`);
  process.exit(1);
}
console.log("\n✓ nations-quran-people-audit: ok");
