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

export function getPublicBuildMeta() {
  try {
    const raw = readFileSync(resolve(__dirname, "build-meta.json"), "utf8");
    const j = JSON.parse(raw);
    if (j && j.commit && j.builtAt) {
      return {
        ok: true,
        service: "ssunnah",
        commit: String(j.commit).slice(0, 8),
        builtAt: String(j.builtAt),
      };
    }
  } catch {
    /* fall through */
  }
  return fromEnv();
}
