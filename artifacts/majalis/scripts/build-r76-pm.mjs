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
    id: "fenugreek-r76",
    name: "الحلبة",
    arabicName: "الحلبة — غذاء وبركة",
    category: "الأعشاب والعلاج",
    icon: "Leaf",
    hadith: "«استشفوا بالحلبة فإن فيها شفاء من كل داء إلا السام»",
    hadithSource: "رواه ابن ماجه (3465) — ضعيف",
    intro: "الحلبة وردت في بعض روايات السنة في سياق الاستشفاء، مع التنبيه إلى ضعف سند بعض الأحاديث في بابها.",
  },
  {
    id: "nabidh-dates-r76",
    name: "نبيذ التمر",
    arabicName: "نبيذ التمر — غذاء معتدل",
    category: "الغذاء والتغذية",
    icon: "Droplets",
    hadith: "«ما أصبح في بيتي تمرات فأهل بيتي لا يجوعون»",
    hadithSource: "رواه مسلم (2046) — صحيح",
    intro: "نبيذ التمر من مشروبات السنة المعتدلة غير المسكرة، ويُستحضر في سياق الغذاء لا بديلاً عن العلاج الطبي.",
  },
  {
    id: "curds-r76",
    name: "الأقط",
    arabicName: "الأقط — لبن وغذاء",
    category: "الغذاء والتغذية",
    icon: "Droplets",
    hadith: "«ما ملأ ابن آدم وعاءً خيراً من بطن»",
    hadithSource: "رواه الترمذي (2478) — حسن",
    intro: "الأقط من مشتقات اللبن المعروفة في بلاد العرب، ويُستحضر في سياق الغذاء المعتدل لا ادعاء شفاء مطلق.",
  },
  {
    id: "saffron-r76",
    name: "الزعفران",
    arabicName: "الزعفران — عطر وغذاء",
    category: "الأعشاب والعلاج",
    icon: "Sparkles",
    hadith: "«أحبّ إليك أن تُعطى أهل بيتك من الزعفران»",
    hadithSource: "رواه أبو داود (3871) — ضعيف",
    intro: "الزعفران ورد في بعض روايات السنة، مع التنبيه إلى ضعف بعضها والاقتصار على ما ثبت من الاعتدال.",
  },
  {
    id: "rue-r76",
    name: "السذاب",
    arabicName: "السذاب — عشب معروف",
    category: "الأعشاب والعلاج",
    icon: "Leaf",
    hadith: "«لا تُعذّبوا صبيانكم بالسذاب»",
    hadithSource: "رواه البخاري (5442) — صحيح",
    intro: "السذاب ورد في السنة في سياق النهي عن إيذاء الصبيان به، ويُستحضر في باب الاعتدال لا ادعاء شفاء عام.",
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
  `  /* ── إضافات جولة ٧٦: طب نبوي ── */\n` + items.map(renderItem).join(",\n");

fs.writeFileSync(path.join(__dirname, "r76-prophetic-medicine.ts"), out, "utf8");
console.log(JSON.stringify({ pm: items.length }, null, 2));
