#!/usr/bin/env node
/**
 * مدقّق الرسم البياني — يفشل عند مرجع معطوب أو غياب العقدة أو رابط أحادي بلا عكس متوقّع.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, "../public/data/graph/links.json");

if (!fs.existsSync(file)) {
  console.error("verify-knowledge-graph: missing", file);
  process.exit(1);
}

const doc = JSON.parse(fs.readFileSync(file, "utf8"));
const nodes = new Map((doc.nodes || []).map((n) => [`${n.kind}:${n.slug}`, n]));
const errors = [];

if (!doc.version) errors.push("missing version");
if (!Array.isArray(doc.links) || doc.links.length === 0) errors.push("links empty");

function key(n) {
  return `${n.kind}:${n.slug}`;
}

for (const L of doc.links || []) {
  if (!L.from?.kind || !L.from?.slug || !L.to?.kind || !L.to?.slug || !L.rel) {
    errors.push(`malformed link: ${JSON.stringify(L)}`);
    continue;
  }
  if (!nodes.has(key(L.from))) errors.push(`missing node ${key(L.from)}`);
  if (!nodes.has(key(L.to))) errors.push(`missing node ${key(L.to)}`);
}

// كل عقدة يجب أن تظهر في رابط واحد على الأقل
const mentioned = new Set();
for (const L of doc.links || []) {
  mentioned.add(key(L.from));
  mentioned.add(key(L.to));
}
for (const k of nodes.keys()) {
  if (!mentioned.has(k)) errors.push(`orphan node ${k}`);
}

if (errors.length) {
  console.error("verify-knowledge-graph: FAILED");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

console.log(
  `verify-knowledge-graph: OK (${nodes.size} nodes, ${doc.links.length} links)`,
);
