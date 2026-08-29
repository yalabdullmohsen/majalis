#!/usr/bin/env node
/**
 * يفشل إذا وُجد مسار في App.tsx بلا سجل، أو مسار في السجل بلا App.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const appSrc = fs.readFileSync(path.join(appRoot, "src/App.tsx"), "utf8") + "\n" + fs.readFileSync(path.join(appRoot, "src/AppRoutes.tsx"), "utf8");
const appPaths = new Set(
  [...appSrc.matchAll(/path="(\/[^"]*)"/g)].map((m) => m[1]),
);

const { ROUTE_REGISTRY } = await import("../src/app/router/routes.ts");
const regPaths = new Set(ROUTE_REGISTRY.map((r) => r.path));

const missingInRegistry = [...appPaths].filter((p) => !regPaths.has(p));
const orphansInRegistry = [...regPaths].filter((p) => !appPaths.has(p));

const errors = [];
if (missingInRegistry.length) {
  errors.push(
    `مسارات في App بلا سجل (${missingInRegistry.length}): ${missingInRegistry.slice(0, 8).join(", ")}`,
  );
}
if (orphansInRegistry.length) {
  errors.push(
    `مسارات في السجل بلا App (${orphansInRegistry.length}): ${orphansInRegistry.slice(0, 8).join(", ")}`,
  );
}

// تنقّل سفلي: يجب أن تكون مسارات inNav موجودة
for (const r of ROUTE_REGISTRY.filter((x) => x.inNav)) {
  if (!appPaths.has(r.path)) {
    errors.push(`inNav بلا مسار تشغيلي: ${r.path}`);
  }
}

if (errors.length) {
  console.error("verify-route-registry: FAILED");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

console.log(
  `verify-route-registry: OK (App ${appPaths.size} · registry ${regPaths.size} · nav ${ROUTE_REGISTRY.filter((r) => r.inNav).length})`,
);
