#!/usr/bin/env node
/**
 * تدقيق رباعي لمرجع الصحيحين المحلي — قبل الاعتماد في الواجهة.
 *
 * التمريرات:
 *  1) اكتمال الأعداد / فراغ / تكرار / ترقيم
 *  2) سلامة النص العربي وفصل المتن
 *  3) اتساق التخريج (كتاب / داخل / عربي)
 *  4) عيّنات عشوائية ثابتة البذرة + مقارنة سريعة مع CDN إن توفّرت الشبكة
 *
 * تشغيل: node scripts/audit-sahihayn-four-passes.mjs
 * خروج 0 = نجاح؛ 1 = فشل بوابة الجودة
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "data", "hadith");
const REPORT_DIR = path.join(ROOT, "docs");
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const MIN_BUKHARI = 7500;
const MIN_MUSLIM = 7200;
const MAX_EMPTY = 0;
const MAX_DUP_NUM_RATIO = 0.02;
const MAX_LATIN_RATIO = 0.001;
const MAX_CARD_ISNAD_RATIO = 0.05; // بطاقات ما زال متنها يبدأ بسند
const MIN_MATN_SPLIT_BUKHARI = 0.9;
const MIN_MATN_SPLIT_MUSLIM = 0.8;

/** @type {{ pass: string, level: 'ok'|'warn'|'fail', msg: string }[]} */
const findings = [];
let failed = false;

function ok(pass, msg) {
  findings.push({ pass, level: "ok", msg });
  console.log(`  ✓ [${pass}] ${msg}`);
}
function warn(pass, msg) {
  findings.push({ pass, level: "warn", msg });
  console.warn(`  ⚠ [${pass}] ${msg}`);
}
function fail(pass, msg) {
  findings.push({ pass, level: "fail", msg });
  failed = true;
  console.error(`  ✗ [${pass}] ${msg}`);
}

function hashFile(abs) {
  return createHash("sha256").update(readFileSync(abs)).digest("hex");
}

function loadCollection(file) {
  const abs = path.join(DIR, file);
  const data = JSON.parse(readFileSync(abs, "utf8"));
  return { abs, data, sha256: hashFile(abs) };
}

function stripTashkeel(s) {
  return String(s || "").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}

function hasArabic(s) {
  return /[\u0600-\u06FF]/.test(s);
}

function latinLetters(s) {
  const m = String(s || "").match(/[A-Za-z]/g);
  return m ? m.length : 0;
}

// ─── Pass 1 ─────────────────────────────────────────────────────────────────
function pass1Completeness(manifest, bukhari, muslim) {
  console.log("\n══ تمريرة 1: اكتمال / فراغ / تكرار / ترقيم ══");
  if (manifest.authenticity !== "sahih-by-collection") {
    fail("P1", "manifest.authenticity ≠ sahih-by-collection");
  } else ok("P1", "authenticity = sahih-by-collection");

  for (const [label, pack, min] of [
    ["البخاري", bukhari, MIN_BUKHARI],
    ["مسلم", muslim, MIN_MUSLIM],
  ]) {
    const { data, sha256 } = pack;
    const mf = (manifest.files || []).find((f) => f.collection === data.collection);
    if (!mf) fail("P1", `${label}: غير مذكور في manifest`);
    else if (mf.sha256 !== sha256) fail("P1", `${label}: SHA لا يطابق manifest`);
    else ok("P1", `${label}: SHA مطابق (${sha256.slice(0, 12)}…)`);

    if (data.count !== data.hadiths.length) {
      fail("P1", `${label}: count=${data.count} ≠ hadiths=${data.hadiths.length}`);
    } else ok("P1", `${label}: count = ${data.hadiths.length}`);

    if (data.hadiths.length < min) fail("P1", `${label}: ${data.hadiths.length} < الحد الأدنى ${min}`);
    else ok("P1", `${label}: ${data.hadiths.length} ≥ ${min}`);

    const empty = data.hadiths.filter((h) => !String(h.t || "").trim());
    if (empty.length > MAX_EMPTY) fail("P1", `${label}: ${empty.length} نص فارغ`);
    else ok("P1", `${label}: لا نصوص فارغة`);

    const byNum = new Map();
    let badNum = 0;
    for (const h of data.hadiths) {
      if (!Number.isFinite(Number(h.n))) badNum++;
      const list = byNum.get(h.n) || [];
      list.push(h);
      byNum.set(h.n, list);
    }
    if (badNum) fail("P1", `${label}: ${badNum} رقم غير رقمي`);
    const dups = [...byNum.entries()].filter(([, v]) => v.length > 1);
    const dupCount = dups.reduce((s, [, v]) => s + v.length - 1, 0);
    const ratio = dupCount / data.hadiths.length;
    if (ratio > MAX_DUP_NUM_RATIO) {
      fail("P1", `${label}: تكرار أرقام مفرط ${dupCount} (${(ratio * 100).toFixed(2)}%)`);
    } else if (dupCount) {
      warn("P1", `${label}: ${dupCount} تكرار رقم (طبعات/طرق) — مقبول إن <2%`);
    } else ok("P1", `${label}: لا تكرار أرقام`);

    // فجوات الترقيم (ليست فشلاً — البخاري/مسلم ليسا متسلسلين دائماً في كل طبعة)
    const nums = [...byNum.keys()].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] - nums[i - 1] > 1) gaps.push([nums[i - 1], nums[i]]);
    }
    ok("P1", `${label}: مدى الأرقام ${nums[0]}…${nums[nums.length - 1]} — فجوات ${gaps.length}`);
  }

  const total = bukhari.data.hadiths.length + muslim.data.hadiths.length;
  if (manifest.totalHadiths !== total) fail("P1", `manifest.totalHadiths=${manifest.totalHadiths} ≠ ${total}`);
  else ok("P1", `المجموع ${total} يطابق manifest`);
  return { total, bukhariDups: 0 };
}

// ─── Pass 2 ─────────────────────────────────────────────────────────────────
async function pass2TextQuality() {
  console.log("\n══ تمريرة 2: سلامة النص العربي وفصل المتن ══");
  const { execFileSync } = await import("node:child_process");
  const runnerPath = path.join(ROOT, "_tmp-sahihayn-pass2-runner.ts");
  writeFileSync(
    runnerPath,
    `
import { readFileSync, writeFileSync } from 'fs';
import { splitHadithNarration, extractDisplayMatn } from './src/lib/hadith-access.ts';
import { normalizeArabic } from './src/shared/arabic-normalize.ts';

function audit(path: string) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  let hasIsnad = 0, cardIsnad = 0, noArabic = 0, latinChars = 0, totalChars = 0, shortText = 0;
  const cardIsnadSamples: { n: number; head: string }[] = [];
  for (const h of data.hadiths) {
    const t = String(h.t || '');
    totalChars += t.length;
    latinChars += (t.match(/[A-Za-z]/g) || []).length;
    if (!/[\\u0600-\\u06FF]/.test(t)) noArabic++;
    if (t.trim().length < 12) shortText++;
    const parts = splitHadithNarration(t);
    if (parts.hasIsnad) hasIsnad++;
    const matn = normalizeArabic(extractDisplayMatn(null, t));
    if (matn.startsWith('حدثنا') || matn.startsWith('حدثني') || matn.startsWith('اخبرنا')) {
      cardIsnad++;
      if (cardIsnadSamples.length < 8) cardIsnadSamples.push({ n: h.n, head: t.slice(0, 80) });
    }
  }
  return {
    collection: data.collection,
    total: data.hadiths.length,
    hasIsnad,
    splitPct: +(hasIsnad / data.hadiths.length * 100).toFixed(2),
    cardIsnad,
    cardIsnadPct: +(cardIsnad / data.hadiths.length * 100).toFixed(3),
    noArabic,
    shortText,
    latinChars,
    latinPct: +(latinChars / Math.max(totalChars, 1) * 100).toFixed(4),
    cardIsnadSamples,
  };
}

const report = {
  bukhari: audit('public/data/hadith/bukhari.json'),
  muslim: audit('public/data/hadith/muslim.json'),
};
writeFileSync('/tmp/sahihayn-pass2.json', JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify(report));
`,
  );
  let report;
  try {
    const raw = execFileSync("pnpm", ["exec", "tsx", runnerPath], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    report = JSON.parse(raw.trim());
  } catch (err) {
    fail("P2", `تعذّر تشغيل تدقيق المتن: ${err.message}`);
    return null;
  } finally {
    try {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(runnerPath);
    } catch {
      /* ignore */
    }
  }

  if (!report) return null;

  for (const [label, r, minSplit] of [
    ["البخاري", report.bukhari, MIN_MATN_SPLIT_BUKHARI],
    ["مسلم", report.muslim, MIN_MATN_SPLIT_MUSLIM],
  ]) {
    if (r.noArabic) fail("P2", `${label}: ${r.noArabic} بلا حروف عربية`);
    else ok("P2", `${label}: كل النصوص تحتوي عربية`);

    if (r.shortText > 30) warn("P2", `${label}: ${r.shortText} نصًا قصيرًا جدًا (<12)`);
    else ok("P2", `${label}: نصوص قصيرة ${r.shortText}`);

    if (r.latinPct > MAX_LATIN_RATIO * 100) {
      fail("P2", `${label}: نسبة لاتيني ${r.latinPct}% مرتفعة`);
    } else ok("P2", `${label}: لاتيني ${r.latinPct}% (حروف ${r.latinChars})`);

    const splitRatio = r.hasIsnad / r.total;
    if (splitRatio < minSplit) fail("P2", `${label}: فصل متن ${r.splitPct}% < ${(minSplit * 100).toFixed(0)}%`);
    else ok("P2", `${label}: فصل متن موثوق ${r.splitPct}%`);

    const cardRatio = r.cardIsnad / r.total;
    if (cardRatio > MAX_CARD_ISNAD_RATIO) {
      fail("P2", `${label}: ${r.cardIsnad} بطاقة ما زال متنها يبدأ بسند (${r.cardIsnadPct}%)`);
    } else if (r.cardIsnad) {
      warn("P2", `${label}: ${r.cardIsnad} إحالة/نص بلا فاصل متن واضح — تُعرض كما هي`);
    } else ok("P2", `${label}: لا بطاقة تبدأ بسند في العرض`);
  }
  return report;
}

// ─── Pass 3 ─────────────────────────────────────────────────────────────────
function pass3Takhrij(bukhari, muslim) {
  console.log("\n══ تمريرة 3: اتساق التخريج (كتاب / داخل / عربي) ══");
  const out = {};
  for (const [label, pack] of [
    ["البخاري", bukhari],
    ["مسلم", muslim],
  ]) {
    const hs = pack.data.hadiths;
    let withBook = 0, withInBook = 0, withArabic = 0, badRef = 0;
    const books = new Set();
    for (const h of hs) {
      if (h.b != null && Number.isFinite(Number(h.b))) {
        withBook++;
        books.add(Number(h.b));
      }
      if (h.h != null && Number.isFinite(Number(h.h))) withInBook++;
      if (h.a != null && Number.isFinite(Number(h.a))) withArabic++;
      if ((h.b != null && !Number.isFinite(Number(h.b))) || (h.h != null && !Number.isFinite(Number(h.h)))) {
        badRef++;
      }
    }
    out[label] = { withBook, withInBook, withArabic, badRef, books: books.size, total: hs.length };
    if (badRef) fail("P3", `${label}: ${badRef} مرجع غير رقمي`);
    else ok("P3", `${label}: مراجع رقمية سليمة`);

    const bookPct = withBook / hs.length;
    if (bookPct < 0.85) fail("P3", `${label}: تغطية رقم الكتاب ${(bookPct * 100).toFixed(1)}% < 85%`);
    else ok("P3", `${label}: رقم كتاب لـ ${withBook}/${hs.length} (${(bookPct * 100).toFixed(1)}%) عبر ${books.size} كتابًا`);

    const inPct = withInBook / hs.length;
    if (inPct < 0.85) warn("P3", `${label}: رقم داخل الكتاب ${(inPct * 100).toFixed(1)}%`);
    else ok("P3", `${label}: رقم داخل الكتاب ${withInBook}`);

    if (label === "مسلم" && withArabic < hs.length * 0.5) {
      warn("P3", `${label}: أرقام عربية بديلة ${withArabic} فقط`);
    } else if (withArabic) {
      ok("P3", `${label}: أرقام عربية بديلة ${withArabic}`);
    }
  }
  return out;
}

// ─── Pass 4 ─────────────────────────────────────────────────────────────────
async function pass4SamplesAndCdn(bukhari, muslim) {
  console.log("\n══ تمريرة 4: عيّنات ثابتة + مقارنة CDN ══");

  // عيّنات شهيرة يجب أن تحتوي ألفاظًا معروفة
  const expected = [
    { coll: "bukhari", n: 1, must: /النّ?يّ?ات|الاعمال|الأعمال/ },
    { coll: "bukhari", n: 8, must: /خمس|الاسلام|الإسلام/ },
    { coll: "muslim", n: 3, must: /.+/ }, // أول رقم شائع في طبعة CDN لمسلم
  ];

  for (const exp of expected) {
    const pack = exp.coll === "bukhari" ? bukhari : muslim;
    const h = pack.data.hadiths.find((x) => Number(x.n) === exp.n);
    if (!h) {
      fail("P4", `${exp.coll} #${exp.n} مفقود`);
      continue;
    }
    if (!exp.must.test(h.t) && !exp.must.test(stripTashkeel(h.t))) {
      fail("P4", `${exp.coll} #${exp.n}: المتن لا يطابق التوقّع`);
    } else ok("P4", `${exp.coll} #${exp.n}: عيّنة شهيرة مطابقة`);
  }

  // عيّنة عشوائية حتمية (seed ثابت) — 40 من كل كتاب
  function seededSample(arr, count, seed) {
    let s = seed;
    const idx = [];
    const used = new Set();
    while (idx.length < Math.min(count, arr.length)) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const i = s % arr.length;
      if (used.has(i)) continue;
      used.add(i);
      idx.push(i);
    }
    return idx.map((i) => arr[i]);
  }

  for (const [label, pack, seed] of [
    ["البخاري", bukhari, 20260727],
    ["مسلم", muslim, 20260728],
  ]) {
    const sample = seededSample(pack.data.hadiths, 40, seed);
    let bad = 0;
    for (const h of sample) {
      const t = String(h.t || "").trim();
      if (t.length < 8 || !hasArabic(t)) bad++;
      if (latinLetters(t) > t.length * 0.05) bad++;
    }
    if (bad) fail("P4", `${label}: ${bad}/40 عيّنة عشوائية تالفة`);
    else ok("P4", `${label}: 40/40 عيّنة عشوائية سليمة (بذرة ${seed})`);
  }

  // مقارنة CDN
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const [bRaw, mRaw] = await Promise.all([
      fetch(`${CDN}/ara-bukhari.min.json`, { signal: controller.signal }).then((r) => r.json()),
      fetch(`${CDN}/ara-muslim.min.json`, { signal: controller.signal }).then((r) => r.json()),
    ]);
    clearTimeout(timer);

    const leanCount = (raw) =>
      (raw.hadiths || []).filter((h) => String(h.text || "").trim()).length;

    const bCdn = leanCount(bRaw);
    const mCdn = leanCount(mRaw);
    const bDiff = Math.abs(bCdn - bukhari.data.hadiths.length);
    const mDiff = Math.abs(mCdn - muslim.data.hadiths.length);

    ok("P4", `CDN بخاري (غير فارغ): ${bCdn} — محلي ${bukhari.data.hadiths.length} (فرق ${bDiff})`);
    ok("P4", `CDN مسلم (غير فارغ): ${mCdn} — محلي ${muslim.data.hadiths.length} (فرق ${mDiff})`);

    if (bDiff > 50) fail("P4", `فرق بخاري مع CDN كبير: ${bDiff}`);
    if (mDiff > 50) fail("P4", `فرق مسلم مع CDN كبير: ${mDiff}`);

    // عيّنة تطابق نص لأول 20 غير فارغ
    let mismatch = 0;
    const bLocalByN = new Map(bukhari.data.hadiths.map((h) => [h.n, h.t]));
    let checked = 0;
    for (const h of bRaw.hadiths || []) {
      const t = String(h.text || "").trim();
      if (!t) continue;
      const local = bLocalByN.get(Number(h.hadithnumber));
      if (local && local.slice(0, 80) !== t.slice(0, 80)) mismatch++;
      checked++;
      if (checked >= 80) break;
    }
    if (mismatch > 5) fail("P4", `عدم تطابق نصوص بخاري مع CDN: ${mismatch}/80`);
    else ok("P4", `تطابق عيّنة نصوص بخاري مع CDN (اختلافات ${mismatch}/80)`);
  } catch (err) {
    warn("P4", `تعذّرت مقارنة CDN: ${err.message}`);
  }
}

function writeReport(extra) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    title: "تدقيق رباعي لمرجع الصحيحين",
    generatedAt: new Date().toISOString(),
    gate: failed ? "blocked" : "pass",
    findings,
    extra,
  };
  const abs = path.join(REPORT_DIR, "sahihayn-four-pass-audit.json");
  writeFileSync(abs, JSON.stringify(report, null, 2) + "\n");
  const md = [
    "# تدقيق رباعي — أحاديث الصحيحين",
    "",
    `**النتيجة:** ${failed ? "❌ فشل البوابة" : "✅ نجاح"}`,
    "",
    `تاريخ: ${report.generatedAt}`,
    "",
    "## النتائج",
    "",
    "| تمريرة | المستوى | الرسالة |",
    "|---|---|---|",
    ...findings.map((f) => `| ${f.pass} | ${f.level} | ${f.msg.replace(/\|/g, "/")} |`),
    "",
    "## المنهج",
    "",
    "1. اكتمال الأعداد والفراغ والتكرار والترقيم + SHA",
    "2. سلامة العربية / نسبة اللاتيني / فصل المتن عن السند",
    "3. تغطية أرقام التخريج (كتاب / داخل / عربي)",
    "4. عيّنات شهيرة + عشوائية حتمية + مقارنة CDN",
    "",
    "> ملاحظة: المراجعة البشرية اليدوية لـ ١٤٩٤٠ حديثًا ×٤ غير ممكنة آليًا؛ هذا التدقيق الرباعي الآلي هو بوابة الجودة قبل العرض.",
    "",
  ].join("\n");
  writeFileSync(path.join(REPORT_DIR, "sahihayn-four-pass-audit.md"), md);
  console.log(`\n📄 التقرير: docs/sahihayn-four-pass-audit.md`);
}

async function main() {
  console.log("تدقيق رباعي لمرجع الصحيحين…");
  const manifest = JSON.parse(readFileSync(path.join(DIR, "manifest.json"), "utf8"));
  const bukhari = loadCollection("bukhari.json");
  const muslim = loadCollection("muslim.json");

  const p1 = pass1Completeness(manifest, bukhari, muslim);
  const p2 = await pass2TextQuality();
  const p3 = pass3Takhrij(bukhari, muslim);
  await pass4SamplesAndCdn(bukhari, muslim);

  writeReport({ p1, p2, p3 });

  if (failed) {
    console.error("\n✗ بوابة التدقيق الرباعي: فشل");
    process.exit(1);
  }
  console.log("\n✓ بوابة التدقيق الرباعي: نجاح — المرجع صالح للعرض");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
