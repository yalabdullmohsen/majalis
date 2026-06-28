#!/usr/bin/env node
/** @deprecated Use seed-question-answer.mjs */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = spawnSync("node", [path.join(__dirname, "seed-question-answer.mjs"), ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
});
process.exit(r.status ?? 1);
