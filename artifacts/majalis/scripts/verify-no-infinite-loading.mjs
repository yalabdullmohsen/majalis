#!/usr/bin/env node
/**
 * Verify no infinite-loading patterns in public pages and core infrastructure.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");

const REQUIRED_FILES = [
  "src/lib/request-manager.ts",
  "src/lib/performance-monitor.ts",
  "src/hooks/use-async-data.ts",
  "src/components/AsyncDataView.tsx",
  "src/components/LazyRouteFallback.tsx",
  "src/components/PageLoadingGuard.tsx",
  "src/lib/service-worker.ts",
];

let failed = 0;

for (const rel of REQUIRED_FILES) {
  try {
    readFileSync(join(root, rel));
    console.log(`✓ ${rel} exists`);
  } catch {
    console.error(`✗ missing ${rel}`);
    failed++;
  }
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const badPatterns = [
  { re: /fetch\s*\(\s*['"`]\/api/, msg: "raw fetch to /api — use RequestManager" },
  { re: /retry:\s*Infinity/, msg: "infinite retry in query config" },
  { re: /staleTime:\s*Infinity/, msg: "infinite staleTime" },
];

const publicPages = [
  "LessonsPage.tsx",
  "LibraryPage.tsx",
  "QaPage.tsx",
  "FawaidPage.tsx",
  "RulingsPage.tsx",
  "MiraclesPage.tsx",
  "AdhkarPage.tsx",
  "SurahStoriesPage.tsx",
];

for (const page of publicPages) {
  const path = join(src, "views", page);
  try {
    const code = readFileSync(path, "utf8");
    if (code.includes("setLoading(true)") && !code.includes("finally") && !code.includes("useAsyncData") && !code.includes("safeLoadEffect") && !code.includes("RequestManager")) {
      console.error(`✗ ${page}: setLoading without finally/RequestManager`);
      failed++;
    } else {
      console.log(`✓ ${page} loading pattern ok`);
    }
  } catch {
    console.log(`· ${page} skipped`);
  }
}

const rm = readFileSync(join(root, "src/lib/request-manager.ts"), "utf8");
if (!rm.includes("REQUEST_TIMEOUT_MS = 8000")) {
  console.error("✗ RequestManager timeout must be 8000ms");
  failed++;
} else {
  console.log("✓ RequestManager 8s timeout configured");
}

const dispatch = readFileSync(join(root, "lib/api-dispatch.mjs"), "utf8");
if (!dispatch.includes("invokeHandler")) {
  console.error("✗ api-dispatch missing invokeHandler timeout wrapper");
  failed++;
} else {
  console.log("✓ API dispatch handler timeout wrapper");
}

for (const file of walk(join(src, "lib")).slice(0, 200)) {
  const rel = file.slice(root.length + 1);
  const code = readFileSync(file, "utf8");
  if (rel.includes("request-manager") || rel.includes("error-report")) continue;
  if (code.includes("RequestManager") || code.includes("requestFetch")) continue;
  for (const { re, msg } of badPatterns) {
    if (re.test(code)) {
      console.error(`✗ ${rel}: ${msg}`);
      failed++;
    }
  }
}

console.log(`\nverify-no-infinite-loading: ${failed ? "FAILED" : "PASSED"}`);
process.exit(failed ? 1 : 0);
