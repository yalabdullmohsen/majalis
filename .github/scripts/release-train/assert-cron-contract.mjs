#!/usr/bin/env node
/**
 * Assert scheduled-release-train.yml cron lines match Kuwait 06:00 / 18:00 (UTC).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEDULE_CRONS_UTC } from "./constants.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const ymlPath = join(root, ".github/workflows/scheduled-release-train.yml");
const yml = readFileSync(ymlPath, "utf8");

for (const c of SCHEDULE_CRONS_UTC) {
  if (!yml.includes(c)) {
    console.error(`missing cron ${c} in ${ymlPath}`);
    process.exit(1);
  }
}
console.log("cron contract ok:", SCHEDULE_CRONS_UTC.join(", "));
