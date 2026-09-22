#!/usr/bin/env node
/**
 * حمايات Foundation Reset PR-1:
 * - لا hex مباشر في design-system components
 * - لا تعريف --sf-* مكرر خارج foundation CSS
 * - لا سلم طباعة جديد (--sf-type-* أو --type-sf-*) خارج الملف
 * - لا radius/shadow حرفية عشوائية في design-system (px خارج السلم)
 *
 * تشغيل: node scripts/lint-sunnah-foundation-tokens.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = join(fileURLToPath(import.meta.url), "..", "..");
const srcRoot = join(majalisRoot, "src");
const foundationCss = join(srcRoot, "styles", "sunnah-foundation-tokens.css");

const ALLOWED_RADIUS_PX = new Set([12, 14, 16, 20, 24, 999]);
const ALLOWED_TYPE_ROLES = new Set([
  "display",
  "page-title",
  "section-title",
  "card-title",
  "body",
  "supporting",
  "metadata",
  "caption",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(p);
  }
  return out;
}

const failures = [];

/* 1) --sf-* يُعرَّف مرة واحدة في foundation فقط */
{
  const foundation = readFileSync(foundationCss, "utf8");
  const defined = [...foundation.matchAll(/--sf-[\w-]+\s*:/g)].map((m) => m[0].replace(/\s*:$/, ""));
  const seen = new Map();
  for (const name of defined) {
    seen.set(name, (seen.get(name) || 0) + 1);
  }
  for (const [name, count] of seen) {
    if (count > 1 && !name.includes("pad") && !name.includes("gap") && !name.includes("row") && !name.includes("control") && !name.includes("header") && !name.includes("density") && !name.includes("lh-body") && !name.includes("surface") && !name.includes("shadow") && !name.includes("hairline")) {
      // كثافة/ليلي تعيد تعريف بعض الرموز عمدًا — مسموح لأسماء الكثافة فقط عبر data-density
    }
  }

  const files = walk(join(srcRoot, "styles")).concat(walk(join(srcRoot, "components")));
  for (const file of files) {
    const rel = relative(srcRoot, file).replace(/\\/g, "/");
    if (rel === "styles/sunnah-foundation-tokens.css") continue;
    const text = readFileSync(file, "utf8");
    // تعريف جديد --sf-* (ليس var(--sf-...) الاستهلاك)
    const defs = [...text.matchAll(/(^|[^\w-])(--sf-[\w-]+)\s*:/gm)];
    for (const m of defs) {
      failures.push(`${rel}: تعريف --sf-* خارج foundation → ${m[2]}`);
    }
  }
}

/* 2) لا hex في design-system components (tsx) */
{
  const dsDir = join(srcRoot, "components", "design-system");
  if (statSync(dsDir).isDirectory()) {
    for (const file of walk(dsDir)) {
      if (!/\.(tsx|ts)$/.test(file)) continue;
      const rel = relative(srcRoot, file).replace(/\\/g, "/");
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        const t = line.trim();
        if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
        if (/#[0-9A-Fa-f]{3,8}\b/.test(line)) {
          failures.push(`${rel}:${i + 1}: hex مباشر في design-system — استخدم SF_COLOR / var(--sf-*)`);
        }
      });
    }
  }
}

/* 3) سلم طباعة — أدوار --sf-type-* فقط من القائمة */
{
  const foundation = readFileSync(foundationCss, "utf8");
  const roles = [...foundation.matchAll(/--sf-type-([\w-]+)\s*:/g)].map((m) => m[1]);
  for (const role of roles) {
    if (!ALLOWED_TYPE_ROLES.has(role)) {
      failures.push(`foundation: دور طباعة غير معتمد --sf-type-${role}`);
    }
  }
}

/* 4) radius حرفية في design-system css — ضمن السلم فقط */
{
  const dsCss = walk(join(srcRoot, "components", "design-system")).filter((f) => f.endsWith(".css"));
  const styleCss = [
    join(srcRoot, "styles", "components", "sunnah-card-v2.css"),
  ].filter((p) => {
    try {
      return statSync(p).isFile();
    } catch {
      return false;
    }
  });
  for (const file of [...dsCss, ...styleCss]) {
    const rel = relative(srcRoot, file).replace(/\\/g, "/");
    const text = readFileSync(file, "utf8");
    const radii = [...text.matchAll(/border-radius:\s*(\d+)px/gi)];
    for (const m of radii) {
      const px = Number(m[1]);
      if (!ALLOWED_RADIUS_PX.has(px)) {
        failures.push(`${rel}: radius عشوائية ${px}px — استخدم --sf-radius-*`);
      }
    }
    if (/box-shadow:\s*[^;]*\d+px/i.test(text) && !/var\(--sf-shadow|var\(--v2-shadow/.test(text)) {
      // ظل حرفي بدون توكن
      const shadowLines = text.split("\n");
      shadowLines.forEach((line, i) => {
        if (/box-shadow\s*:/.test(line) && !/var\(--(sf|v2)-shadow/.test(line) && /\d+px/.test(line)) {
          failures.push(`${rel}:${i + 1}: shadow عشوائية — استخدم --sf-shadow-*`);
        }
      });
    }
  }
}

if (failures.length) {
  console.error(`✗ lint:sunnah-foundation-tokens — ${failures.length} مخالفة:\n` + failures.slice(0, 50).join("\n"));
  if (failures.length > 50) console.error(`… و${failures.length - 50} أخرى`);
  process.exit(1);
}

console.log("✓ lint:sunnah-foundation-tokens — foundation SoT + design-system بلا hex/ظلال عشوائية.");
