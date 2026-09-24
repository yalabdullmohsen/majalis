#!/usr/bin/env node
/**
 * Touch/Interaction static scan — قواعد CSS تفاعلية تحت 44px.
 * node scripts/interaction-touch-static-audit.mjs
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(majalisRoot, "../..");
const srcRoot = join(majalisRoot, "src");
const interactiveHint =
  /button|btn|tab|chip|toggle|icon-btn|nav__|controls__|pressable|filter|menu-item|fab|page-arrow|favorite|toolbar/i;

function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist"].includes(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".css")) out.push(p);
  }
  return out;
}

const toPx = (v, u) => (u === "rem" ? parseFloat(v) * 16 : parseFloat(v));
const under = [];
for (const f of walk(srcRoot)) {
  const text = readFileSync(f, "utf8");
  const re = /([^{}]+)\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const sel = m[1];
    const body = m[2];
    if (!interactiveHint.test(sel) || /@keyframes|keyframes/.test(sel)) continue;
    const mw = body.match(/min-width:\s*([\d.]+)(px|rem)/);
    const mh = body.match(/min-height:\s*([\d.]+)(px|rem)/);
    const issues = [];
    if (mw) {
      const px = toPx(mw[1], mw[2]);
      if (px > 0 && px < 44) issues.push(`min-width ${px}px`);
    }
    if (mh) {
      const px = toPx(mh[1], mh[2]);
      if (px > 0 && px < 44) issues.push(`min-height ${px}px`);
    }
    if (issues.length) {
      under.push({
        file: relative(majalisRoot, f),
        sel: sel.trim().replace(/\s+/g, " ").slice(0, 120),
        issues,
      });
    }
  }
}

let commit = "UNKNOWN";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
} catch {
  /* ignore */
}

const mushafCss = readFileSync(join(majalisRoot, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const report = {
  schemaVersion: 1,
  measuredAt: new Date().toISOString(),
  commit,
  interactiveCssRulesUnder44: under.length,
  samples: under.slice(0, 100),
  mushafContracts: {
    controlsBtnUsesTouchComfortable: /nm-controls__btn[\s\S]{0,280}--touch-comfortable/.test(mushafCss),
    chromeMotion180: /--ss-chrome-motion|--ss-chrome-motion, 180ms|180ms ease/.test(mushafCss),
    pageArrow48: /\.nm-page-arrow[\s\S]{0,200}--touch-comfortable/.test(mushafCss),
  },
  note: "Static CSS only — runtime hit-testing NOT_MEASURED without Playwright/device.",
};

const outDir = join(repoRoot, "docs/qa");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "interaction-touch-under44-static.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ commit, under44: under.length, mushafContracts: report.mushafContracts }, null, 2));
