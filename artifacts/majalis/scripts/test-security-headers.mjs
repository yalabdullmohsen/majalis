#!/usr/bin/env node
/** يتحقق من وجود رؤوس الأمان الحرجة في vercel.json */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf8"));
const global = (vercel.headers || []).find((h) => h.source === "/(.*)");
if (!global) {
  console.error("✗ لا كتلة headers عامة /(.*)");
  process.exit(1);
}
const map = Object.fromEntries(global.headers.map((h) => [h.key, h.value]));
const required = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
  "Content-Security-Policy",
];
const failures = [];
for (const k of required) {
  if (!map[k]) failures.push(`مفقود: ${k}`);
}
if (map["X-Content-Type-Options"] !== "nosniff") failures.push("X-CTO يجب nosniff");
if (!/max-age=\d+/.test(map["Strict-Transport-Security"] || "")) failures.push("HSTS بلا max-age");
if (!(map["Content-Security-Policy"] || "").includes("frame-ancestors 'none'")) {
  failures.push("CSP بلا frame-ancestors none");
}
if (!(map["Content-Security-Policy"] || "").includes("upgrade-insecure-requests")) {
  failures.push("CSP بلا upgrade-insecure-requests");
}
if (failures.length) {
  console.error("✗ رؤوس الأمان:\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log("✓ رؤوس الأمان الحرجة موجودة في vercel.json (بما فيها upgrade-insecure-requests).");
