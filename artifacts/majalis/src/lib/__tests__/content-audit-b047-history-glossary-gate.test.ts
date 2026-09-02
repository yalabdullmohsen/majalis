/**
 * بوابة b047: سلامة نصوص التاريخ الإسلامي + إصلاحات المصطلحات الحرجة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b047-history-glossary-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const historyDir = resolve(root, "src/data/islamic-history");
const glossary = readFileSync(
  resolve(root, "src/pages/account/ui/IslamicGlossaryView.tsx"),
  "utf8",
);

const FORBIDDEN = [
  "الفتوات",
  "أدبار الرحالة",
  "أقصى الأرد",
  "عرف العصر العباسي التجارة",
  "أبو العباس السفاه",
  "دخول السلج إلى",
  "دخل السلج بغداد",
  "التقو البويهيون",
  "الخليفة العباسي المعتصم ودم",
  "تولّى عثمان بعد عثمان",
  "ابن بططة",
  "ضوابات أهل السنة",
  "اليوني العربي",
  "فنون تزييني ",
  "ألب الأندلس",
  "أين جالوت", // خطأ هارون؛ عين جالوت للمماليك فقط
];

for (const name of readdirSync(historyDir)) {
  if (!name.endsWith(".json") || name === "author-aliases.json") continue;
  const raw = readFileSync(join(historyDir, name), "utf8");
  for (const ph of FORBIDDEN) {
    assert.doesNotMatch(
      raw,
      new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `${name}: بقايا تشويه «${ph}»`,
    );
  }
}

const umayyad = readFileSync(join(historyDir, "umayyad.json"), "utf8");
assert.match(umayyad, /أقاصي الأرض|أقصى الأرض/, "تصحيح أقصى الأرض");
assert.match(umayyad, /العصر الأموي/, "لا خلط أموي/عباسي في بطاقة الأمويين");
assert.match(umayyad, /سليمان بن عبد الملك/, "حصار القسطنطينية في عهد سليمان");
assert.doesNotMatch(umayyad, /أسقطت بغداد/, "سقوط الأمويين ليس سقوط بغداد");

const rashidun = readFileSync(join(historyDir, "rashidun.json"), "utf8");
assert.match(rashidun, /الفتوحات في عهد الراشدين/, "عنوان الفتوحات مصحّح");
assert.match(rashidun, /زيد بن ثابت/, "جمع القرآن بزيد");
assert.match(rashidun, /عمرو بن العاص/, "التحكيم: عمرو لا عمر");
assert.match(rashidun, /أبو عبيدة بن الجراح/, "فتح القدس: أبو عبيدة");

const abbasid = readFileSync(join(historyDir, "abbasid.json"), "utf8");
assert.match(abbasid, /السفّاح|السفاح/, "أبو العباس السفّاح");
assert.match(abbasid, /المستعصم/, "سقوط بغداد: المستعصم لا المعتصم");
assert.match(abbasid, /دخول السلاجقة/, "عنوان السلاجقة");
assert.doesNotMatch(abbasid, /عين جالوت|أين جالوت/, "لا عين جالوت في بطاقة هارون");

assert.match(glossary, /id: 14, term: "الحديث الحسن"/, "مصطلح الحديث الحسن");
assert.match(glossary, /id: 15, term: "الحديث الضعيف"/, "مصطلح الحديث الضعيف");
assert.match(
  glossary,
  /الجرح: بيان ما يوجب ردّ|من جهة القبول أو الردّ/,
  "تعريف الجرح والتعديل غير مبتور",
);
assert.doesNotMatch(
  glossary,
  /الغلط"\s*,\s*\n\s*detail:/,
  "لا بتر عند الغلط بلا قوس",
);
assert.doesNotMatch(glossary, /term: "الحسد والغبطة"/, "أُزيل التكرار مع الغِبطة");
assert.match(
  glossary,
  /definition: "الغيبة: ذكرك أخاك/,
  "تعريف الغيبة مكتمل غير مبتور بآية",
);

console.log("content-audit-b047-history-glossary-gate: ok");
