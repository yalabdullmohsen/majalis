/**
 * يمنع أوصاف بطاقات قصيرة جدًا في كتالوج الرئيسية وروابط الأخلاق.
 * تشغيل: node --import tsx src/lib/__tests__/content-catalog-blurbs-gate.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const MIN = 35;

function assertDescs(label: string, src: string) {
  const re = /desc:\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(src))) {
    n++;
    const desc = m[1] ?? "";
    if (desc.length < MIN) {
      throw new Error(`${label}: وصف قصير (${desc.length}): «${desc}»`);
    }
  }
  if (n === 0) throw new Error(`${label}: لم يُعثر على desc`);
  console.log(`  ✓ ${label}: ${n} وصف ≥ ${MIN}`);
}

assertDescs("home-feature-catalog", readFileSync(resolve(root, "src/lib/home-feature-catalog.ts"), "utf8"));
assertDescs(
  "Akhlaq related",
  (readFileSync(resolve(root, "src/views/AkhlaqPage.tsx"), "utf8").split("akl-related__grid")[1] ?? "").slice(0, 1200),
);

console.log("content-catalog-blurbs-gate: ok");
