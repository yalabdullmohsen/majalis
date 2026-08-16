#!/usr/bin/env node
/**
 * audit:feature-readiness — جاهزية الميزات محليًا (بدون استدعاء إنتاج).
 * P0 إن فُقد سجل الميزات أو مسارات حرجة؛ الإنتاج = P2/تحذير.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { finding, countBySeverity, exitCodeFromFindings } from "../../../scripts/ci/severity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];

const registry = resolve(root, "data/feature-registry.json");
if (!existsSync(registry)) {
  findings.push(finding("P0", "data/feature-registry.json مفقود"));
} else {
  try {
    const data = JSON.parse(readFileSync(registry, "utf8"));
    const features = data.features || data.items || [];
    if (!Array.isArray(features) || features.length < 1) {
      findings.push(finding("P1", "سجل الميزات فارغ أو بصيغة غير متوقعة"));
    } else {
      let partial = 0;
      for (const f of features) {
        const status = String(f.status || f.state || "").toLowerCase();
        if (/partial|pending|wip|draft/.test(status)) {
          partial += 1;
          const hasBadge = Boolean(f.badge || f.label || f.uiBadge || f.warning);
          if (!hasBadge) {
            findings.push(
              finding("P1", `ميزة partial بلا badge: ${f.id || f.key || f.name || "?"}`),
            );
          }
        }
      }
      findings.push(finding("admin", `features=${features.length}, partial=${partial}`));
    }
  } catch (e) {
    findings.push(finding("P0", `تعذّر قراءة feature-registry: ${e.message}`));
  }
}

const criticalRoutes = [
  "src/pages/worship/PrayerTimesPage.tsx",
  "src/App.tsx",
  "src/lib/seo-routes.json",
];
for (const rel of criticalRoutes) {
  if (!existsSync(resolve(root, rel))) {
    findings.push(finding("P0", `ملف حرج مفقود: ${rel}`));
  }
}

if (process.env.AUDIT_FEATURE_PROD === "1") {
  findings.push(
    finding("P2", "تخطي فحص الإنتاج هنا — شغّل verify:feature-health يدويًا عند الحاجة"),
  );
}

const counts = countBySeverity(findings);
console.log(
  JSON.stringify(
    {
      audit: "feature-readiness",
      ...counts,
      merge_ok: counts.P0 === 0,
      findings: findings.filter((f) => f.severity === "P0" || f.severity === "P1"),
    },
    null,
    2,
  ),
);
process.exit(exitCodeFromFindings(findings));
