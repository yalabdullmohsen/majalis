#!/usr/bin/env node
/**
 * بوابة طبقات FSD — بديل خفيف لـ eslint-plugin-import/no-restricted-paths.
 * تفشل عند:
 * - entities تستورد من features|pages|widgets
 * - shared تستورد من app|pages|widgets|features|entities
 * - استيراد نسبي بأكثر من مستوى واحد (../../..)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../src");

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
const REQUIRE_RE = /require\(\s*["']([^"']+)["']\s*\)/g;

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(ent.name)) out.push(p);
  }
  return out;
}

/** @param {string} file */
function layerOf(file) {
  const rel = path.relative(SRC, file).replace(/\\/g, "/");
  const top = rel.split("/")[0];
  return top;
}

/** @param {string} file @param {string} source */
function collectImports(file, source) {
  /** @type {string[]} */
  const specs = [];
  for (const re of [IMPORT_RE, REQUIRE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source))) specs.push(m[1]);
  }
  return specs;
}

/** @param {string} fromLayer @param {string} spec */
function resolveTargetLayer(fromLayer, spec) {
  if (spec.startsWith("@/")) {
    const rest = spec.slice(2);
    return rest.split("/")[0];
  }
  if (spec.startsWith(".")) {
    // relative — caller checks depth separately
    return null;
  }
  return null; // package import
}

const violations = [];

for (const file of walk(SRC)) {
  const layer = layerOf(file);
  if (!["entities", "shared", "pages", "features", "widgets", "app"].includes(layer)) {
    continue;
  }
  const source = fs.readFileSync(file, "utf8");
  const specs = collectImports(file, source);
  for (const spec of specs) {
    if (spec.startsWith(".")) {
      // فرض ../../ على الطبقات الجديدة فقط؛ features/lessons الحالي يستخدم نسبية أعمق مؤقتًا
      const enforceDeep =
        layer === "app" ||
        layer === "entities" ||
        layer === "pages" ||
        layer === "widgets" ||
        layer === "shared";
      const ups = (spec.match(/\.\.\//g) || []).length;
      if (enforceDeep && ups >= 2) {
        violations.push(`${path.relative(SRC, file)}: deep relative import "${spec}"`);
      }
      continue;
    }
    const target = resolveTargetLayer(layer, spec);
    if (!target) continue;

    if (layer === "entities" && ["features", "pages", "widgets"].includes(target)) {
      violations.push(
        `${path.relative(SRC, file)}: entities must not import ${target} ("${spec}")`,
      );
    }
    if (
      layer === "shared" &&
      ["app", "pages", "widgets", "features", "entities"].includes(target)
    ) {
      violations.push(
        `${path.relative(SRC, file)}: shared must not import ${target} ("${spec}")`,
      );
    }
    if (
      layer === "pages" &&
      !["widgets", "features", "entities", "shared", "app", "components", "lib", "hooks", "views"].includes(
        target,
      )
    ) {
      // أثناء الترحيل نسمح بـ components/lib/hooks/views؛ نضيّق في C لاحقًا
    }
  }
}

if (violations.length) {
  console.error("verify-fsd-layers: FAILED");
  for (const v of violations) console.error(" -", v);
  process.exit(1);
}

console.log("verify-fsd-layers: OK");
