#!/usr/bin/env node
/**
 * audit:seo — غلاف موحّد حول test-seo + خصوصية admin.
 * صفحات /admin/*: info فقط لطول الوصف؛ P0 للصفحات العامة فقط.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { finding, countBySeverity, exitCodeFromFindings, lineLooksP0 } from "../../../scripts/ci/severity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];

function runPnpmScript(name) {
  const r = spawnSync("pnpm", ["run", name], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return { ok: r.status === 0, out, status: r.status };
}

const seo = runPnpmScript("test:seo");
const pagesMatch = seo.out.match(/الصفحات المفحوصة:\s*(\d+)/);
const pages = pagesMatch ? Number(pagesMatch[1]) : null;
const adminInfoMatch = seo.out.match(/معلومات \(admin\):\s*(\d+)/);
const adminInfos = adminInfoMatch ? Number(adminInfoMatch[1]) : 0;

if (!seo.ok) {
  const lines = seo.out.split("\n").filter((l) => lineLooksP0(l) || /❌/.test(l));
  if (lines.length) {
    for (const line of lines.slice(0, 40)) {
      if (/\[admin\]|معلومات \(admin\)/i.test(line)) {
        findings.push(finding("admin", line.trim()));
      } else if (lineLooksP0(line) || /❌\s*\[P0\]/.test(line)) {
        findings.push(finding("P0", line.replace(/❌\s*\[P0\]\s*/g, "").trim()));
      } else {
        findings.push(finding("P1", line.trim()));
      }
    }
  } else {
    findings.push(finding("P0", "test:seo فشل بدون تفاصيل P0 واضحة"));
  }
  console.error(seo.out.slice(-3000));
} else {
  findings.push(
    finding("admin", `admin infos=${adminInfos} — لا تُحسب P0`),
  );
}

const counts = countBySeverity(findings);
console.log(
  JSON.stringify(
    {
      audit: "seo",
      pages_checked: pages,
      admin_infos: adminInfos,
      ...counts,
      merge_ok: counts.P0 === 0,
      note: "/admin/* noindex + خارج sitemap؛ طول الوصف admin ليس P0",
    },
    null,
    2,
  ),
);
process.exit(exitCodeFromFindings(findings));
