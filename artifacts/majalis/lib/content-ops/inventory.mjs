/**
 * Content inventory — scans section-catalog.json. Never invents content.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND } from "./types.mjs";
import { isProtectedTarget } from "./protected-content-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "../..");
const CATALOG_PATH = join(__dirname, "data", "section-catalog.json");

export function loadSectionCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
}

function walkFiles(dir, out = [], depth = 0) {
  if (!existsSync(dir) || depth > 8) return out;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (ent.name === "node_modules" || ent.name === "dist" || ent.name.startsWith(".")) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out, depth + 1);
    else if (/\.(json|ts|tsx|md|mjs|js)$/i.test(ent.name)) out.push(full);
  }
  return out;
}

export function runFullInventory({ maxFilesPerSection = 400 } = {}) {
  const catalog = loadSectionCatalog();
  const sections = [];
  const records = [];
  const seen = new Set();
  const issueCounts = {};

  for (const section of catalog.sections || []) {
    const files = [];
    for (const g of section.globs || []) {
      const root = join(PKG_ROOT, String(g).replace(/\/\*\*$/, "").replace(/\*$/, ""));
      if (!existsSync(root)) continue;
      const st = statSync(root);
      if (st.isFile()) files.push(root);
      else files.push(...walkFiles(root));
    }
    const unique = [...new Set(files)].slice(0, maxFilesPerSection);
    let count = 0;
    for (const f of unique) {
      if (seen.has(f)) continue;
      seen.add(f);
      const rel = relative(PKG_ROOT, f).split("\\").join("/");
      const protectedHit = isProtectedTarget({ path: rel }) || Boolean(section.protected);
      try {
        const st = statSync(f);
        if (st.size > 8_000_000) {
          issueCounts.file_too_large = (issueCounts.file_too_large || 0) + 1;
          records.push({
            contentId: rel,
            path: rel,
            protected: protectedHit,
            issues: ["file_too_large"],
            sectionId: section.id,
          });
          count += 1;
          continue;
        }
        if (!f.endsWith(".json")) {
          records.push({
            contentId: rel,
            path: rel,
            protected: protectedHit,
            issues: [],
            sectionId: section.id,
          });
          count += 1;
          continue;
        }
        const parsed = JSON.parse(readFileSync(f, "utf8"));
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.items)
            ? parsed.items
            : null;
        if (list) {
          for (const it of list.slice(0, 5000)) {
            const issues = [];
            const title = it.title || it.name || it.nameAr || it.label || null;
            const body = it.body || it.text || it.description || it.summary || null;
            const source =
              it.source ||
              it.sourceId ||
              it.source_url ||
              it.officialUrl ||
              (Array.isArray(it.sources) && it.sources[0]) ||
              null;
            if (!title) issues.push("missing_title");
            if (!body) issues.push("missing_description");
            if (!source && !protectedHit) issues.push("missing_source");
            for (const i of issues) issueCounts[i] = (issueCounts[i] || 0) + 1;
            records.push({
              contentId: String(it.id || it.slug || `${rel}:${title || "anon"}`),
              title,
              path: rel,
              protected: protectedHit,
              issues,
              sectionId: section.id,
            });
            count += 1;
          }
          continue;
        }
        const issues = [];
        const title = parsed?.title || parsed?.name || null;
        const body = parsed?.body || parsed?.text || parsed?.description || null;
        const source = parsed?.source || parsed?.sourceId || parsed?.officialUrl || null;
        if (!title) issues.push("missing_title");
        if (!body) issues.push("missing_description");
        if (!source && !protectedHit) issues.push("missing_source");
        for (const i of issues) issueCounts[i] = (issueCounts[i] || 0) + 1;
        records.push({
          contentId: String(parsed?.id || rel),
          title,
          path: rel,
          protected: protectedHit,
          issues,
          sectionId: section.id,
        });
        count += 1;
      } catch {
        issueCounts.read_or_parse_error = (issueCounts.read_or_parse_error || 0) + 1;
        records.push({
          contentId: rel,
          path: rel,
          protected: protectedHit,
          issues: ["read_or_parse_error"],
          sectionId: section.id,
        });
        count += 1;
      }
    }
    sections.push({
      id: section.id,
      label: section.label,
      protected: Boolean(section.protected),
      filesFound: unique.length,
      recordsFound: count,
      missingRoot: unique.length === 0,
    });
  }

  const hash = createHash("sha256")
    .update(JSON.stringify({ n: records.length, s: sections.map((x) => x.id) }))
    .digest("hex")
    .slice(0, 16);

  return {
    brand: BRAND,
    inventoryId: `inv_${hash}`,
    generatedAt: new Date().toISOString(),
    sections,
    records,
    issueCounts,
    sectionCount: sections.length,
    sectionsAudited: sections.filter((s) => !s.missingRoot).length,
    sectionsMissing: sections.filter((s) => s.missingRoot).map((s) => s.id),
    totalRecords: records.length,
    protectedRecords: records.filter((r) => r.protected).length,
    incompleteRecords: records.filter((r) => (r.issues || []).length > 0).length,
  };
}

export function summarizeInventory(inv) {
  return {
    brand: inv.brand,
    inventoryId: inv.inventoryId,
    generatedAt: inv.generatedAt,
    sectionCount: inv.sectionCount,
    sectionsAudited: inv.sectionsAudited,
    sectionsMissing: inv.sectionsMissing,
    totalRecords: inv.totalRecords,
    protectedRecords: inv.protectedRecords,
    incompleteRecords: inv.incompleteRecords,
    issueCounts: inv.issueCounts,
  };
}
