#!/usr/bin/env node
/**
 * quran-recitation-audit.mjs — فحص نظام تلاوة المصحف (سُنّة)
 * تشغيل: node scripts/quran-recitation-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(ROOT, "../..");
const REPORTS_DIR = path.resolve(REPO_ROOT, "reports");

const findings = [];

function add(severity, id, message, fix = "") {
  findings.push({ severity, id, message, fix });
}

function read(rel) {
  const abs = path.resolve(ROOT, rel);
  if (!fs.existsSync(abs)) return "";
  return fs.readFileSync(abs, "utf8");
}

function exists(rel) {
  return fs.existsSync(path.resolve(ROOT, rel));
}

// ── 1) ملفات التلاوة المركزية ─────────────────────────────────────────────
const recitersTs = read("src/config/quranReciters.ts");
const serviceTs = read("src/lib/quran/quranRecitationService.ts");
const playerTs = read("src/components/quran/QuranAudioPlayer.tsx");

if (!recitersTs) {
  add("critical", "missing-quranReciters", "ملف src/config/quranReciters.ts غير موجود", "أنشئ الإعداد المركزي للقراء");
}
if (!serviceTs) {
  add("critical", "missing-recitationService", "ملف quranRecitationService.ts غير موجود", "أنشئ خدمة التلاوة");
}
if (!playerTs) {
  add("critical", "missing-audioPlayer", "ملف QuranAudioPlayer.tsx غير موجود", "أنشئ مشغّل التلاوة");
}

// ── 2) القرّاء المطلوبون ───────────────────────────────────────────────────
for (const id of ["dosari", "shuraim"]) {
  if (recitersTs && !recitersTs.includes(`"${id}"`)) {
    add("high", `reciter-${id}`, `القارئ ${id} غير مُعرَّف في quranReciters.ts`, `أضف ${id} إلى VERIFIED_RECITER_IDS`);
  }
}

// ── 3) audio-registry fallback ───────────────────────────────────────────────
const registryTs = read("src/lib/audio-registry.ts");
if (registryTs && !/dosari/.test(registryTs)) {
  add("high", "registry-dosari", "DEFAULT_VERIFIED_RECITER_IDS لا يشمل dosari", "أضف dosari و shuraim");
}

// ── 4) لا autoplay ────────────────────────────────────────────────────────────
const mushafReader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const audioEngine = read("src/core/audio/AudioEngine.ts");
const srcScanDirs = ["src/features/mushaf-reader", "src/lib/quran", "src/components/quran"];
for (const dir of srcScanDirs) {
  const abs = path.resolve(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    if (/\bautoplay\b/i.test(content) && !/\/\*.*autoplay|no autoplay|لا autoplay/i.test(content)) {
      add("high", "autoplay-detected", `autoplay في ${path.relative(ROOT, file)}`, "أزل autoplay — التشغيل بعد تفاعل المستخدم فقط");
    }
  }
}

if (serviceTs && !/unlockAudioOnUserGesture/.test(serviceTs)) {
  add("high", "ios-unlock", "لا يوجد فتح صوت iOS بعد تفاعل المستخدم", "أضف unlockAudioOnUserGesture");
}

// ── 5) لا تحميل كامل للصوت ─────────────────────────────────────────────────
if (mushafReader && /604|6236/.test(mushafReader) && /prefetch|preload|load.*all/i.test(mushafReader)) {
  add("medium", "bulk-audio-load", "احتمال تحميل كامل للصوت عند البداية", "حمّل الآية الحالية والتالية فقط");
}

// ── 6) المشغّل لا يغطي الآيات ───────────────────────────────────────────────
const mushafCss = read("src/features/mushaf-madinah/mushaf-madinah.css");
if (mushafCss && /\.mm-audio-dock[\s\S]*position:\s*fixed/.test(mushafCss)) {
  const dockBlock = mushafCss.match(/\.mm-audio-dock\s*\{[^}]+\}/)?.[0] ?? "";
  if (/bottom:\s*0/.test(dockBlock) && !/max-height|data-mini/.test(dockBlock)) {
    add("medium", "dock-overlay", "تحقق من أن المشغّل لا يغطي نص الآيات", "ثبّت المشغّل أسفل الشاشة بارتفاع محدود");
  }
}

// ── 7) لا Majlisilm للمستخدم ─────────────────────────────────────────────────
const mushafScopeDirs = [
  "src/features/mushaf-reader",
  "src/features/mushaf-madinah/MushafAudioDock.tsx",
  "src/components/quran/QuranAudioPlayer.tsx",
  "src/pages/quran",
];
for (const entry of mushafScopeDirs) {
  const abs = path.resolve(ROOT, entry);
  const files = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? walk(abs) : exists(entry) ? [abs] : [];
  for (const file of files) {
    if (!/\.(tsx?|css)$/.test(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const content = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''");
    if (/Majlisilm|المجلس العلمي/i.test(content)) {
      add("high", "brand-leak", `اسم قديم ظاهر في ${path.relative(ROOT, file)}`, "استبدل بـ سُنّة فقط");
    }
  }
}

// ── 8) لا مسارات review/internal/admin ─────────────────────────────────────
const appTs = read("src/App.tsx") || read("src/app/App.tsx");
if (appTs && /\/(internal|review|admin)\b/.test(appTs) && !/disabled|false|comment/i.test(appTs)) {
  add("critical", "internal-route", "مسار review/internal/admin مفعّل في التطبيق", "أزل المسارات الداخلية");
}

// ── 9) لا تغيير خط المصحف/التفسير (في ملفات هذه المهمة فقط) ─────────────────
const typographyTargets = [
  "src/features/mushaf-reader/mushaf-reader.css",
  "src/features/mushaf-madinah/mushaf-madinah.css",
  "src/components/quran/QuranAudioPlayer.tsx",
];
const forbiddenTypography = /\.(qpc-|mushaf-verse|mushaf-line|tafsir-body|ayah-text)[^{]*\{[^}]*(?:font-size|line-height)\s*:/i;
for (const rel of typographyTargets) {
  const file = read(rel);
  if (!file) continue;
  if (forbiddenTypography.test(file)) {
    add("high", `typography-${path.basename(rel)}`, `تغيير font-size/line-height لنص المصحف أو التفسير في ${rel}`, "لا تغيّر تخطيط القراءة");
  }
}

// ── 10) فحص روابط القرّاء المفعّلين ─────────────────────────────────────────
const registryJson = JSON.parse(
  fs.existsSync(path.resolve(ROOT, "public/data/audio/audio-registry.json"))
    ? fs.readFileSync(path.resolve(ROOT, "public/data/audio/audio-registry.json"), "utf8")
    : '{"reciters":[]}',
);

const recitersCatalog = read("src/lib/quran-audio.ts");
const enabledMatch = recitersTs.match(/VERIFIED_RECITER_IDS\s*=\s*\[([\s\S]*?)\]/);
const enabledIds =
  enabledMatch?.[1]?.match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) ??
  ["dosari", "shuraim", "husary", "minshawi", "alafasy"];

const reciterReport = [];
for (const id of enabledIds) {
  const regEntry = registryJson.reciters?.find((r) => r.id === id);
  const folderMatch = recitersCatalog.match(
    new RegExp(`id:\\s*"${id}"[\\s\\S]*?everyayahFolder:\\s*"([^"]+)"`),
  );
  const folder = folderMatch?.[1] ?? regEntry?.folder ?? null;
  const url = folder ? `https://everyayah.com/data/${folder}/001001.mp3` : null;
  const verified = regEntry?.verified === true;
  const visible = verified && Boolean(folder);
  reciterReport.push({
    id,
    name: regEntry?.name ?? id,
    url,
    verified,
    visibleToUser: visible,
    filesPresent: regEntry?.filesPresent ?? null,
    playbackErrors: visible ? [] : ["غير مُحقَّق أو بلا مجلد everyayah"],
    iosSupport: Boolean(serviceTs && /playsinline|unlockAudio/i.test(serviceTs)),
    issue: visible ? null : "مخفي عن المستخدم",
    severity: visible ? "none" : "low",
    fix: visible ? null : "أكمل QA أو عطّل enabled",
  });
  if (!folder && verified) {
    add("high", `reciter-no-folder-${id}`, `قارئ ${id} مُحقَّق بلا مجلد everyayah`, "أضف everyayahFolder أو عطّل العرض");
  }
}

// ── 11) رسائل خطأ عربية ─────────────────────────────────────────────────────
if (playerTs && /Failed to fetch|Error:/i.test(playerTs)) {
  add("high", "technical-error-ui", "رسائل خطأ تقنية ظاهرة للمستخدم", "استخدم «تعذر تشغيل التلاوة الآن»");
}

if (!playerTs.includes("إعادة المحاولة")) {
  add("medium", "retry-button", "زر إعادة المحاولة مفقود", "أضف زر إعادة المحاولة في QuranAudioPlayer");
}

// ── 12) تشغيل الصفحة ───────────────────────────────────────────────────────
if (!mushafReader.includes("playPage") && !mushafReader.includes("تشغيل الصفحة")) {
  add("high", "play-page-missing", "تشغيل الصفحة غير مدمج في المصحف", "أضف زر تشغيل الصفحة");
}

// ── تجميع التقرير ───────────────────────────────────────────────────────────
const counts = { critical: 0, high: 0, medium: 0, low: 0 };
for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

const report = {
  generatedAt: new Date().toISOString(),
  product: "سُنّة",
  counts,
  reciters: reciterReport,
  findings,
  passed: counts.critical === 0 && counts.high === 0,
};

fs.mkdirSync(REPORTS_DIR, { recursive: true });
const jsonPath = path.join(REPORTS_DIR, "quran-recitation-audit.json");
const mdPath = path.join(REPORTS_DIR, "quran-recitation-audit.md");
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const md = [
  "# تقرير فحص تلاوة المصحف — سُنّة",
  "",
  `تاريخ: ${report.generatedAt}`,
  "",
  "## الملخص",
  `- Critical: ${counts.critical}`,
  `- High: ${counts.high}`,
  `- Medium: ${counts.medium}`,
  `- Low: ${counts.low}`,
  `- الحالة: ${report.passed ? "✅ ناجح" : "❌ يحتاج إصلاح"}`,
  "",
  "## القرّاء",
  "",
  "| القارئ | يظهر | الرابط | المشكلة | الخطورة | الإصلاح |",
  "|--------|------|--------|---------|---------|---------|",
  ...reciterReport.map(
    (r) =>
      `| ${r.name} | ${r.visibleToUser ? "نعم" : "لا"} | ${r.url ? "صالح" : "—"} | ${r.issue ?? "—"} | ${r.severity} | ${r.fix ?? "—"} |`,
  ),
  "",
  "## النتائج",
  "",
  ...findings.map(
    (f) => `### [${f.severity.toUpperCase()}] ${f.id}\n- **المشكلة:** ${f.message}\n- **الإصلاح:** ${f.fix || "—"}\n`,
  ),
].join("\n");
fs.writeFileSync(mdPath, md);

console.log(`quran-recitation-audit: Critical=${counts.critical} High=${counts.high} Medium=${counts.medium}`);
console.log(`Report: ${mdPath}`);
for (const f of findings) {
  console.log(`${f.severity === "critical" ? "✗" : f.severity === "high" ? "!" : "·"} [${f.severity}] ${f.id}: ${f.message}`);
}
process.exit(report.passed ? 0 : 1);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules") out.push(...walk(p));
    else if (ent.isFile()) out.push(p);
  }
  return out;
}
