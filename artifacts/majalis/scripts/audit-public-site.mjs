#!/usr/bin/env node
/**
 * audit:public-site — روابط/مسارات عامة + استثناء admin من الفهرسة.
 * P0 فقط للصفحات العامة المكسورة / homepage fallback / admin بلا noindex.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { finding, countBySeverity, exitCodeFromFindings } from "../../../scripts/ci/severity.mjs";
import { isPrivateSeoPath } from "./seo-path-class.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];

function runNode(script) {
  try {
    execFileSync(process.execPath, ["--import", "tsx", script], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, out: "" };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ""}${e.stderr || ""}${e.message || ""}` };
  }
}

// 1) أنبياء + بلا homepage fallback
{
  const r = runNode("src/lib/__tests__/prophets-final-routes.test.ts");
  if (!r.ok) {
    findings.push(finding("P0", `prophets-final-routes فشل — احتمال homepage fallback أو نقص قصص`, { code: "prophets" }));
    console.error(r.out.slice(-1500));
  }
}

// 2) ترابط داخلي
{
  const r = runNode("src/lib/__tests__/site-interlink.test.ts");
  if (!r.ok) {
    findings.push(finding("P0", "site-interlink: روابط داخلية عامة مكسورة", { code: "interlink" }));
    console.error(r.out.slice(-1500));
  }
}

// 3) admin خارج sitemap + robots Disallow
{
  const sitemapPath = resolve(root, "public/sitemap.xml");
  const robotsPath = resolve(root, "public/robots.txt");
  if (existsSync(sitemapPath)) {
    const sm = readFileSync(sitemapPath, "utf8");
    if (/https?:\/\/[^<\s]+\/admin(\/|"|<)/i.test(sm)) {
      findings.push(finding("P0", "مسارات /admin ظهرت في sitemap.xml", { path: "/admin" }));
    }
  } else {
    findings.push(finding("P1", "sitemap.xml غير موجود محليًا"));
  }
  if (existsSync(robotsPath)) {
    const rb = readFileSync(robotsPath, "utf8");
    if (!/Disallow:\s*\/admin/i.test(rb)) {
      findings.push(finding("P0", "robots.txt يجب Disallow: /admin"));
    }
  }
}

// 4) seo-routes: كل admin noindex
{
  const seo = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8"));
  for (const r of seo.routes || []) {
    if (!isPrivateSeoPath(r.path)) continue;
    if (!String(r.robots || "").includes("noindex")) {
      findings.push(finding("P0", `${r.path} يجب noindex`, { path: r.path }));
    }
    if (r.sitemap !== false) {
      findings.push(finding("P0", `${r.path} يجب sitemap:false`, { path: r.path }));
    }
  }
  findings.push(
    finding("admin", `استُثني ${(seo.routes || []).filter((r) => isPrivateSeoPath(r.path)).length} مسار admin/private من فحوص SEO العامة`),
  );
}

const counts = countBySeverity(findings);
console.log(
  JSON.stringify(
    {
      audit: "public-site",
      ...counts,
      merge_ok: counts.P0 === 0,
      findings: findings.filter((f) => f.severity !== "admin"),
      admin_excluded: counts.admin,
    },
    null,
    2,
  ),
);
process.exit(exitCodeFromFindings(findings));
