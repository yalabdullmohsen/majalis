/**
 * لا تُضمَّن في الحزمة إلا المقاطع القصيرة (أو مجلد فارغ بانتظار توريد مرخّص).
 * تشغيل: node --import tsx src/lib/__tests__/adhan-bundle-sounds.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const soundsDir = resolve(__dirname, "../../../public/sounds/adhan");

assert.ok(existsSync(soundsDir), "مجلد public/sounds/adhan موجود");

const entries = readdirSync(soundsDir).filter((n) => !n.startsWith("."));
let total = 0;
for (const name of entries) {
  const p = join(soundsDir, name);
  const st = statSync(p);
  if (!st.isFile()) continue;
  // ممنوع تضمين ملفات أذان كاملة طويلة في الحزمة
  assert.ok(
    !/\.(mp3|m4a|aac|wav|caf)$/i.test(name) || st.size < 500_000,
    `ملف كبير غير مسموح في الحزمة: ${name} (${st.size} بايت)`,
  );
  total += st.size;
}

// سقف احترازي لمحتوى المجلد في المستودع
assert.ok(total < 2_000_000, `حجم مجلد الأصوات ${total} يتجاوز 2 ميغابايت`);

console.log(
  `adhan-bundle-sounds.test.ts: ok (files=${entries.length} bytes=${total})`,
);
