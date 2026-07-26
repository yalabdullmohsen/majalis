#!/usr/bin/env node
/**
 * تخفيف CSS المسار الحرج:
 * - نقل كتل صفحات من elite-2026 إلى styles/pages/*
 * - نقل highlighted-content خارج main.tsx
 * - حذف قوالب التعزية الميتة من index.css
 * - تقليم geo-* غير المستخدمة من patterns.css
 * - نقل وضع تركيز الأذكار من modern-2026 إلى pages/adhkar.css
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}
function write(rel, text) {
  writeFileSync(resolve(root, rel), text);
}
function removeRanges(text, ranges) {
  const lines = text.split("\n");
  const drop = new Set();
  for (const [a, b] of ranges) {
    for (let i = a; i <= b; i++) drop.add(i);
  }
  // keep line endings consistent
  const out = [];
  for (let i = 1; i <= lines.length; i++) {
    if (!drop.has(i)) out.push(lines[i - 1]);
  }
  return out.join("\n");
}
function ensureImport(rel, cssImport) {
  let src = read(rel);
  if (src.includes(cssImport)) {
    console.log("  · موجود مسبقًا:", rel, cssImport);
    return;
  }
  const lines = src.split("\n");
  // لا تُدرج داخل import { ... } متعدد الأسطر — ابحث عن آخر سطر استيراد مكتمل
  let last = 0;
  let inMulti = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^import\s+/.test(l) && l.includes("{") && !l.includes("}")) {
      inMulti = true;
      continue;
    }
    if (inMulti) {
      if (l.includes("}")) {
        inMulti = false;
        last = i;
      }
      continue;
    }
    if (/^import\s+/.test(l)) last = i;
  }
  lines.splice(last + 1, 0, `import "${cssImport}";`);
  write(rel, lines.join("\n"));
  console.log("  + import", rel, "←", cssImport);
}

// ── 1) elite extractions (1-based inclusive, verified) ──
const eliteRel = "src/styles/elite-2026.css";
let elite = read(eliteRel);
const eliteLines = elite.split("\n");

const extractions = [
  { start: 2156, end: 2237, dest: "src/styles/pages/qibla.css", view: "src/views/QiblaPage.tsx" },
  { start: 7189, end: 7387, dest: "src/styles/pages/surah-index.css", view: "src/views/SurahIndexPage.tsx" },
  { start: 7389, end: 7587, dest: "src/styles/pages/revelation-order.css", view: "src/views/RevelationOrderPage.tsx" },
  { start: 7589, end: 7896, dest: "src/styles/pages/mushaf-reader.css", view: "src/views/MushafPage.tsx" },
];

for (const ex of extractions) {
  const head = eliteLines[ex.start - 1] ?? "";
  const tail = eliteLines[ex.end - 1] ?? "";
  console.log(`extract ${ex.dest}: ${ex.start}-${ex.end}`);
  console.log(`  head: ${head.slice(0, 70)}`);
  console.log(`  tail: ${tail.slice(0, 70)}`);
  const block = eliteLines.slice(ex.start - 1, ex.end).join("\n") + "\n";
  const header = "\n\n/* ── نُقل من elite-2026.css (تخفيف المسار الحرج) ── */\n";
  if (existsSync(resolve(root, ex.dest))) {
    write(ex.dest, read(ex.dest).replace(/\s*$/, "") + header + block);
  } else {
    write(ex.dest, "/* مُستخرج من elite-2026 لتأجيل التحميل مع الصفحة */\n" + block);
  }
}

elite = removeRanges(elite, extractions.map((e) => [e.start, e.end]));
const marker = "/* تصغير لوحة الإشعارات — مدموج في NotificationBell أعلاه */";
const note =
  "\n\n/* ── نُقلت كتل qibla / surah-index / revord / mushaf-v2 إلى styles/pages/* ── */\n";
if (elite.includes(marker) && !elite.includes("نُقلت كتل qibla")) {
  elite = elite.replace(marker, marker + note);
}
write(eliteRel, elite);
console.log("✓ elite-2026 trimmed →", elite.length, "chars");

for (const ex of extractions) {
  const cssPath = ex.dest.replace(/^src/, "@");
  ensureImport(ex.view, cssPath);
}

// ── 2) highlighted-content off main ──
const mainRel = "src/main.tsx";
let main = read(mainRel);
const hi = 'import "./styles/highlighted-content.css";\n';
if (main.includes(hi)) {
  write(mainRel, main.replace(hi, ""));
  console.log("✓ أُزيل highlighted-content من main.tsx");
} else if (main.includes("highlighted-content.css")) {
  write(mainRel, main.replace(/import\s+[\"']\.\/styles\/highlighted-content\.css[\"'];\n?/, ""));
  console.log("✓ أُزيل highlighted-content من main.tsx (صيغة بديلة)");
} else {
  console.log("· highlighted-content ليس في main");
}
ensureImport("src/components/reading/HighlightedContentCard.tsx", "@/styles/highlighted-content.css");
ensureImport("src/components/reading/TasbeehCounter.tsx", "@/styles/highlighted-content.css");

// ── 3) delete dead condolence templates in index.css (3207–3968) ──
const idxRel = "src/index.css";
let idx = read(idxRel);
const idxLines = idx.split("\n");
console.log("index 3207:", (idxLines[3206] || "").slice(0, 70));
console.log("index 3969:", (idxLines[3968] || "").slice(0, 70));
if (!(idxLines[3206] || "").includes("Condolence")) {
  throw new Error("حد كتلة التعزية تغيّر — أوقف التنفيذ");
}
if (!(idxLines[3968] || "").includes("Lesson Announcements")) {
  throw new Error("نهاية كتلة التعزية تغيّرت — أوقف التنفيذ");
}
idx = removeRanges(idx, [[3207, 3968]]);
// Slim combined selectors in cards section
idx = idx
  .replace(/\.cond-page,\s*\n\.cards-page/g, ".cards-page")
  .replace(/\.cond-page-inner,\s*\n\.cards-page-inner/g, ".cards-page-inner")
  .replace(/\.cond-page-title,\s*\n\.cards-page-title/g, ".cards-page-title");

// Drop pure unused .cond-* rules (keep cond-page-desc, cond-checkbox)
const keep = new Set(["cond-page-desc", "cond-checkbox"]);
const lines = idx.split("\n");
const out = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  if (/^\.cond-/.test(line) || /^html.*\.cond-/.test(line)) {
    const chunk = [line];
    let j = i + 1;
    while (j < lines.length && !chunk.join("\n").includes("{")) {
      chunk.push(lines[j]);
      j++;
    }
    let bal = (chunk.join("\n").match(/{/g) || []).length - (chunk.join("\n").match(/}/g) || []).length;
    while (j < lines.length && bal > 0) {
      chunk.push(lines[j]);
      bal += (lines[j].match(/{/g) || []).length - (lines[j].match(/}/g) || []).length;
      j++;
    }
    const sel = chunk.join("\n").split("{")[0];
    const classes = [...sel.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
    const onlyCond = classes.length > 0 && classes.every((c) => c.startsWith("cond-"));
    const hasKeep = classes.some((c) => keep.has(c));
    if (onlyCond && !hasKeep) {
      i = j;
      continue;
    }
    out.push(...chunk);
    i = j;
    continue;
  }
  out.push(line);
  i++;
}
write(idxRel, out.join("\n"));
console.log("✓ index.css slimmed →", out.join("\n").length, "chars");

// ── 4) patterns: remove unused geo-* utilities ──
const patRel = "src/styles/patterns.css";
let pat = read(patRel);
const geoStart = pat.indexOf("/* ══════════════════════════════════════════════════\n   النمط 1:");
const atlStart = pat.indexOf(".atl-container h2::after");
if (geoStart >= 0 && atlStart > geoStart) {
  // find comment block before atl if any
  let cutEnd = pat.lastIndexOf("\n/*", atlStart);
  if (cutEnd < geoStart) cutEnd = atlStart;
  pat =
    pat.slice(0, geoStart) +
    "/* ── أُزيلت أدوات geo-* غير المستخدمة من المسار الحرج ── */\n\n" +
    pat.slice(cutEnd);
  write(patRel, pat);
  console.log("✓ patterns.css trimmed →", pat.length, "chars");
} else {
  console.warn("· تخطي patterns — العلامات غير موجودة");
}

// ── 5) move adhkar focus (+ tapper) from modern-2026 → adhkar.css ──
const modRel = "src/styles/modern-2026.css";
let mod = read(modRel);
const modLines = mod.split("\n");
let start = -1;
let end = -1;
for (let n = 0; n < modLines.length; n++) {
  if (modLines[n].includes("40. Adhkar Focus Mode")) {
    start = n; // 0-based; include comment start
    while (start > 0 && !modLines[start].startsWith("/* ══")) start--;
    break;
  }
}
if (start >= 0) {
  // include tapper section; end at next /* ══ that isn't adhkar/tapper
  for (let n = start + 3; n < modLines.length; n++) {
    if (modLines[n].startsWith("/* ══")) {
      const t = modLines[n];
      if (/Adhkar|عدّاد|تسبيح|Tap Counter|tapper/i.test(t)) continue;
      end = n - 1;
      while (end > start && modLines[end].trim() === "") end--;
      break;
    }
  }
}
if (start >= 0 && end > start) {
  // convert to 1-based for removeRanges
  const block = modLines.slice(start, end + 1).join("\n") + "\n";
  const adhkarRel = "src/styles/pages/adhkar.css";
  write(
    adhkarRel,
    read(adhkarRel).replace(/\s*$/, "") +
      "\n\n/* ── نُقل من modern-2026 (وضع التركيز/العدّاد) ── */\n" +
      block,
  );
  mod = removeRanges(mod, [[start + 1, end + 1]]);
  write(modRel, mod);
  console.log("✓ نُقل adhkar-focus من modern → adhkar.css", end - start + 1, "سطرًا");
} else {
  console.warn("· لم يُعثر على كتلة Adhkar Focus", { start, end });
}

console.log("✓ slim-critical-css اكتمل");
