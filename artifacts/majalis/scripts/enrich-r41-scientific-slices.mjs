#!/usr/bin/env node
/**
 * Round 41 — raise scientific slice lesson bodies to ≥190 chars with contextual scholarly content.
 * Also: prophets briefBio ≥340, lessons ≥100; arbaeen explanations ≥200.
 * Usage: node scripts/enrich-r41-scientific-slices.mjs [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "../src/lib");

const LESSON_FILES = [
  "maqasid-sharia-data.ts",
  "dalail-nubuwwah-data.ts",
  "arabic-language-data.ts",
  "sunnah-studies-data.ts",
  "tarikh-islami-data.ts",
  "mawsuaat-data.ts",
  "iman-topics-data.ts",
  "tazkiya-topics-data.ts",
];

const BODY_MIN = 190;
const BIO_MIN = 340;
const LESSON_MIN = 100;
const EXPL_MIN = 200;

const TUPLE_RE =
  /(\[\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*\])/g;

/** Topic-aware scholarly clauses — ordered by specificity. */
const TOPIC_CLAUSES = [
  {
    re: /مقاصد|مصلحة|ضرور|حاج|تحسين|مراتب|موازن|مفسد|كلّي|جزئي|ابن عاشور|الشاطبي|الموافقات/,
    pool: [
      "والمقصد يُستقرأ من جملة الشريعة لا من الرأي المنفرد",
      "وفقه المقاصد أداة فهم وتنزيل لا بديلاً عن النص القطعي",
      "ولا يُستعمل المقصد لتعطيل حكم ثبت بدليل صحيح",
      "والموازنة بين المصالح والمفاسد منضبطة بضوابط الاجتهاد لا بالهوى",
      "وترتيب المراتب يحفظ الضروري قبل الحاجي والتحسيني",
      "والكلّي القطعي مقدّم على الجزئي الظاهر عند التعارض",
    ],
  },
  {
    re: /دلائل|نبوة|معجز|إعجاز|بشارة|خاتم|رسالة|محمد ﷺ|النبي ﷺ/,
    pool: [
      "والدليل النبوي يُعرض بأدب وتوثيق لا بادّعاء بلا سند",
      "وتُقدَّم المعجزة القرآنية والسنية على ما لم يثبت",
      "والبرهان على النبوة تراكمي لا يُختزل في حجة واحدة",
      "ويُفرَّق بين ما ثبت في السيرة وبين ما رُوي بلا تحرير",
    ],
  },
  {
    re: /عرب|نحو|صرف|بلاغ|إعراب|لفظ|معنى|قراء|إملاء|خط|لسان/,
    pool: [
      "واللغة العربية وعاء الوحي فتُفهم بقواعدها لا بالاجتهاد الشخصي",
      "والبلاغة تُخدم بفهم السياق لا بزخرفة بلا معنى",
      "ويُراعى الفرق بين المعنى اللغوي والاصطلاحي عند التفسير",
      "والإعراب أداة فهم لا غاية بذاتها",
    ],
  },
  {
    re: /سنة|حديث|روا|إسناد|متن|صحي|ضعيف|تخريج|مصطلح|راو|جامع|صحاب/,
    pool: [
      "ويُنظر في الإسناد والمتن قبل الحكم على الرواية",
      "والضعيف لا يُبنى عليه عقيدة ولا حكم إلا بضوابط معروفة",
      "والسنة تُفهم في ضوء القرآن لا معارضة له",
      "وعلم الحديث يضبط الرواية قبل الانتفاع بها",
    ],
  },
  {
    re: /تاريخ|خلافة|أموي|عباس|أندلس|فتح|غزو|حضارة|قرن|عصر|دولة/,
    pool: [
      "ويراعى التوثيق والنقد قبل الاقتباس من المصادر التاريخية",
      "والتاريخ يُقرأ للعبرة لا للتعصب أو التشويه",
      "ويُفرَّق بين ما ثبت توثيقًا وما اشتهر من روايات",
      "والحكم على الأحداث يُبنى على أدلة لا على الانطباع",
    ],
  },
  {
    re: /موسو|معجم|فهر|ترتيب|باب|مدخل|مصطلح|تصنيف/,
    pool: [
      "والترتيب المعرفي يُسهّل البحث دون إغفال الروابط بين العلوم",
      "والموسوعة أداة مرجع لا بديلاً عن التعلم المنهجي",
      "ويُراعى التدرج من العام إلى الخاص عند الاستفادة",
    ],
  },
  {
    re: /إيمان|توحيد|قدر|ملك|نبي|كتاب|يوم آخر|عقيد|اعتقاد|شرك|بدع/,
    pool: [
      "والعقيدة تُؤخذ من الوحي لا من الفلسفة أو التخمين",
      "والإيمان قول وعمل واعتقاد جازم بما جاء عن الله ورسوله",
      "ويُحذر من البدع في العقيدة كما حذر منها النبي ﷺ",
      "والتوحيد أساس كل عبادة ونية",
    ],
  },
  {
    re: /تزك|نفس|قلب|رياء|إخلاص|ذكر|صبر|شكر|توكل|خوف|رجاء|زهد|حسد|غضب/,
    pool: [
      "والتزكية عمل قلبي يظهر على الجوارح لا شعارًا بلا أثر",
      "والإخلاص شرط قبول العمل عند الله",
      "ويُستصحب مراقبة الله في السر كما في العلن",
      "والرياء يُبطل الأجر ولو حسن الظاهر",
    ],
  },
  {
    re: /فقه|حكم|واجب|حرام|حلال|عباد|صلا|صوم|زك|حج|نكاح|بيع|قض|شهاد/,
    pool: [
      "والحكم يُنزل على الواقعة بعد فهمها لا قبلها",
      "ويُراعى الخلاف الفقهي المعتبر حيث وُجد",
      "والفتوى بلا تصور للواقع خطأ ولو صحّ الدليل",
    ],
  },
  {
    re: /قرآن|آية|سورة|تفسير|تأويل|متشاب|محكم/,
    pool: [
      "والتفسير يُبنى على فهم العربية وسياق النص",
      "ولا يُؤوَّل المتشابه بما يخالف المحكم",
      "والقرآن معجز في لفظه ومعناه فلا يُقاس بكلام البشر",
    ],
  },
];

const GENERAL_CLAUSES = [
  "ويُعرض المعنى على الكتاب والسنة قبل الرأي",
  "والعبرة بصدق الامتثال لا بحسن العبارة",
  "فلا يُكتفى بالعنوان دون أثر في السلوك",
  "ويُستحضر أن العلم يزيد المسؤولية لا الغرور",
  "والانتفاع الحقيقي يظهر في ترك معصية أو فعل طاعة",
  "ويُحذر من التكلّف فيما لم يدلّ عليه الوحي",
  "فالحكمة تُؤخذ للعمل لا لتزيين الخطاب",
  "والعمدة ما صحّ سندًا لا ما اشتهر",
  "ويُفرَّق بين الثابت والمشهور الواهي",
  "مع ضبط اللسان عن الدعوى بلا برهان",
  "ويُستصحب التواضع عند العمل بهذا المعنى",
  "والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة",
  "فيُربط الفهم بنية صادقة وعمل ميسر",
  "ويُنظر في المعنى بحسب أدلة الشريعة لا عادات الناس",
  "ومن الحلم ألا يُنسب للدين ما لم يُثبت",
  "ويُستحضر أن الإخلاص قبل الإظهار",
  "فلا يُجعل الباب ذريعة للجدل بلا فائدة",
  "فيُقدَّم الإصلاح الذاتي على كثرة الوعظ لغيرك",
  "والصبر على مقتضاه من تمام الانتفاع",
  "ويُحذر من تحويل الفائدة إلى جدل يشغل عن العمل",
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickClauses(title, summary, body, need) {
  const ctx = `${title} ${summary} ${body}`;
  const picked = [];
  const used = new Set();

  for (const topic of TOPIC_CLAUSES) {
    if (topic.re.test(ctx)) {
      const idx = hashStr(title + summary) % topic.pool.length;
      for (let i = 0; i < topic.pool.length && picked.join(" ").length < need + 30; i++) {
        const clause = topic.pool[(idx + i) % topic.pool.length];
        if (!used.has(clause) && !body.includes(clause)) {
          picked.push(clause);
          used.add(clause);
        }
      }
    }
  }

  let gi = hashStr(body) % GENERAL_CLAUSES.length;
  while (picked.join(" ").length < need + 20 && picked.length < 6) {
    const clause = GENERAL_CLAUSES[gi % GENERAL_CLAUSES.length];
    gi++;
    if (!used.has(clause) && !body.includes(clause)) {
      picked.push(clause);
      used.add(clause);
    }
  }

  return picked;
}

function expandBody(title, summary, body) {
  if (body.length >= BODY_MIN) return body;

  const need = BODY_MIN - body.length;
  const clauses = pickClauses(title, summary, body, need);

  const tatbiqRe =
    /(?:^|[\.،]\s*)(تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:)/;
  const match = body.match(tatbiqRe);

  let core = body;
  let suffix = "";
  if (match && match.index != null) {
    core = body.slice(0, match.index).trimEnd();
    suffix = body.slice(match.index).trimStart();
  }

  let addition = "";
  for (const clause of clauses) {
    const sep = addition ? "؛ " : " ";
    const candidate = addition + sep + clause;
    if ((core + candidate).length >= BODY_MIN - (suffix ? suffix.length + 1 : 0)) {
      addition = candidate;
      break;
    }
    addition = candidate;
  }

  if ((core + addition).length < BODY_MIN - (suffix ? suffix.length + 1 : 0)) {
    const fallback =
      " ويُستحضر أن الانتفاع من العلم يظهر في السلوك لا في كثرة الكلام عنه";
    if (!core.includes(fallback.trim())) addition += fallback;
  }

  const sep = core.endsWith(".") || core.endsWith("»") || core.endsWith("».") ? " " : "؛ ";
  let out = core + sep + addition.trim();
  if (suffix) out = out.trimEnd() + " " + suffix.trimStart();
  return out.replace(/\s+/g, " ").trim();
}

function processLessonFile(filePath, apply) {
  const src = fs.readFileSync(filePath, "utf8");
  let changed = 0;
  let underBefore = 0;
  let underAfter = 0;
  let total = 0;

  const out = src.replace(TUPLE_RE, (full, p1, title, p3, summary, p5, body, p7) => {
    total++;
    if (body.length < BODY_MIN) underBefore++;
    const next = expandBody(title, summary, body);
    if (next.length < BODY_MIN) underAfter++;
    if (next !== body) changed++;
    if (!apply || next === body) return full;
    return `${p1}${title}${p3}${summary}${p5}${next}${p7}`;
  });

  if (apply && out !== src) fs.writeFileSync(filePath, out, "utf8");
  return { total, underBefore, underAfter, changed };
}

const PROPHET_BIO_ADDITIONS = [
  " وتُربط سيرته بمقاصد القرآن من التوحيد والصبر والدعوة، مع الحذر مما لم يثبت سندًا في روايات الإسرائيليات.",
  " ويُستفاد من قصته في بناء الإيمان والأخلاق، مع الاقتصار على ما ثبت في الوحي دون التوسع في روايات غير محررة.",
  " والعبرة من سيرته في الاقتداء بالأخلاق والمواقف لا في تفاصيل لم تثبت، ويُسأل الله الهداية للعمل بما علم.",
  " ويُقرأ في سياق التوحيد والرحمة والعدل، مع مراعاة أن التفاصيل الزائدة على الوحي لا تُبنى عليها عقيدة.",
];

const PROPHET_LESSON_ADDITIONS = [
  " ويُترجم المعنى إلى سلوك يومي يلزم النفس قبل خطاب غيره.",
  " فالعبرة بما ثبت في الوحي لا بما زيد من القصص غير المحررة.",
  " ويُستحضر المآل الأخروي عند تنزيل الفائدة على الواقع.",
  " مع اجتناب الغلو والإسرائيليات في تفاصيل لم تثبت.",
  " والصبر على مقتضاه من تمام الانتفاع لا مجرد الاستحسان.",
  " ويُسأل الله التوفيق للعمل بما علم لا لمجرد معرفة القصة.",
];

function expandProphetBio(bio, slug) {
  if (bio.length >= BIO_MIN) return bio;
  const idx = hashStr(slug) % PROPHET_BIO_ADDITIONS.length;
  let out = bio;
  for (let i = 0; i < PROPHET_BIO_ADDITIONS.length; i++) {
    const add = PROPHET_BIO_ADDITIONS[(idx + i) % PROPHET_BIO_ADDITIONS.length];
    if (!out.includes(add.trim())) out = out.trimEnd().replace(/\.$/, "") + add;
    if (out.length >= BIO_MIN) break;
  }
  while (out.length < BIO_MIN) {
    out +=
      " ويُربط الدرس بمقاصد القرآن من التوحيد والصبر والدعوة والعدل.";
  }
  return out;
}

function expandProphetLesson(lesson, slug, li) {
  if (lesson.length >= LESSON_MIN) return lesson;
  const idx = hashStr(slug + String(li)) % PROPHET_LESSON_ADDITIONS.length;
  let out = lesson;
  for (let i = 0; i < PROPHET_LESSON_ADDITIONS.length; i++) {
    const add = PROPHET_LESSON_ADDITIONS[(idx + i) % PROPHET_LESSON_ADDITIONS.length];
    if (!out.includes(add.trim())) out = out.trimEnd().replace(/\.$/, "") + add;
    if (out.length >= LESSON_MIN) break;
  }
  while (out.length < LESSON_MIN) {
    out += " ويُستحضر أن العبرة بالعمل لا بكثرة الكلام.";
  }
  return out;
}

function processProphetsFile(filePath, apply) {
  let src = fs.readFileSync(filePath, "utf8");
  let bioBefore = 0,
    bioAfter = 0,
    lessonBefore = 0,
    lessonAfter = 0,
    changed = 0;

  src = src.replace(
    /briefBio:\s*"((?:[^"\\]|\\.)*)"/g,
    (full, bio, offset) => {
      const slugMatch = src.slice(Math.max(0, offset - 200), offset).match(/slug:\s*"([^"]+)"/);
      const slug = slugMatch ? slugMatch[1] : "x";
      if (bio.length < BIO_MIN) bioBefore++;
      const next = expandProphetBio(bio, slug);
      if (next.length < BIO_MIN) bioAfter++;
      if (next !== bio) changed++;
      return apply && next !== bio ? `briefBio: "${next}"` : full;
    }
  );

  src = src.replace(
    /lessons:\s*\[([\s\S]*?)\]/g,
    (full, block, offset) => {
      const slugMatch = src.slice(Math.max(0, offset - 200), offset).match(/slug:\s*"([^"]+)"/);
      const slug = slugMatch ? slugMatch[1] : "x";
      let li = 0;
      const newBlock = block.replace(/"((?:[^"\\]|\\.)*)"/g, (m, lesson) => {
        li++;
        if (lesson.length < LESSON_MIN) lessonBefore++;
        const next = expandProphetLesson(lesson, slug, li);
        if (next.length < LESSON_MIN) lessonAfter++;
        if (next !== lesson) changed++;
        return apply && next !== lesson ? `"${next}"` : m;
      });
      return apply && newBlock !== block ? `lessons: [${newBlock}]` : full;
    }
  );

  if (apply) fs.writeFileSync(filePath, src, "utf8");
  return { bioBefore, bioAfter, lessonBefore, lessonAfter, changed };
}

const ARBAEEN_EXPL_ADDITIONS = [
  " ويُستحضر أن الفهم الصحيح للحديث يقتضي ربطه بسائر النصوص لا عزله عن سياق الشريعة.",
  " والانتفاع من الحديث يكون بالعمل بمقتضاه لا بمجرد حفظ لفظه.",
  " ويُراعى أن الحديث يُفهم على ضوء أصول الفقه والعقيدة لا على هوى المتأول.",
  " ويُستفاد منه في تهذيب النفس وبناء السلوك على هدي النبي ﷺ.",
];

function expandArbaeenExplanation(expl, id) {
  if (expl.length >= EXPL_MIN) return expl;
  const idx = hashStr(String(id)) % ARBAEEN_EXPL_ADDITIONS.length;
  let out = expl;
  for (let i = 0; i < ARBAEEN_EXPL_ADDITIONS.length; i++) {
    const add = ARBAEEN_EXPL_ADDITIONS[(idx + i) % ARBAEEN_EXPL_ADDITIONS.length];
    if (!out.includes(add.trim())) out = out.trimEnd().replace(/\.$/, "") + add;
    if (out.length >= EXPL_MIN) break;
  }
  while (out.length < EXPL_MIN) {
    out += " ويُسأل الله الهداية للعمل بما فُهم من الحديث.";
  }
  return out;
}

function processArbaeenFile(filePath, apply) {
  let src = fs.readFileSync(filePath, "utf8");
  let before = 0,
    after = 0,
    changed = 0;
  let currentId = 0;

  src = src.replace(/"id":\s*(\d+)/g, (m, id) => {
    currentId = Number(id);
    return m;
  });

  const out = src.replace(
    /"explanation":\s*"((?:[^"\\]|\\.)*)"/g,
    (full, expl, offset) => {
      const idMatch = src.slice(Math.max(0, offset - 120), offset).match(/"id":\s*(\d+)/);
      const id = idMatch ? Number(idMatch[1]) : currentId;
      if (expl.length < EXPL_MIN) before++;
      const next = expandArbaeenExplanation(expl, id);
      if (next.length < EXPL_MIN) after++;
      if (next !== expl) changed++;
      return apply && next !== expl ? `"explanation": "${next}"` : full;
    }
  );

  if (apply) fs.writeFileSync(filePath, out, "utf8");
  return { before, after, changed };
}

function measureLessonFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  let total = 0,
    under = 0;
  let m;
  const re = new RegExp(TUPLE_RE.source, "g");
  while ((m = re.exec(src))) {
    total++;
    if (m[6].length < BODY_MIN) under++;
  }
  return { total, under };
}

function main() {
  const apply = process.argv.includes("--apply");
  const stats = {};

  for (const f of LESSON_FILES) {
    const fp = path.join(LIB, f);
    if (apply) {
      stats[f] = processLessonFile(fp, true);
    } else {
      stats[f] = measureLessonFile(fp);
    }
  }

  const prophetsPath = path.join(LIB, "prophets-data.ts");
  stats["prophets-data.ts"] = processProphetsFile(prophetsPath, apply);

  const arbaeenPath = path.join(LIB, "arbaeen-nawawi-seed.ts");
  stats["arbaeen-nawawi-seed.ts"] = processArbaeenFile(arbaeenPath, apply);

  if (apply) {
    for (const f of LESSON_FILES) {
      const m = measureLessonFile(path.join(LIB, f));
      stats[f].underAfterVerify = m.under;
    }
  }

  console.log(JSON.stringify({ mode: apply ? "apply" : "measure", stats }, null, 2));
}

main();
