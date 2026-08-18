/**
 * Phase 7 — Performance gate: Vite chunk strategy + HTML resource hints.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vite = readFileSync(join(root, "vite.config.ts"), "utf8");
const html = readFileSync(join(root, "index.html"), "utf8");
const queryClient = readFileSync(join(root, "src/lib/query-client.ts"), "utf8");
const prewarm = readFileSync(join(root, "src/lib/resource-prewarm.ts"), "utf8");
const main = readFileSync(join(root, "src/main.tsx"), "utf8");

assert.match(vite, /esbuild:\s*\{[\s\S]*target:\s*"es2022"/, "esbuild target es2022");
assert.match(vite, /build:\s*\{[\s\S]*target:\s*"es2022"/, "build target es2022");
assert.match(vite, /legalComments:\s*"none"/, "strip legal comments from bundles");
assert.match(vite, /sourcemap:\s*"hidden"/, "source maps hidden — no sourceMappingURL in JS");
assert.match(vite, /resolveDependencies/, "modulePreload filters heavy chunks from boot");
assert.match(
  readFileSync(join(root, "package.json"), "utf8"),
  /strip:sourcemaps/,
  "post-build strips .map files for Best Practices",
);
assert.match(vite, /drop:\s*process\.env\.NODE_ENV === "production" \? \["console", "debugger"\]/, "drop console in production");
assert.match(vite, /assetsInlineLimit:\s*4096/, "inline small assets");
assert.match(vite, /cssCodeSplit:\s*true/, "CSS code splitting enabled");
assert.match(vite, /plugins:\s*\[/, "Vite plugins array must remain (react/tailwind/api)");
assert.match(vite, /resolve:\s*\{[\s\S]*dedupe:\s*\["react",\s*"react-dom"\]/, "react dedupe");
assert.match(vite, /vendorChunkName|isReactCoreModule|\/react-dom/, "precise react vendor matcher");
assert.match(vite, /return "react-dom"/, "react-dom split from react for TBT");
assert.match(vite, /return "react"/, "react core own chunk");
assert.doesNotMatch(
  vite,
  /if \(id\.includes\("react"\) \|\| id\.includes\("wouter"\)/,
  "must not use bare includes(\"react\") vendor matcher",
);

assert.doesNotMatch(html, /href="\[REDACTED\]"/, "no broken placeholder resource hints");
assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, "no Google Fonts on boot");
assert.match(html, /rel="preload"[^>]+\/fonts\/ui\/amiri-400-ar\.woff2/, "preload first-screen UI font");
assert.doesNotMatch(html, /rel="preload"[^>]+AmiriQuran-Regular\.woff2/, "Quran font is not preloaded globally");

assert.match(queryClient, /staleTime:\s*300_000/, "TanStack staleTime tuned for catalog traffic");
assert.match(queryClient, /mutations:[\s\S]*retry:\s*false/, "mutations must not auto-retry");
assert.match(queryClient, /networkMode:\s*"online"/, "queries respect online mode (no offline spam)");
assert.match(prewarm, /prewarmSupabaseOrigin/, "runtime Supabase origin prewarm");
assert.match(main, /prewarmSupabaseOrigin\(\)/, "main mounts Supabase prewarm on idle");
assert.match(main, /import\("\.\/lib\/supabase-bootstrap"\)/, "Supabase bootstrap is dynamic");
assert.doesNotMatch(
  main,
  /import \{[^}]*bootstrapSupabaseFromServer[^}]*\} from "\.\/lib\/supabase-bootstrap"/,
  "must not statically import supabase-bootstrap on boot",
);
assert.match(main, /void import\("\.\/styles\/design-system\.css"\)/, "design-system deferred from critical CSS");
assert.match(main, /void import\("\.\/styles\/brand-v4-components\.css"\)/, "brand-v4-components deferred");
assert.doesNotMatch(main, /^import "\.\/styles\/design-system\.css";/m, "no static design-system on boot");

console.log("phase7-performance: ok");
