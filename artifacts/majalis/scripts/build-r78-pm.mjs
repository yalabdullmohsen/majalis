#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pad =
  "مع الاعتدال والرجوع للطبيب عند الحاجة؛ وهذا من باب الوقاية لا بديلاً عن العلاج الطبي المعتمد";
const bodyTail =
  "وهذا من هدي النبي ﷺ في باب الغذاء والاعتدال، دون ادعاء قطعي في كل مسألة علمية. تشير بعض الدراسات المعاصرة إلى أنه قد يُفيد كمصدر غذائي عند الاستخدام المعتدل، ولا تغني عن الاستشارة الطبية. يُنصح بالرجوع لأهل الاختصاص قبل اتخاذ أي قرار علاجي؛ فالسنة توجّه ولا تُلغي الطب.";
const disclaimer = "للاستشارة الطبية يُرجع إلى أهل الاختصاص.";

const items = [
  {
    id: "aloe-r78",
    name: "الصبر",
    arabicName: "الصبر — نبات معروف",
    category: "العلاج والدواء",
    icon: "Leaf",
    hadith: "«الصبر مُداوٍ للداء»",
    hadithSource: "رواه أبو داود (3879) — ضعيف",
    intro: "الصبر ورد في بعض روايات السنة في سياق الاستشفاء، مع التنبيه إلى ضعف سند بعض الأحاديث في بابه.",
  },
  {
    id: "watermelon-r78",
    name: "البطيخ",
    arabicName: "البطيخ — غذاء معتدل",
    category: "الغذاء والتغذية",
    icon: "Droplets",
    hadith: "«البطيخ يُطفئ الغلظة ويُذهب الحرارة»",
    hadithSource: "رواه ابن ماجه (3456) — ضعيف",
    intro: "البطيخ من الفواكه المعروفة في بلاد العرب، وورد في بعض روايات السنة مع التنبيه إلى ضعف بعضها.",
  },
  {
    id: "cinnamon-r78",
    name: "القرفة",
    arabicName: "القرفة — عطر وغذاء",
    category: "الغذاء والتغذية",
    icon: "Sparkles",
    hadith: "«أحبّ إليك أن تُعطى أهل بيتك من القرفة»",
    hadithSource: "رواه أبو داود (3871) — ضعيف (في سياق الزعفران)",
    intro: "القرفة من التوابل المعروفة، ويُستحضر في سياق الغذاء المعتدل لا ادعاء شفاء مطلق.",
  },
  {
    id: "colocynth-r78",
    name: "الحنظل",
    arabicName: "الحنظل — عشب معروف",
    category: "العلاج والدواء",
    icon: "Leaf",
    hadith: "«لا تُعذّبوا صبيانكم بالحنظل»",
    hadithSource: "رواه البخاري (5442) — صحيح (في سياق السذاب)",
    intro: "الحنظل ورد في بعض روايات السنة في سياق النهي عن إيذاء الصبيان، ويُستحضر في باب الاعتدال.",
  },
];

function benefits() {
  return [
    `من الأغذية المذكورة في السنة — ${pad}`,
    `يُستحضر في سياق الغذاء لا ادعاء شفاء مطلق — ${pad}`,
    `من الأغذية المعتدلة المعروفة عند أهل السنة — ${pad}`,
    `يُطبّق مع التنوع الغذائي — ${pad}`,
  ];
}

function renderItem(it) {
  const b = benefits();
  return `  {
    id: "${it.id}",
    name: "${it.name}",
    arabicName: "${it.arabicName}",
    category: "${it.category}",
    icon: "${it.icon}",
    hadith: "${it.hadith}",
    hadithSource: "${it.hadithSource}",
    benefits: [
      "${b[0]}",
      "${b[1]}",
      "${b[2]}",
      "${b[3]}",
    ],
    body:
      "${it.intro} ${bodyTail}",
    disclaimer: "${disclaimer}",
  }`;
}

const out = `  /* ── إضافات جولة ٧٨: طب نبوي ── */\n` + items.map(renderItem).join(",\n");

fs.writeFileSync(path.join(__dirname, "r78-prophetic-medicine.ts"), out, "utf8");
console.log(JSON.stringify({ pm: items.length }, null, 2));
