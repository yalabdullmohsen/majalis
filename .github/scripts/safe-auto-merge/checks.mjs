/**
 * Parse `gh pr checks` TSV and status contexts into normalized rows.
 */

/**
 * @param {string} tsv
 * @returns {{ name: string, state: string }[]}
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
    rows.push({ name, state });
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
      });
    } else if (item.context) {
      rows.push({
        name: item.context,
        state: item.state || item.conclusion || "",
      });
    }
  }
  return rows;
}
