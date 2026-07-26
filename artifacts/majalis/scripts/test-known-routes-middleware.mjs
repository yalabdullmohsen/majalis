#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

for (const f of ["middleware.js", "known-routes.json", "public/data/known-routes.json"]) {
  if (!existsSync(resolve(appRoot, f))) failures.push(`مفقود: ${f}`);
}

if (existsSync(resolve(appRoot, "known-routes.json"))) {
  const known = JSON.parse(readFileSync(resolve(appRoot, "known-routes.json"), "utf8"));
  if (!Array.isArray(known.exact) || known.exact.length < 50) {
    failures.push(`known-routes.exact قصير جدًا (${known.exact?.length})`);
  }
  if (!known.exact.includes("/")) failures.push("المعروف لا يتضمن /");
  if (!known.prefixes?.some((p) => p.startsWith("/library/"))) {
    failures.push("بادئة /library/ مفقودة");
  }
}

const mw = existsSync(resolve(appRoot, "middleware.js"))
  ? readFileSync(resolve(appRoot, "middleware.js"), "utf8")
  : "";
if (mw && !mw.includes("status: 404")) failures.push("middleware بلا status 404");

if (failures.length) {
  console.error("✗ known-routes/middleware:\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log("✓ middleware وknown-routes جاهزان لـ404 الحقيقي.");
