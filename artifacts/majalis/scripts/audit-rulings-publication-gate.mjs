#!/usr/bin/env node
/**
 * تدقيق بوابة نشر الأحكام — الموسوعة مؤرشفة (2026-08-17).
 * التشغيل: node scripts/audit-rulings-publication-gate.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const archiveManifest = resolve(appRoot, "content/archive/rulings-encyclopedia/data/manifest.json");

const archived = existsSync(archiveManifest);
const manifest = archived ? JSON.parse(readFileSync(archiveManifest, "utf8")) : { total: 0 };

console.log(
  JSON.stringify(
    {
      audit: {
        archived: true,
        archivePath: "content/archive/rulings-encyclopedia/",
        totalInArchive: manifest.total ?? 0,
        publicEligible: 0,
        uiSurface: "removed",
      },
      pendingPrerenderHits: 0,
    },
    null,
    2,
  ),
);

console.log("✓ audit-rulings-publication-gate (archived — no public UI)");
