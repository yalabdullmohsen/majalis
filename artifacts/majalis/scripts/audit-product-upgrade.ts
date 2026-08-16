/**
 * غلاف ترقية المنتج — يجمع feature-readiness + mobile-app.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(script: string): boolean {
  const r = spawnSync("pnpm", ["run", script], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  process.stdout.write(r.stdout || "");
  process.stderr.write(r.stderr || "");
  return r.status === 0;
}

const okFeature = run("audit:feature-readiness");
const okMobile = run("audit:mobile-app");
const merge_ok = okFeature && okMobile;
const result = {
  merge_ok,
  P0: merge_ok ? 0 : 1,
  feature: okFeature,
  mobile: okMobile,
};
console.log(JSON.stringify(result));
process.exit(merge_ok ? 0 : 1);
