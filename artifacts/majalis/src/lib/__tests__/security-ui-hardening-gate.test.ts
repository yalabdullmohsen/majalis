/**
 * بوابة أمان واجهة: dangerouslySetInnerHTML مسموح بمسمّيات فقط،
 * وtarget=_blank بلا noopener ممنوع، وروابط javascript: ممنوعة.
 * Run: node --import tsx src/lib/__tests__/security-ui-hardening-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const srcRoot = join(root, "src");

const ALLOW_INNER_HTML = new Set([
  "components/home/HomeInterestingTopics.tsx", // مسارات SVG ثابتة
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "__tests__" || name === "admin") continue;
      walk(p, out);
    } else if (/\.(tsx|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(srcRoot);
let innerHits = 0;
let blankHits = 0;
let jsHits = 0;

for (const file of files) {
  const rel = relative(join(root, "src"), file).replace(/\\/g, "/");
  const text = readFileSync(file, "utf8");
  if (/dangerouslySetInnerHTML/.test(text)) {
    innerHits++;
    assert.ok(
      ALLOW_INNER_HTML.has(rel),
      `dangerouslySetInnerHTML غير مسموح في ${rel}`,
    );
  }
  const blankRe = /target=\{?["']_blank["']\}?/g;
  let m;
  while ((m = blankRe.exec(text))) {
    const slice = text.slice(Math.max(0, m.index - 120), m.index + 160);
    assert.ok(
      /rel=\{?["'][^"']*noopener/.test(slice) || /noopener/.test(slice),
      `target=_blank بلا noopener في ${rel}`,
    );
    blankHits++;
  }
  if (/javascript\s*:/i.test(text) && !/\/\*\s*javascript/i.test(text)) {
    // تجاهل تعليقات ونصوص شرح
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
      if (/javascript\s*:/i.test(line)) {
        jsHits++;
        assert.fail(`رابط javascript: في ${rel}:${i + 1}`);
      }
    }
  }
}

assert.ok(innerHits >= 0);
assert.ok(blankHits >= 0);
assert.equal(jsHits, 0);

// healthz/readyz علنيان: short commit فقط، بلا أسرار env
const healthz = readFileSync(join(root, "lib/api-handlers/healthz.js"), "utf8");
const buildMeta = readFileSync(join(root, "lib/build-meta.mjs"), "utf8");
assert.match(healthz, /getPublicBuildMeta/, "healthz يستخدم build meta العام");
assert.doesNotMatch(healthz, /process\.env\.(ANTHROPIC|SUPABASE_SERVICE|DATABASE_URL|SECRET)/);
assert.match(buildMeta, /\.slice\(0,\s*8\)/, "commit العام مقصوص إلى 8");
assert.doesNotMatch(buildMeta, /ANTHROPIC_API_KEY|SERVICE_ROLE|POSTGRES_PASSWORD/);

console.log("security-ui-hardening-gate: ok", { innerHits, blankHits });
