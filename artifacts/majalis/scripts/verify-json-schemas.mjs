#!/usr/bin/env node
/**
 * يتحقق من links.json بمخطط Zod — يفشل البناء عند سجل مخالف.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

// Zod via tsx path — load compiled schema through dynamic import of ts
async function main() {
  const { KnowledgeGraphSchema } = await import("../src/shared/lib/graph-schema.ts");
  const file = path.join(appRoot, "public/data/graph/links.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const parsed = KnowledgeGraphSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("verify-json-schemas: FAILED");
    for (const i of parsed.error.issues) {
      console.error(" -", i.path.join("."), i.message);
    }
    process.exit(1);
  }
  console.log(
    `verify-json-schemas: OK (graph ${parsed.data.nodes.length} nodes / ${parsed.data.links.length} links)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
