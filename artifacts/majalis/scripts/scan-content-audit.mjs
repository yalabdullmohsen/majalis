#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/content-audit-scan-pass1.json");

const files = [
  "lib/durus-mutanawwia-data.ts", "lib/durus-imaniyya-data.ts", "lib/iman-topics-data.ts",
  "lib/maqasid-sharia-data.ts", "lib/dalail-nubuwwah-data.ts", "lib/arabic-language-data.ts",
  "lib/fikr-waqia-data.ts", "lib/sunnah-studies-data.ts",
  "lib/tarikh-islami-data.ts", "lib/tazkiya-topics-data.ts", "lib/usra-mujtama-data.ts",
  "lib/mawsuaat-data.ts", "lib/rulings-seed.ts", "lib/adhkar-seed.ts", "lib/fawaid-seed.ts",
  "lib/fawaid-curated-seed.ts", "lib/qa-seed.ts", "lib/quiz-seed.ts", "lib/islamic-occasions-seed.ts",
  "lib/annual-courses-seed.ts", "lib/masarat-data.ts", "lib/updates-seed.ts",
  "lib/scholars-data.ts", "lib/library-catalog.ts", "lib/islamic-stories-seed.ts",
  "lib/prophetic-medicine-seed.ts", "lib/prophets-data.ts", "lib/miracles-seed.ts",
  "lib/asma-husna-data.ts", "lib/arbaeen-nawawi-seed.ts", "lib/sins-rights-data.ts",
  "lib/sheikhs-seed.ts", "lib/amr-bil-maruf-seed.ts", "lib/fiqh-issues-seed.ts",
  "lib/fiqh-council-seed.ts", "lib/mind-maps-data.ts", "lib/islamic-landmarks-data.ts",
  "views/IslamicGlossaryPage.tsx", "views/AkhlaqPage.tsx", "views/SahabahPage.tsx",
  "views/DuasPage.tsx", "pages/hadith/ui/HadithScienceView.tsx", "views/IslamicSectsPage.tsx",
  "views/SunanYawmiyyaPage.tsx", "views/WasayaNabawiyyaPage.tsx", "views/RaqaiqPage.tsx",
  "views/HikamSalafPage.tsx", "views/FadailAamalPage.tsx", "views/JannaNaarPage.tsx",
  "views/AdabTalabIlmPage.tsx", "views/MalaikaPage.tsx", "pages/fiqh/ui/FiqhQawaidView.tsx",
  "views/TawhidPage.tsx", "views/ShimaelPage.tsx", "pages/quran/ui/QuranTajweedView.tsx",
  "pages/fiqh/ui/SalahGuideView.tsx", "views/SawmPage.tsx", "pages/fiqh/ui/HajjView.tsx",
  "pages/fiqh/ui/ZakatView.tsx", "views/TaharaPage.tsx", "pages/fiqh/ui/JanazaView.tsx",
  "pages/fiqh/ui/MawarithView.tsx", "pages/quran/ui/UlumQuranView.tsx", "views/IslamStatsPage.tsx",
  "views/SeerahPage.tsx", "views/MadhahibPage.tsx", "views/AmradQalbiyyaPage.tsx",
  "views/TawbaPage.tsx", "views/SujoodSahwPage.tsx", "views/PrayerRanksPage.tsx",
  "views/AlamatSaahPage.tsx", "pages/quran/ui/DuasQuranView.tsx", "views/ArkanImanPage.tsx",
];

const natDir = path.join(ROOT, "lib/nations/data");
if (fs.existsSync(natDir)) {
  for (const f of fs.readdirSync(natDir).filter((x) => x.endsWith(".ts"))) {
    files.push(`lib/nations/data/${f}`);
  }
}

const SHORT = 40;
const issues = [];

function scan(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    issues.push({ file: rel, type: "missing-file" });
    return;
  }
  const text = fs.readFileSync(p, "utf8");
  const lines = text.split("\n");

  const badPatterns = [
    [/وقf/, "وقf"],
    [/عذari/, "عذari"],
    [/الم\s*distorted/, "الم distorted"],
    [/بيوسf/, "بيوسf"],
    [/تاشfين/, "تاشfين"],
    [/البayan/, "البayan"],
    [/المغrib/, "المغrib"],
  ];

  lines.forEach((line, i) => {
    const ln = i + 1;
    const m = line.match(/(summary|description|desc|bio|meaning|benefit)\s*:\s*["`]([^"`]*)["`]/);
    if (m && m[2].replace(/\s/g, "").length > 0 && m[2].trim().length < SHORT) {
      issues.push({
        file: rel,
        line: ln,
        type: "short-field",
        field: m[1],
        len: m[2].trim().length,
        sample: m[2].trim(),
      });
    }
    const empty = line.match(/(summary|description|body|text|explanation|reference)\s*:\s*["`]\s*["`]/);
    if (empty) issues.push({ file: rel, line: ln, type: "empty-field", field: empty[1] });

    for (const [re, name] of badPatterns) {
      if (re.test(line)) {
        issues.push({
          file: rel,
          line: ln,
          type: "latin-typo",
          pattern: name,
          sample: line.trim().slice(0, 120),
        });
      }
    }

    // Latin stuck mid-Arabic word
    const re2 = /[\u0600-\u06FF][a-zA-Z]{1,6}[\u0600-\u06FF]|[\u0600-\u06FF]{2,}[a-zA-Z]{2,8}/g;
    let lm;
    while ((lm = re2.exec(line)) !== null) {
      if (/https?:|import |from |className|href=|src=|id:|slug:|NFT|DNA|ChatGPT|Spotify|Netflix|Córdoba|WhatsApp|Telegram|API|JSON|URL|HTML|CSS|PDF|ISBN|iPhone|Android|YouTube/.test(line)) {
        continue;
      }
      issues.push({
        file: rel,
        line: ln,
        type: "latin-in-arabic",
        sample: lm[0],
        ctx: line.trim().slice(0, 140),
      });
    }

    if (/TODO|FIXME|XXX|placeholder/i.test(line) && /[\u0600-\u06FF]|placeholder/i.test(line)) {
      issues.push({ file: rel, line: ln, type: "placeholder", sample: line.trim().slice(0, 120) });
    }
    if (/قريبًا|قريباً|سيتم لاحقًا|يُستكمل/.test(line)) {
      issues.push({ file: rel, line: ln, type: "incomplete-marker", sample: line.trim().slice(0, 120) });
    }
    if (/\.{3,}/.test(line) && /[\u0600-\u06FF]/.test(line) && !/import |from |className/.test(line)) {
      issues.push({ file: rel, line: ln, type: "ellipsis", sample: line.trim().slice(0, 120) });
    }
  });

  // lesson tuple summaries: ["title", "summary"]
  const tuples = [...text.matchAll(/\[["']([^"']+)["']\s*,\s*["']([^"']*)["']\s*\]/g)];
  for (const t of tuples) {
    if (t[2].trim().length > 0 && t[2].trim().length < SHORT) {
      const before = text.slice(0, t.index);
      const line = before.split("\n").length;
      issues.push({
        file: rel,
        line,
        type: "short-lesson-summary",
        len: t[2].trim().length,
        title: t[1],
        sample: t[2].trim(),
      });
    }
    if (t[2].trim().length === 0) {
      const before = text.slice(0, t.index);
      const line = before.split("\n").length;
      issues.push({ file: rel, line, type: "empty-lesson-summary", title: t[1] });
    }
  }

  const titles = [...text.matchAll(/title:\s*["'`]([^"'`]+)["'`]/g)].map((x) => x[1]);
  const counts = new Map();
  for (const t of titles) counts.set(t, (counts.get(t) || 0) + 1);
  for (const [t, c] of counts) {
    if (c > 1) issues.push({ file: rel, type: "dup-title", title: t, count: c });
  }
}

for (const f of files) scan(f);

const byType = new Map();
for (const i of issues) byType.set(i.type, (byType.get(i.type) || 0) + 1);

console.log("=== SUMMARY ===");
for (const [t, c] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${c}\t${t}`);
}
console.log("Total issues:", issues.length);

const shorts = issues.filter((i) => i.type === "short-field" || i.type === "short-lesson-summary");
console.log("\n=== SHORT (" + shorts.length + ") ===");
shorts.slice(0, 50).forEach((i) =>
  console.log(`${i.file}:${i.line} (${i.len}) ${i.title || i.field}: ${i.sample}`),
);

const latin = issues.filter((i) => i.type === "latin-typo" || i.type === "latin-in-arabic");
console.log("\n=== LATIN (" + latin.length + ") ===");
latin.slice(0, 40).forEach((i) =>
  console.log(`${i.file}:${i.line} ${i.sample} | ${(i.ctx || "").slice(0, 80)}`),
);

const placeholders = issues.filter((i) => i.type === "placeholder" || i.type === "incomplete-marker");
console.log("\n=== PLACEHOLDERS (" + placeholders.length + ") ===");
placeholders.forEach((i) => console.log(`${i.file}:${i.line} ${i.sample}`));

fs.writeFileSync(
  OUT,
  JSON.stringify({ scannedAt: new Date().toISOString(), byType: Object.fromEntries(byType), issues }, null, 2),
);
console.log("\nWrote", OUT);
