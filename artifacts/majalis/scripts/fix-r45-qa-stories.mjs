#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function qa(id, question, answer, category_id, ruling_type, reference, catName, trust = "scholarly_source", created = "2024-05-12T13:00:00.000Z") {
  return `  {
    "id": "${id}",
    "question": "${question}",
    "answer": "${answer}",
    "category_id": "${category_id}",
    "ruling_type": "${ruling_type}",
    "evidence": "",
    "reference": "${reference}",
    "status": "published",
    "review_status": "approved",
    "created_at": "${created}",
    "qa_categories": { "name": "${catName}", "slug": "${category_id.replace("seed-cat-", "")}" },
    "trust_level": "${trust}",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;
}

const QA_BLOCK = `  /* ───────── جولة ٤٥: إثراء Q&A (505-524) ───────── */
${qa(
  "seed-qa-505",
  "ما حكم صلاة الجنازة على الميت؟",
  "الجواب: صلاة الجنازة فرض كفاية على المسلمين؛ إذا صلّها البعض سقط الإثم عن الباقين، وإن تركها أهل البلد أثموا جميعاً. وهي أربع تكبيرات بلا رukuوع ولا سجود، فيها الدعاء للميت والاستغفار. والأصل: «من مات منكم فصلّوا عليه» — رواه البخاري (1315) ومسلم (945).",
  "seed-cat-salah",
  "واجب",
  "صحيح البخاري 1315؛ صحيح مسلم 945",
  "الصلاة",
  "primary_text"
)},
${qa(
  "seed-qa-506",
  "ما حكم الوitr بعد صلاة العشاء؟",
  "الجواب: الوitr سنة مؤكدة؛ قال ﷺ: «من صلى قبل الصبح أربعاً فقد أوتي بوتر الليل». ويُصلّى بعد العشاء وحدها أو بعد التهجد. ومن فاته وتره في الليل يُقضيه قبل الفجر. والأصل فيه: «اجعلوا آخر صلاتكم بالليل وتراً» — رواه مسلم (749).",
  "seed-cat-salah",
  "سنة",
  "صحيح مسلم 749؛ سنن أبي داود 1418",
  "الصلاة"
)},
${qa(
  "seed-qa-507",
  "ما حكم مسح الخفين في الوضوء؟",
  "الجواب: مسح الخفين جائز للمحدث في الوضوء بدل غسل الرجلين، بشرط لبسهما على طهارة وفي مدة محددة: يوم وليلة للمقيم وثلاثة أيام للمسافr. والأصل: «إذا أنتم لبستم الخفين فامسحوا عليهما» — رواه مسلم (272). ويُمسح ظاهرهما فقط.",
  "seed-cat-tahara",
  "جائز",
  "صحيح مسلم 272؛ فقh السنة — السيد سابق",
  "الطهارة"
)},
${qa(
  "seed-qa-508",
  "ما حكم زكاة الفطر؟",
  "الجواب: زكاة الفطر واجبة على كل مسلم قبل صلاة العيد، صاع من طعام أهل البلد — تمر أو بر أو غيره. قال ﷺ: «فرض رسول الله ﷺ زكاة الفطر صاعاً من تمر أو صاعاً من شعير». تُخرج عن نفسه ومن يعولهم من صغار. والأصل: رواه البخاري (1503) ومسلم (984).",
  "seed-cat-zakat",
  "واجب",
  "صحيح البخاري 1503؛ صحiح مسلم 984",
  "الزكاة",
  "primary_text",
  "2024-05-12T13:15:00.000Z"
)}
];`;

// The template still has issues - write directly as one big string with all correct Arabic
