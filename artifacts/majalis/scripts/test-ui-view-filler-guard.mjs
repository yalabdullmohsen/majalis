#!/usr/bin/env node
/**
 * حارس الحشو في أوصاف صفحات الواجهة — يمنع عودة enrich الآلي (2026-08-24).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "src/pages/fiqh/ui/JanazaView.tsx",
  "src/pages/fiqh/ui/MawarithView.tsx",
  "src/pages/fiqh/ui/HajjView.tsx",
  "src/views/SujoodSahwPage.tsx",
  "src/views/TawbaPage.tsx",
  "src/views/SawmPage.tsx",
  "src/views/AdabTalabIlmPage.tsx",
  "src/pages/quran/ui/UlumQuranView.tsx",
];

const BANNED = [
  "— .",
  "دليل تعليمي منظم",
  "يُستحسن التثبت من الدليل والعمل بما يرضي الله",
  "من الأحكام والآداب الشرعية المأثورة",
  "من أصول علم الفرائض المعتمد",
  "من أسباب سجود السهو في الصلاة يُراعى",
  "مرجع معتمد في المجلس العلمي. دليل تعليمي",
];

const violations = [];
for (const rel of FILES) {
  const src = readFileSync(path.join(ROOT, rel), "utf-8");
  for (const phrase of BANNED) {
    if (src.includes(phrase)) {
      violations.push(`${rel}: «${phrase.slice(0, 40)}…»`);
    }
  }
  // جمل مقطوعة تنتهي بـ «من» أو «في» أو «مع»
  const trunc = src.match(/(?:desc|description|text):\s*"[^"]*\s(?:من|في|مع)\s*"/g);
  if (trunc) {
    for (const t of trunc.slice(0, 3)) {
      violations.push(`${rel}: جملة مقطوعة …${t.slice(-50)}`);
    }
  }
}

if (violations.length) {
  console.error(`✗ حارس حشو الواجهة: ${violations.length} مخالفة\n`);
  violations.forEach((v) => console.error("  • " + v));
  process.exit(1);
}
console.log(`✓ حارس حشو الواجهة: ${FILES.length} ملفًا بلا حشو قالبية.`);
