#!/usr/bin/env node
/**
 * يزيل ذيول الخطابة القالبية المتكررة من نصوص الفوائد.
 * يطبّق العبارات الكاملة أولاً حتى لا تبقى بقايا ملتصقة بنص الحديث.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TAILS = [
  /\s*—\s*وهذا مما يستحق التأمل والعمل به في السلوك والعبادة\.?/gu,
  /\s*—\s*فليُلزم المسلم العمل بما علم والدعوة إليه\.?/gu,
  /\s*—\s*فليُلزم المسلم العمل بما علم\.?/gu,
  /\s*فليُلزم المسلم العمل بما علم والدعوة إليه\.?/gu,
  /\s*فليُلزم المسلم العمل بما علم\.?/gu,
  /\s*وهذا مما يستحق من المسلم أن يتأمله ويأخذ به في سلوكه وعبادته\.?/gu,
  /\s*وهذا من فوائد التدبر في كتاب الله والعمل بما فيه\.?/gu,
  /\s*وهذا من هدي النبي ﷺ الذي يجب معرفته والعمل به\.?/gu,
  /\s*وهذا أصل يُسترشد به في فهم الأحكام الشرعية\.?\s*يُراجع في كتب الفقه المعتمدة\.?/gu,
  /\s*وهذا أصل في الاعتقاد عند أهل السنة والجماعة\.?\s*يُستحضر في التعليم بلا غلو\.?/gu,
  /\s*وهذا من أصول التربية الإسلامية\.?\s*يُطبَّق في البيت والمدرسة باعتدال\.?/gu,
  /\s*وهذا من آداب الدعوة بالحكمة\.?\s*يُستحضر عند خطاب غير المسلمين\.?/gu,
  /\s*وهذا من آداب الإسلام(?:\s*التي تُجمّل المسلم وتُقربه من ربه)?\.?/gu,
  /\s*،\s*التي تُجمّل المسلم وتُقربه من ربه\.?/gu,
  /\s*وهذا من مكارم الأخلاق التي أمر بها الشرع\.?/gu,
  /\s*كما دلّ عليه الكتاب والسنة\.?/gu,
  /\s*كما ثبت في السنة الصحيحة\.?/gu,
  /\s*فحفظه وقراءته من أعظم القربات وأيسر طرق نيل الأجر\.?/gu,
  /\s*مما يُعان عليه بالعمل ويستحق من المسلم أن يتأملها ويأخذ بها\.?/gu,
  /\s*وهذا مما يستحق الاعتبار والعمل\.?/gu,
  /\s*وفيه فائدة لمن تأمل وعمل\.?/gu,
];

function stripOnce(text) {
  let next = text.trim();
  let changed = false;
  for (let guard = 0; guard < 25; guard++) {
    let hit = false;
    for (const re of TAILS) {
      re.lastIndex = 0;
      const after = next.replace(re, "").replace(/\s{2,}/g, " ").trim();
      if (after !== next && after.length >= 12) {
        next = after;
        changed = true;
        hit = true;
      }
    }
    if (!hit) break;
  }
  next = next.replace(/\s+([.،؛؟!])/g, "$1").replace(/[،؛]\s*$/u, ".").trim();
  return { text: next, changed };
}

function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function unescapeTs(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function processTsFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let n = 0;
  const next = src.replace(/text:\s*"((?:[^"\\]|\\.)*)"/g, (full, raw) => {
    const before = unescapeTs(raw);
    const { text, changed } = stripOnce(before);
    if (!changed) return full;
    n++;
    return `text: "${escapeTs(text)}"`;
  });
  if (n) fs.writeFileSync(file, next, "utf8");
  return n;
}

const targets = [
  path.join(root, "src/lib/fawaid-seed.ts"),
  path.join(root, "src/lib/fawaid-curated-seed.ts"),
];

let total = 0;
for (const f of targets) {
  if (!fs.existsSync(f)) continue;
  const n = processTsFile(f);
  total += n;
  console.log(`✓ ${path.basename(f)}: ${n}`);
}
console.log(`strip-fawaid-sermon-tails: ${total}`);
