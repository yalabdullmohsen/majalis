import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fromEnv() {
  const commit = String(
    process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      process.env.COMMIT_SHA ||
      "unknown",
  ).slice(0, 8);
  const builtAt =
    process.env.BUILD_BUILT_AT ||
    process.env.VERCEL_BUILD_COMPLETED_AT ||
    new Date().toISOString();
  return { ok: true, service: "ssunnah", commit, builtAt };
}

/**
 * Public health/readiness stamp — short commit + builtAt only.
 * Prefer dist/version.json (build-time, gitignored) so CI does not dirty the tree.
 */
export function getPublicBuildMeta() {
  const candidates = [
    resolve(__dirname, "../dist/version.json"),
    resolve(__dirname, "../dist/healthz.json"),
  ];
  for (const file of candidates) {
    try {
      const j = JSON.parse(readFileSync(file, "utf8"));
      const commit = String(j.commitSha || j.commit || j.shortCommit || "").slice(0, 8);
      const builtAt = String(j.buildTime || j.builtAt || "");
      if (commit && builtAt) {
        return { ok: true, service: "ssunnah", commit, builtAt };
      }
    } catch {
      /* try next */
    }
  }
  return fromEnv();
}
