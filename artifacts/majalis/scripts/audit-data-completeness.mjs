#!/usr/bin/env node
/**
 * audit:data-completeness — بيانات المحتوى الحرجة (أنبياء، بريد قديم، مصادر وهمية).
 * P0 عند كسر قواعد المحتوى العام؛ الناقص الجزئي = P1.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { finding, countBySeverity, exitCodeFromFindings } from "../../../scripts/ci/severity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, out: "" };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ""}${e.stderr || ""}` };
  }
}

{
  const r = run(process.execPath, ["--import", "tsx", "scripts/audit-content-quality.mjs"]);
  if (!r.ok) {
    findings.push(finding("P0", "audit-content-quality فشل (بريد قديم / أنبياء / حشو)", { code: "content-quality" }));
    console.error(r.out.slice(-2000));
  }
}

{
  const r = run(process.execPath, ["--import", "tsx", "src/lib/__tests__/prophets-final-routes.test.ts"]);
  if (!r.ok) {
    findings.push(finding("P0", "قصص الأنبياء ≠ 25 أو homepage fallback", { code: "prophets-25" }));
    console.error(r.out.slice(-1500));
  }
}

// مصادر وهمية في معرفة منشورة فقط (لا backups / تقارير تقنية)
const fakeSourceRe =
  /مصدر\s*وهمي|بدون\s*مصدر|موث[قّ]ة\s*بدون\s*مصدر|"source"\s*:\s*"(N\/?A|TODO|tbd|fake|placeholder)"/i;
const SKIP_DIR = /(^|\/)(\.backup|backup|node_modules|deleted-|needs-post-review|open-platform|governance|release-audit|islamic-intelligence)(\/|$)/i;
const knowledgeRoots = [resolve(root, "public/data/knowledge")];
let scanned = 0;
for (const dir of knowledgeRoots) {
  if (!existsSync(dir)) continue;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const p = join(cur, ent.name);
      if (ent.isDirectory()) {
        if (SKIP_DIR.test(p)) continue;
        stack.push(p);
      } else if (/\.(json|jsonl)$/i.test(ent.name)) {
        if (SKIP_DIR.test(p) || /deleted-|backup/i.test(ent.name)) continue;
        scanned += 1;
        const text = readFileSync(p, "utf8");
        if (fakeSourceRe.test(text)) {
          findings.push(
            finding("P0", `مصدر وهمي/ناقص في ${p.replace(root + "/", "")}`, { path: p }),
          );
        }
      }
    }
  }
}

const counts = countBySeverity(findings);
console.log(
  JSON.stringify(
    {
      audit: "data-completeness",
      scanned_files: scanned,
      ...counts,
      merge_ok: counts.P0 === 0,
      findings,
    },
    null,
    2,
  ),
);
process.exit(exitCodeFromFindings(findings));
