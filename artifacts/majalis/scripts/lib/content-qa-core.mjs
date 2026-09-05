#!/usr/bin/env node
/**
 * نواة تدقيق المحتوى — مشتركة بين audit / fix / links / quality-gate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");

export const SCAN_DIRS = ["src", "content", "public/data", "seo-prerender"];
export const EXT_RE = /\.(tsx?|jsx?|json|md|html|mjs)$/i;
export const SKIP_DIR_RE =
  /(^|\/)(node_modules|dist|ios|android|\.git|\.cache|coverage|playwright-report|test-results|lhci-reports)(\/|$)/;
const MAX_FILE_BYTES = 1_500_000;

export function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

export function walkFiles(dirs = SCAN_DIRS) {
  const out = [];
  for (const d of dirs) {
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length) {
      const cur = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(cur, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        const p = path.join(cur, ent.name);
        const rel = path.relative(ROOT, p).replace(/\\/g, "/");
        if (SKIP_DIR_RE.test(rel)) continue;
        if (ent.isDirectory()) {
          stack.push(p);
          continue;
        }
        if (!EXT_RE.test(ent.name)) continue;
        try {
          const st = fs.statSync(p);
          if (!st.size || st.size > MAX_FILE_BYTES) continue;
        } catch {
          continue;
        }
        out.push(rel);
      }
    }
  }
  return out.sort();
}

export function isTestOrGateFile(rel) {
  return /__tests__|\.test\.|\.spec\.|gates?\.test|content\/audit\/|reports\/|content-qa-core|content-audit\.mjs|content-fix-safe|content-links-check|content-quality-gate|content-inventory/i.test(
    rel,
  );
}

/** فهارس بحث/تطبيع: الأشكال بلا همزة مقصودة للمطابقة الضبابية — لا تُوحَّد. */
export function isSearchNormIndex(rel) {
  return /(^|\/)(search\/index\.json|search-synonyms|search-tolerance|normalize|aliases?|spell(ing)?-map|uthmani|mind-maps-data|supabase\.ts|arabicSearchPatterns|arabic-search)/i.test(
    rel,
  );
}

export function isUiSoonAllowed(rel, snippet = "") {
  return (
    /comingSoon|isComingSoon|nav-soon|soon-badge|\/kids|ركن الأطفال|FORBIDDEN|assert\.doesNotMatch/i.test(
      `${rel}\n${snippet}`,
    ) || isTestOrGateFile(rel)
  );
}

function nearbyHas(text, index, needles, radius = 48) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + 24 + radius);
  const window = text.slice(start, end);
  return needles.some((n) => window.includes(n));
}

export function applyTermFixes(text, dictionaries, fileHint = "") {
  // لا تصلح جداول المرادفات/التطبيع/فهارس البحث — المفاتيح بلا همزة مقصودة للمطابقة
  if (isSearchNormIndex(fileHint) || /(synonym|normalize|aliases?|spell(ing)?-map|uthmani)/i.test(fileHint)) {
    return { text, count: 0, applied: [] };
  }
  let next = text;
  let count = 0;
  const applied = [];

  for (const dict of dictionaries) {
    for (const rule of dict.replacements || []) {
      if (!rule.safe || !rule.from || rule.from === rule.to) continue;
      if (!next.includes(rule.from)) continue;
      let local = 0;
      if (rule.excludeIfNearby?.length) {
        let last = 0;
        let rebuilt = "";
        let idx = next.indexOf(rule.from, last);
        while (idx !== -1) {
          if (nearbyHas(next, idx, rule.excludeIfNearby)) {
            rebuilt += next.slice(last, idx + rule.from.length);
          } else {
            rebuilt += next.slice(last, idx) + rule.to;
            local += 1;
          }
          last = idx + rule.from.length;
          idx = next.indexOf(rule.from, last);
        }
        rebuilt += next.slice(last);
        if (local > 0) {
          next = rebuilt;
          count += local;
          applied.push({ from: rule.from, to: rule.to, n: local });
        }
      } else {
        const parts = next.split(rule.from);
        local = parts.length - 1;
        if (local > 0) {
          next = parts.join(rule.to);
          count += local;
          applied.push({ from: rule.from, to: rule.to, n: local });
        }
      }
    }
    for (const g of dict.nameGuards || []) {
      if (!g.safe || !g.wrong || g.wrong === g.right) continue;
      if (!next.includes(g.wrong)) continue;
      const parts = next.split(g.wrong);
      const n = parts.length - 1;
      if (n > 0) {
        next = parts.join(g.right);
        count += n;
        applied.push({ from: g.wrong, to: g.right, n });
      }
    }
  }

  return { text: next, count, applied };
}


export function collectIssues(rel, text, dicts) {
  const issues = [];
  if (isTestOrGateFile(rel)) return issues;
  const skipTermScan = isSearchNormIndex(rel);
  const { arabic, islamic, blocked } = dicts;

  // أخفِ تعليقات السطر الواحد لتقليل الإنذارات الكاذبة في الشيفرة
  const scanText = text.replace(/^\s*\/\/.*$/gm, "");

  for (const rule of [
    ...(blocked.critical || []).map((x) => ({ ...x, severity: "critical" })),
    ...(blocked.high || []).map((x) => ({ ...x, severity: "high" })),
  ]) {
    let re;
    try {
      const flags = rule.flags?.includes("g") ? rule.flags : `${rule.flags || ""}g`;
      re = new RegExp(rule.pattern, flags);
    } catch {
      continue;
    }
    let m;
    while ((m = re.exec(scanText)) !== null) {
      const snippet = scanText.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20);
      if (/قريبًا|قريبا/.test(m[0]) && isUiSoonAllowed(rel, snippet)) continue;
      issues.push({
        file: rel,
        text: m[0].slice(0, 120),
        problem: rule.message || "عبارة محظورة",
        suggested: "حذف/استبدال بنص نهائي",
        severity: rule.severity,
        type: "blocked-phrase",
        reason: "قد يحتاج صياغة تحريرية",
        autoFixable: false,
      });
      if (issues.length > 80) return issues;
    }
  }

  if (/\.json$/i.test(rel) && /"(title|name|heading)"\s*:\s*""/.test(text)) {
    issues.push({
      file: rel,
      text: '""',
      problem: "عنوان/اسم فارغ",
      suggested: "تعبئة عنوان عربي دقيق",
      severity: "high",
      type: "empty-title",
      reason: "لا يمكن تخمين العنوان تلقائيًا",
      autoFixable: false,
    });
  }

  if (!skipTermScan) {
    for (const rule of [...(islamic.replacements || []), ...(arabic.replacements || [])]) {
      if (!rule.from || rule.from === rule.to) continue;
      let idx = text.indexOf(rule.from);
      while (idx !== -1) {
        if (!(rule.excludeIfNearby && nearbyHas(text, idx, rule.excludeIfNearby))) {
          issues.push({
            file: rel,
            text: rule.from,
            problem: `مصطلح/إملاء غير موحّد — يُفضّل «${rule.to}»`,
            suggested: rule.to,
            severity: rule.safe ? "medium" : "low",
            type: "term",
            reason: rule.safe ? "قابل للإصلاح الآمن" : "يحتاج مراجعة سياقية",
            autoFixable: !!rule.safe,
          });
          break;
        }
        idx = text.indexOf(rule.from, idx + rule.from.length);
      }
    }

    for (const g of islamic.nameGuards || []) {
      if (g.safe && g.wrong && text.includes(g.wrong)) {
        issues.push({
          file: rel,
          text: g.wrong,
          problem: "اسم غير مضبوط إملائيًا",
          suggested: g.right,
          severity: "medium",
          type: "proper-name",
          reason: "قابل للإصلاح الآمن",
          autoFixable: true,
        });
      }
    }
  }

  return issues;
}

export function loadDictionaries() {
  return {
    arabic: loadJson("content/audit/arabic-terms.json"),
    islamic: loadJson("content/audit/islamic-terms.json"),
    blocked: loadJson("content/audit/blocked-phrases.json"),
  };
}

export function severityRank(s) {
  return { critical: 4, high: 3, medium: 2, low: 1, info: 0 }[s] || 0;
}

export function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

export function writeText(rel, text) {
  fs.writeFileSync(path.join(ROOT, rel), text, "utf8");
}
