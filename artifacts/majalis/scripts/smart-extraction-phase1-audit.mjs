#!/usr/bin/env node
/**
 * Phase 1 — Smart extraction system analysis report generator.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function grepFiles(dir, patterns) {
  const hits = [];
  if (!existsSync(dir)) return hits;
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory() && f.name !== "node_modules") hits.push(...grepFiles(p, patterns));
    else if (/\.(mjs|js|ts|tsx)$/.test(f.name)) {
      const content = readFileSync(p, "utf8");
      for (const pat of patterns) {
        if (pat.re.test(content)) hits.push({ file: p.replace(ROOT + "/", ""), type: pat.type });
      }
    }
  }
  return hits;
}

const IMAGE_ENTRY_POINTS = [
  { path: "lib/api-handlers/admin/lesson-from-image.js", label: "Admin lesson-from-image API" },
  { path: "lib/api-handlers/admin/smart-cms.js", label: "Smart CMS image upload" },
  { path: "lib/cms/instagram-manual-assist.mjs", label: "Instagram manual assist" },
  { path: "lib/cms/ai-source-pipeline.mjs", label: "AI source pipeline" },
  { path: "lib/cms/url-import-service.mjs", label: "URL import (OG images)" },
  { path: "lib/cms/lesson-intelligence/extractors/index.mjs", label: "Lesson intelligence extractors" },
  { path: "lib/majlis-knowledge-engine/vision-intelligence.mjs", label: "Vision intelligence MKM" },
  { path: "src/views/admin/LessonImportImagePage.tsx", label: "UI: Lesson import image" },
  { path: "src/views/admin/SmartCmsSection.tsx", label: "UI: Smart CMS" },
];

const claudeHits = grepFiles(join(ROOT, "lib"), [{ type: "claude", re: /messages\.create|Anthropic|claude-sonnet/i }]);
const openaiHits = grepFiles(join(ROOT, "lib"), [{ type: "openai", re: /api\.openai\.com|OPENAI_API_KEY/i }]);
const ocrHits = grepFiles(join(ROOT, "lib"), [{ type: "ocr", re: /runLocalOcr|runSmartOcr|tesseract|local-ocr|OCR/i }]);

const report = {
  at: new Date().toISOString(),
  phase: 1,
  imageEntryPoints: IMAGE_ENTRY_POINTS.filter((e) => existsSync(join(ROOT, e.path))),
  claudeCallSites: [...new Set(claudeHits.map((h) => h.file))],
  openaiCallSites: [...new Set(openaiHits.map((h) => h.file))],
  ocrCallSites: [...new Set(ocrHits.map((h) => h.file))],
  duplication: [
    "lesson-extractor.mjs was calling Claude directly AND vision-provider-fallback (FIXED → smart pipeline only)",
    "local-ocr.mjs and rule-engine.mjs both had entity extraction regex (CONSOLIDATED → rule-engine primary)",
    "vision-intelligence.mjs duplicates lesson-extractor entry (LEGACY — still calls extractLessonFromImage)",
  ],
  latencyPoints: [
    "Direct Claude vision call before OCR (REMOVED)",
    "Sequential enrich prompt after vision (REMOVED for rule-sufficient cases)",
    "Connector health batched 5/check (unchanged)",
    "Tesseract optional cold start (mitigated by rules-first path)",
  ],
  failurePoints: [
    "Anthropic billing exhaustion → manual review (handled)",
    "Missing API keys → rules/OCR/manual (handled)",
    "OCR empty on image-only without tesseract → AI or manual (handled)",
    "Invalid date → validation rejection (handled)",
  ],
  newPipeline: "lib/ai/smart-extraction/pipeline.mjs",
};

const md = `# Phase 1 — Smart Extraction System Analysis

**Date:** ${report.at}

## Image Entry Points (${report.imageEntryPoints.length})

${report.imageEntryPoints.map((e) => `- **${e.label}** — \`${e.path}\``).join("\n")}

## Claude Call Sites (${report.claudeCallSites.length})

${report.claudeCallSites.slice(0, 25).map((f) => `- \`${f}\``).join("\n")}

## OpenAI Call Sites (${report.openaiCallSites.length})

${report.openaiCallSites.slice(0, 25).map((f) => `- \`${f}\``).join("\n")}

## OCR Call Sites (${report.ocrCallSites.length})

${report.ocrCallSites.slice(0, 20).map((f) => `- \`${f}\``).join("\n")}

## Duplication (before refactor)

${report.duplication.map((d) => `- ${d}`).join("\n")}

## Latency Points

${report.latencyPoints.map((d) => `- ${d}`).join("\n")}

## Failure Points

${report.failurePoints.map((d) => `- ${d}`).join("\n")}

## New Pipeline

\`${report.newPipeline}\`

Image → Preprocess → OCR → Rule Engine → Confidence → Decision → AI (optional) → Validation → Publishing
`;

const outJson = join(ROOT, "reports/smart-extraction-phase1-audit.json");
const outMd = join(ROOT, "reports/smart-extraction-phase1-audit.md");
mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, JSON.stringify(report, null, 2));
writeFileSync(outMd, md);
console.log(md);
console.log(`\nSaved: ${outMd}`);
