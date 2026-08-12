/**
 * Shared Release Gate utilities — code search markers, etc.
 */

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");

export function grepCode(marker) {
  if (!marker) return false;
  try {
    const out = execSync(
      `rg -l "${String(marker).replace(/"/g, '\\"')}" "${APP_ROOT}" --glob '!node_modules' --glob '!dist' 2>/dev/null || true`,
      { encoding: "utf8" },
    ).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}
