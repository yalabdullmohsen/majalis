// Writes dist/version.json with the deployed commit + build time so the live
// site always reveals exactly which build is serving. Fetch it at /version.json.
// Commit SHA comes from the CI/host env (Vercel / GitHub Actions), with a local
// git fallback for dev builds.
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");

function resolveCommit() {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_SHA ||
    "";
  if (fromEnv) return fromEnv;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const commit = resolveCommit();
const payload = {
  commit,
  shortCommit: commit.slice(0, 8),
  builtAt: new Date().toISOString(),
  ref:
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.GITHUB_REF_NAME ||
    "main",
};

await writeFile(resolve(distDir, "version.json"), JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(`[version] wrote dist/version.json → ${payload.shortCommit} @ ${payload.builtAt}`);
