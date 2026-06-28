/**
 * Resolve bundled data files — works in monorepo dev and Vercel (app root = artifacts/majalis).
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function resolveDataDir() {
  const candidates = [
    join(__dirname, "../data"),
    join(process.cwd(), "data"),
    join(process.cwd(), "artifacts/majalis/data"),
  ];

  for (const dir of candidates) {
    const probe = join(dir, "fiqh-official-manifest.json");
    if (existsSync(probe)) {
      return dir;
    }
  }

  return candidates[0];
}

export function resolveDataFilePath(filename) {
  return join(resolveDataDir(), filename);
}
