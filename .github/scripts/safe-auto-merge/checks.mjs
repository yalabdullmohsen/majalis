/**
 * Parse `gh pr checks` TSV and status contexts into normalized rows.
 */

/**
 * @param {string} tsv
 * @returns {{ name: string, state: string, description?: string }[]}
 */
export function parseGhPrChecksTsv(tsv) {
  const rows = [];
  for (const line of String(tsv || "").split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const name = parts[0].trim();
    const state = parts[1].trim();
    if (!name) continue;
    // Skip header-like noise
    if (/^name$/i.test(name) && /^status$/i.test(state)) continue;
    const description = (parts[4] || parts[3] || "").trim();
    rows.push({ name, state, description });
  }
  return rows;
}

/**
 * Merge GraphQL/REST statusCheckRollup entries into check rows.
 * @param {any[]} rollup
 */
export function parseStatusCheckRollup(rollup = []) {
  const rows = [];
  for (const item of rollup || []) {
    if (!item) continue;
    if (item.name) {
      rows.push({
        name: item.name,
        state: item.conclusion || item.status || item.state || "",
        description: item.description || item.detailsUrl || "",
      });
    } else if (item.context) {
      rows.push({
        name: item.context,
        state: item.state || item.conclusion || "",
        description: item.description || item.targetUrl || "",
      });
    }
  }
  return rows;
}

/**
 * True when Vercel (or similar) skipped/canceled because the change set
 * does not need a Preview deploy (Ignored Build Step), or when the failure
 * is an external rate-limit that must not block GitHub merge.
 * @param {{ state?: string, description?: string, name?: string }} row
 */
export function isIgnorablePreviewStatus(row = {}) {
  const blob = `${row.state || ""} ${row.description || ""} ${row.name || ""}`;
  return /ignored\s*build\s*step|skipped\s*-\s*not\s*affected|canceled by ignored|cancelled by ignored|no\s*preview|deployment\s*rate\s*limited|rate\s*limited|upgradeToPro=build-rate-limit|retry\s*in\s*\d+\s*hours/i.test(
    blob,
  );
}

/**
 * True when any check row is a Vercel GitHub status with rate-limit wording.
 * @param {{ state?: string, description?: string, name?: string }} row
 */
export function isVercelRateLimitedStatus(row = {}) {
  const name = String(row.name || "");
  if (!/^Vercel\s*[–-]/i.test(name)) return false;
  return isIgnorablePreviewStatus(row);
}
