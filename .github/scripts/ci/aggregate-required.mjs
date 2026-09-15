#!/usr/bin/env node
/**
 * Path-lane aware aggregator — pure logic for Verify build / ci-required.
 *
 * Input JSON (stdin or --json):
 * {
 *   jobs: [{ name, required: boolean|"true"|"false", result }],
 * }
 *
 * result ∈ success|failure|cancelled|skipped|neutral
 * Exit 0 if all required jobs succeeded; skipped allowed only when required=false.
 * Missing/invalid required flag → hard fail.
 */
import { readFileSync } from "node:fs";

/**
 * @param {unknown} v
 * @returns {boolean|null}
 */
export function parseRequired(v) {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return null;
}

/**
 * @param {{ name: string, required: unknown, result: string }[]} jobs
 * @returns {{ ok: boolean, table: string[][], blockers: string[], error?: string }}
 */
export function aggregateRequiredJobs(jobs) {
  if (!Array.isArray(jobs)) {
    return { ok: false, table: [], blockers: [], error: "jobs must be an array" };
  }
  /** @type {string[][]} */
  const table = [["Job", "Required", "Result", "Reason"]];
  /** @type {string[]} */
  const blockers = [];

  for (const raw of jobs) {
    const name = String(raw?.name || "").trim();
    if (!name) {
      return {
        ok: false,
        table,
        blockers,
        error: "job missing name",
      };
    }
    const required = parseRequired(raw?.required);
    if (required === null) {
      return {
        ok: false,
        table,
        blockers: [`${name}:missing-required`],
        error: `job '${name}' missing or invalid required (need true|false)`,
      };
    }
    const result = String(raw?.result || "").trim() || "missing";
    let reason = "ok";
    if (required) {
      if (result === "success") {
        reason = "required pass";
      } else if (result === "skipped") {
        reason = "required must not be skipped";
        blockers.push(`${name}=${result}`);
      } else if (result === "cancelled") {
        reason = "required cancelled";
        blockers.push(`${name}=${result}`);
      } else if (result === "failure" || result === "missing") {
        reason = "required not success";
        blockers.push(`${name}=${result}`);
      } else {
        reason = `required unexpected result=${result}`;
        blockers.push(`${name}=${result}`);
      }
    } else {
      if (result === "failure") {
        reason = "optional failed unexpectedly";
        blockers.push(`${name}=${result}(optional)`);
      } else {
        reason = "optional skip/success/cancel allowed";
      }
    }
    table.push([name, required ? "true" : "false", result, reason]);
  }

  return { ok: blockers.length === 0, table, blockers };
}

/**
 * @param {string[][]} table
 */
export function formatTable(table) {
  return table.map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function main() {
  const idx = process.argv.indexOf("--json");
  let raw;
  if (idx >= 0 && process.argv[idx + 1]) {
    raw = process.argv[idx + 1];
  } else if (process.argv.includes("--file")) {
    const f = process.argv[process.argv.indexOf("--file") + 1];
    raw = readFileSync(f, "utf8");
  } else {
    raw = readFileSync(0, "utf8");
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("aggregate-required: invalid JSON", e instanceof Error ? e.message : e);
    process.exit(2);
  }
  const result = aggregateRequiredJobs(parsed.jobs || parsed);
  console.log(formatTable(result.table));
  if (result.error) {
    console.error(result.error);
    process.exit(2);
  }
  if (!result.ok) {
    console.error(`Blocked by: ${result.blockers.join(" ")}`);
    process.exit(1);
  }
  console.log("aggregate-required OK");
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("aggregate-required.mjs")) {
  main();
}
