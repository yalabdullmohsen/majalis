#!/usr/bin/env node
/** Alias — see verify-sin-jeem.mjs */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = spawnSync("node", [path.join(__dirname, "verify-sin-jeem.mjs"), ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
});
process.exit(r.status ?? 1);
