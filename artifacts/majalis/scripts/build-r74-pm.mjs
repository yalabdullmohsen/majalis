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
    id: "milk-sunnah-r74",
    name: "اللبن",
    arabicName: "اللبن — غذاء نبوي",
    category: "الغذاء والتغذية",
    icon: "Droplets",
    hadith: "«ما ملأ ابن آدم وعاءً خيراً من بطن»",
    hadithSource: "رواه الترمذي (2478) — حسن",
    intro: "اللبن من الأغذية المذكورة في السنة النبوية، ويُستحضر في سياق الغذاء المعتدل لا ادعاء شفاء مطلق.",
  },
  {
    id: "watermelon-r74",
    name: "البطيخ",
    arabicName: "البطيخ — غذاء وبركة",
    category: "الغذاء والتغذية",
    icon: "Leaf",
    hadith: "«خير ما أكلتم البطيخ قبل الطعام وبعده»",
    hadithSource: "رواه ابن ماجه (3312) — ضعيف",
    intro: "البطيخ من الأغذية المذكورة في بعض روايات السنة، مع التنبيه إلى ضعف سند بعض الأحاديث في بابه.",
  },
  {
    id: "camphor-r74",
    name: "الكافور",
    arabicName: "الكافور — تطهير وتكريم",
    category: "الأعشاب والعلاج",
    icon: "Sparkles",
    hadith: "«غسّلوه بماء وسidr وكافور»",
    hadithSource: "متفق عليه — صحيح",
    intro: "الكافور ورد في السنة في سياق تكريم الميت وتطهيره، مع الاقتصار على ما ثبت وعدم ادعاء شفاء عام.",
  },
  {
    id: "sidr-leaves-r74",
    name: "السدر",
    arabicName: "ورق السدر — تطهير",
    category: "الأعشاب والعلاج",
    icon: "Leaf",
    hadith: "«غسّلوه بماء وسidr وكافور»",
    hadithSource: "متفق عليه — صحيح",
    intro: "ورق السدر ورد في السنة في غسل الميت، ويُستحضر في سياق التطهير لا بديلاً عن العلاج الطبي.",
  },
  {
    id: "cucumber-r74",
    name: "القثاء",
    arabicName: "القثاء — غذاء معتدل",
    category: "الغذاء والتغذية",
    icon: "Leaf",
    hadith: "«كلوا القثاء بزيت الرمان»",
    hadithSource: "رواه أبو داود (3834) — ضعيف",
    intro: "القثاء من الخضروات المعروفة، وورد في بعض روايات السنة مع التنبيه إلى ضعف بعضها.",
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

const out =
  `  /* ── إضافات جولة ٧٤: طب نبوي ── */\n` + items.map(renderItem).join(",\n");

fs.writeFileSync(path.join(__dirname, "r74-prophetic-medicine.ts"), out, "utf8");
console.log(JSON.stringify({ pm: items.length }, null, 2));
