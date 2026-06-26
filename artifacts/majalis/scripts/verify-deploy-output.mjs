#!/usr/bin/env node
/**
 * Pre-deploy verification for Vite SPA output.
 * Fails loudly if the build output is misconfigured for Vercel.
 *
 * Usage: node scripts/verify-deploy-output.mjs
 *        pnpm run verify:deploy
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const distDir = join(appRoot, "dist");
const packageJson = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf8"));
const vercelJsonPath = join(appRoot, "vercel.json");

let failed = false;

function fail(message) {
  console.error(`✗ ${message}`);
  failed = true;
}

function pass(message) {
  console.log(`✓ ${message}`);
}

function warn(message) {
  console.warn(`⚠ ${message}`);
}

console.log("Deploy Output Verification — Vite SPA\n");

// --- package.json build must be Vite, not Next.js ---
const buildScript = packageJson.scripts?.build || "";
if (/\bnext\s+build\b/.test(buildScript)) {
  fail(`package.json "build" runs Next.js: "${buildScript}" — expected Vite build`);
} else if (!/\bvite\s+build\b/.test(buildScript)) {
  fail(`package.json "build" must run "vite build", got: "${buildScript}"`);
} else {
  pass(`package.json build script uses Vite: ${buildScript}`);
}

// --- vercel.json ---
if (existsSync(vercelJsonPath)) {
  const vercel = JSON.parse(readFileSync(vercelJsonPath, "utf8"));
  if (vercel.outputDirectory && vercel.outputDirectory !== "dist") {
    fail(`vercel.json outputDirectory is "${vercel.outputDirectory}" — must be "dist"`);
  } else if (vercel.outputDirectory === "dist") {
    pass("vercel.json outputDirectory is dist");
  } else {
    warn("vercel.json has no outputDirectory — ensure Vercel dashboard uses dist");
  }

  if (vercel.outputDirectory === "dist/public" || vercel.outputDirectory?.includes("dist/public")) {
    fail("vercel.json must NOT use dist/public as outputDirectory");
  }

  if (vercel.framework && vercel.framework !== "vite") {
    warn(`vercel.json framework is "${vercel.framework}" — expected "vite"`);
  } else if (vercel.framework === "vite") {
    pass("vercel.json framework is vite");
  }

  const buildCmd = vercel.buildCommand || "";
  if (/\bnext\s+build\b/.test(buildCmd)) {
    fail(`vercel.json buildCommand runs Next.js: "${buildCmd}"`);
  }
} else {
  warn("vercel.json not found — configure Vercel dashboard manually (Framework: Vite, Output: dist)");
}

// --- dist/index.html ---
const indexHtml = join(distDir, "index.html");
if (!existsSync(indexHtml)) {
  fail("dist/index.html is missing — run pnpm run build first");
} else {
  const html = readFileSync(indexHtml, "utf8");
  if (html.includes("/src/main.tsx") && !html.includes("/assets/")) {
    fail("dist/index.html still references /src/main.tsx — Vite build did not bundle the app");
  } else if (html.includes("/_next/static")) {
    fail("dist/index.html contains Next.js assets — wrong build output");
  } else {
    pass("dist/index.html exists and looks like a Vite bundle");
  }
}

// --- forbid dist/public as deploy root ---
const distPublic = join(distDir, "public");
if (existsSync(distPublic)) {
  fail("dist/public exists — this project must deploy dist/ directly, not dist/public");
} else {
  pass("dist/public does not exist (correct)");
}

// --- forbid .next as deploy requirement ---
const dotNext = join(appRoot, ".next");
if (existsSync(dotNext)) {
  warn(".next directory exists locally — it must NOT be used as Vercel output (use dist only)");
}
pass("Deploy does not require .next output directory");

// --- sitemap.xml ---
const sitemapPath = join(distDir, "sitemap.xml");
if (!existsSync(sitemapPath)) {
  fail("dist/sitemap.xml is missing — generate:seo should write public/sitemap.xml before vite build");
} else {
  const sitemap = readFileSync(sitemapPath, "utf8");
  if (!sitemap.includes("<urlset")) {
    fail("dist/sitemap.xml is not a valid sitemap");
  } else {
    pass("dist/sitemap.xml exists");
  }
}

// --- robots.txt ---
const robotsPath = join(distDir, "robots.txt");
if (!existsSync(robotsPath)) {
  fail("dist/robots.txt is missing");
} else {
  pass("dist/robots.txt exists");
}

// --- bundled assets ---
if (existsSync(distDir)) {
  const entries = readdirSync(distDir, { recursive: true });
  const hasAssets = entries.some(
    (e) => typeof e === "string" && (e.includes("assets/") || e.endsWith(".js")),
  );
  if (!hasAssets && existsSync(indexHtml)) {
    fail("dist/ has no bundled JS assets — Vite build may have failed silently");
  } else if (hasAssets) {
    pass("dist/ contains bundled assets");
  }
}

console.log("");
if (failed) {
  console.error("Deploy verification FAILED — fix the issues above before pushing to production.");
  process.exit(1);
}

console.log("Deploy verification PASSED — output is ready for Vercel (Framework: Vite, Output: dist).");
