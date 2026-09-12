/**
 * بوابة: لا يُنشر سؤال seed بحالة documentation_status=unsourced.
 * node --import tsx src/lib/__tests__/qa-seed-no-unsourced-published-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const qaDir = join(dirname(fileURLToPath(import.meta.url)), "../../../public/data/qa");
const files = readdirSync(qaDir).filter((f) => f.endsWith(".json"));

let published = 0;
const offenders: string[] = [];

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(qaDir, file), "utf8"));
  const items = Array.isArray(raw) ? raw : (raw.items ?? []);
  for (const q of items) {
    if (q?.status !== "published") continue;
    published += 1;
    if (q.documentation_status === "unsourced") {
      offenders.push(`${file}:${q.id ?? "?"}`);
    }
  }
}

assert.ok(published > 0, "يُفترض وجود أسئلة منشورة في البذرة");
assert.equal(
  offenders.length,
  0,
  `أسئلة منشورة بلا توثيق مصدر: ${offenders.slice(0, 12).join(", ")}${offenders.length > 12 ? "…" : ""}`,
);

console.log(
  `qa-seed-no-unsourced-published-gate.test.ts: ok (${published} published, 0 unsourced)`,
);
