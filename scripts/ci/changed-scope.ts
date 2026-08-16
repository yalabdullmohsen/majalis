/**
 * TypeScript entry — يعيد تصدير المنطق من changed-scope.mjs
 * Usage: pnpm exec tsx scripts/ci/changed-scope.ts
 */
export {
  classifyPath,
  classifyScopes,
} from "./changed-scope.mjs";

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const r = spawnSync(process.execPath, [resolve(here, "changed-scope.mjs"), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
  });
  process.exit(r.status ?? 1);
}
