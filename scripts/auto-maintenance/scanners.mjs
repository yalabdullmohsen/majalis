/**
 * ماسحات الصيانة التلقائية — قراءة فقط إلا عند apply.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { classifyFinding, isShariaSensitivePath } from "./policy.mjs";

/**
 * @param {string} root
 * @returns {Array<object>}
 */
export function scanCacheContract(root) {
  const findings = [];
  const vercelPath = join(root, "artifacts/majalis/vercel.json");
  if (!existsSync(vercelPath)) {
    findings.push({
      id: "cache-missing-vercel",
      kind: "cache-header-contract",
      severity: "high",
      message: "vercel.json مفقود",
      path: "artifacts/majalis/vercel.json",
    });
    return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
  }
  const raw = readFileSync(vercelPath, "utf8");
  /** HTML: max-age=0 أو no-cache كافٍ؛ version/sw: no-cache|no-store */
  const strictNoStore = ["/version.json", "/sw.js", "/sw-version.js"];
  const htmlFresh = ["/index.html", "/"];
  for (const route of strictNoStore) {
    const escaped = route.replace(".", "\\.");
    const re = new RegExp(
      `"source"\\s*:\\s*"${escaped}"[\\s\\S]{0,400}?Cache-Control"[\\s\\S]{0,120}?(no-cache|no-store)`,
      "i",
    );
    if (!re.test(raw)) {
      findings.push({
        id: `cache-${route}`,
        kind: "cache-header-contract",
        severity: "high",
        message: `مسار ${route} بلا Cache-Control no-cache/no-store في vercel.json`,
        path: "artifacts/majalis/vercel.json",
      });
    }
  }
  for (const route of htmlFresh) {
    const escaped = route === "/" ? "/" : route.replace(".", "\\.");
    const re = new RegExp(
      `"source"\\s*:\\s*"${escaped === "/" ? "/" : escaped}"[\\s\\S]{0,400}?Cache-Control"[\\s\\S]{0,120}?(no-cache|no-store|max-age=0)`,
      "i",
    );
    if (!re.test(raw)) {
      findings.push({
        id: `cache-${route === "/" ? "root" : route}`,
        kind: "cache-header-contract",
        severity: "high",
        message: `مسار ${route} بلا إبطال كاش فوري (max-age=0/no-cache) في vercel.json`,
        path: "artifacts/majalis/vercel.json",
      });
    }
  }
  const hook = join(root, "artifacts/majalis/src/hooks/useVersionCheck.ts");
  if (!existsSync(hook) || !/version\.json|isNewVersionAvailable/.test(readFileSync(hook, "utf8"))) {
    findings.push({
      id: "version-check-hook",
      kind: "version-check-contract",
      severity: "high",
      message: "useVersionCheck لا يفحص /version.json",
      path: "artifacts/majalis/src/hooks/useVersionCheck.ts",
    });
  }
  return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
}

/**
 * بحث عن أسرار ظاهرة في الملفات المتتبَّعة بـgit فقط (لا .env.local المحلي).
 * @param {string} root
 */
export function scanSecrets(root) {
  const findings = [];
  const patterns = [
    {
      id: "private-key",
      re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      message: "مفتاح خاص ظاهر في المستودع",
    },
    {
      id: "sk-ant-live",
      re: /sk-ant-api\d{2}-[A-Za-z0-9_-]{20,}/,
      message: "مفتاح Anthropic حي ظاهر",
    },
  ];

  const listed = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (listed.status !== 0) {
    findings.push({
      id: "secrets-git-ls-failed",
      kind: "secret-rotation",
      severity: "moderate",
      message: "تعذّر git ls-files لمسح الأسرار",
    });
    return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
  }
  const files = (listed.stdout || "")
    .split("\0")
    .filter(Boolean)
    .filter((p) => {
      if (/\.env(\.|$)/i.test(p) && !/\.example/i.test(p)) return false;
      if (/node_modules|\.git\//.test(p)) return false;
      return /\.(ts|tsx|js|mjs|cjs|json|yml|yaml|md|txt)$/i.test(p);
    });

  for (const rel of files) {
    if (/\.example/i.test(rel)) continue;
    if (/CONTINUATION_PLAN\.md$/i.test(rel)) continue;
    const full = join(root, rel);
    let text;
    try {
      const st = statSync(full);
      if (st.size > 1_500_000) continue;
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    for (const p of patterns) {
      if (p.re.test(text)) {
        findings.push({
          id: `secret-${p.id}-${rel}`,
          kind: "secret-rotation",
          severity: "critical",
          message: `${p.message}: ${rel}`,
          path: rel,
        });
      }
    }
  }

  return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
}

/**
 * ملخص pnpm audit (بدون ترقية تلقائية).
 * @param {string} root
 */
export function scanNpmAudit(root) {
  const findings = [];
  const r = spawnSync("pnpm", ["audit", "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  let vulns = null;
  try {
    const j = JSON.parse(out);
    vulns = j.metadata?.vulnerabilities || j.vulnerabilities || null;
  } catch {
    // pnpm قد يطبع JSON مع سطور إضافية
    const start = out.indexOf("{");
    if (start >= 0) {
      try {
        const j = JSON.parse(out.slice(start));
        vulns = j.metadata?.vulnerabilities || null;
      } catch {
        /* ignore */
      }
    }
  }
  if (!vulns) {
    findings.push({
      id: "npm-audit-unavailable",
      kind: "dependency-major",
      severity: "moderate",
      message: "تعذّر قراءة pnpm audit — راجع يدويًا",
    });
    return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
  }
  const crit = Number(vulns.critical || 0);
  const high = Number(vulns.high || 0);
  const mod = Number(vulns.moderate || 0);
  if (crit + high + mod > 0) {
    findings.push({
      id: "npm-audit-summary",
      kind: crit > 0 || high > 5 ? "dependency-major" : "npm-audit-patch-only",
      severity: crit > 0 ? "critical" : high > 0 ? "high" : "moderate",
      message: `اعتماديات: critical=${crit} high=${high} moderate=${mod} — لا ترقية major تلقائيًا`,
      meta: vulns,
    });
  }
  return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
}

/**
 * نظافة بنيوية سريعة لملفات بيانات عامة (روابط فارغة / حقول ناقصة).
 * لا يعدّل نصوصًا شرعية.
 * @param {string} root
 */
export function scanDataHygiene(root) {
  const findings = [];
  const targets = [
    "artifacts/majalis/public/data/sources/instagram-quota.json",
    "artifacts/majalis/src/config/sections.registry.ts",
  ];

  for (const rel of targets) {
    const full = join(root, rel);
    if (!existsSync(full)) {
      findings.push({
        id: `missing-${rel}`,
        kind: "empty-optional-url",
        severity: "low",
        message: `ملف مرجعي مفقود: ${rel}`,
        path: rel,
      });
      continue;
    }
  }

  // عيّنة: فهرس الروابط في routes
  const routes = join(root, "artifacts/majalis/src/app/router/routes.ts");
  if (existsSync(routes)) {
    const text = readFileSync(routes, "utf8");
    if (!/\/adhan-help/.test(text) || !/\/adhan-settings/.test(text)) {
      findings.push({
        id: "routes-adhan-help",
        kind: "orphan-redirect",
        severity: "moderate",
        message: "مسارات الأذان/المساعدة ناقصة من routes.ts",
        path: "artifacts/majalis/src/app/router/routes.ts",
      });
    }
  }

  // روابط http فارغة في JSON عام (غير شرعي)
  const dataRoot = join(root, "artifacts/majalis/public/data");
  if (existsSync(dataRoot)) {
    /** @param {string} dir @param {number} depth */
    function walkJson(dir, depth) {
      if (depth > 3) return;
      let entries = [];
      try {
        entries = readdirSync(dir);
      } catch {
        return;
      }
      for (const name of entries) {
        const full = join(dir, name);
        let st;
        try {
          st = statSync(full);
        } catch {
          continue;
        }
        if (st.isDirectory()) {
          if (isShariaSensitivePath(full)) continue;
          walkJson(full, depth + 1);
          continue;
        }
        if (!name.endsWith(".json") || st.size > 500_000) continue;
        const rel = relative(root, full);
        if (isShariaSensitivePath(rel)) continue;
        let raw;
        try {
          raw = readFileSync(full, "utf8");
        } catch {
          continue;
        }
        if (/"url"\s*:\s*""/.test(raw) || /"href"\s*:\s*""/.test(raw)) {
          findings.push({
            id: `empty-url-${rel}`,
            kind: "empty-optional-url",
            severity: "low",
            message: `حقول url/href فارغة في ${rel}`,
            path: rel,
          });
        }
      }
    }
    walkJson(dataRoot, 0);
  }

  return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
}

/**
 * فحص إنتاج اختياري لـ version.json
 * @param {string} [baseUrl]
 */
export async function scanProductionVersion(baseUrl = "https://www.majlisilm.com") {
  const findings = [];
  if (process.env.AUTO_MAINTENANCE_SKIP_NETWORK === "1") {
    return findings;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/version.json`, {
      signal: ctrl.signal,
      headers: { "cache-control": "no-cache" },
    });
    clearTimeout(t);
    if (!res.ok) {
      findings.push({
        id: "prod-version-http",
        kind: "version-check-contract",
        severity: "high",
        message: `version.json HTTP ${res.status}`,
      });
    } else {
      const j = await res.json();
      if (!j.commit || j.commit === "unknown") {
        findings.push({
          id: "prod-version-commit",
          kind: "version-check-contract",
          severity: "high",
          message: "version.json بلا commit صالح على الإنتاج",
        });
      }
      const cc = res.headers.get("cache-control") || "";
      if (!/no-cache|no-store/i.test(cc)) {
        findings.push({
          id: "prod-version-cache-header",
          kind: "cache-header-contract",
          severity: "moderate",
          message: `إنتاج version.json Cache-Control غير صارم: ${cc || "(فارغ)"}`,
        });
      }
    }
  } catch (e) {
    findings.push({
      id: "prod-version-fetch",
      kind: "version-check-contract",
      severity: "moderate",
      message: `تعذّر جلب version.json: ${String(e?.message || e).slice(0, 120)}`,
    });
  }
  return findings.map((f) => ({ ...f, risk: classifyFinding(f) }));
}

/**
 * تشغيل كل الماسحات
 * @param {string} root
 * @param {{ network?: boolean }} [opts]
 */
export async function runAllScans(root, opts = {}) {
  const findings = [
    ...scanCacheContract(root),
    ...scanSecrets(root),
    ...scanNpmAudit(root),
    ...scanDataHygiene(root),
  ];
  if (opts.network !== false) {
    findings.push(...(await scanProductionVersion()));
  }
  return findings;
}
