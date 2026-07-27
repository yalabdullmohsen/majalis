#!/usr/bin/env node
/**
 * Round 40 — measure and diversify overused lesson body bridges.
 * Usage: node scripts/diversify-lesson-bridges-r40.mjs [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "../src/lib");

const FILES = [
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "fikr-waqia-data.ts",
  "usra-mujtama-data.ts",
  "quran-studies-data.ts",
  "iman-topics-data.ts",
  "tazkiya-topics-data.ts",
];

/** Primary formulaic bridges to diversify (replace all occurrences). */
const OVERUSED = [
  "ويُقدَّم ما ثبت إسنادًا على ما راج بين الناس",
  "فالثمرة عمل صالح مع مراعاة الدليل",
  "ويُربط المعنى بعمل يومي ميسر",
  "فلا يُخلط الثابت بالقصص التي لم تتحرر",
  "ويُسأل الله الثبات على مقتضاه",
  "مع تقديم الدليل على العادة والهوى",
  "والانتفاع الحقيقي يظهر في ترك معصية أو فعل طاعة",
  "فالعبرة بصدق الامتثال لا بحسن العبارة",
  "والعبرة بصدق الامتثال لا بحسن العبارة",
  "ويُفرَّق بين الثابت والمشهور الواهي",
  "مع اجتناب الغلو في تنزيل الفائدة",
  "مع اجتناب الغلو في التنزيل على كل حادثة بلا ضابط",
  "فالثمرة ترك معصية أو فعل طاعة",
  "فالمقصود تزكية القلب والجوارح معًا",
  "فالعلم بلا أثر في الخلق ناقص الثمرة",
  "فيُعرض المعنى على الكتاب والسنة قبل الرأي",
  "ويُؤثر الدليل على الهوى والعادة",
  "ويُحذَّر من الغلو في التنزيل على كل حادثة",
  "ويُحذر من الغلو في التنزيل على كل حادثة",
  "ويُستصحب مراقبة الله في السر كما في العلن",
  "والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة",
  "مع ضبط اللسان عن الدعوى بلا برهان",
  "ويُستحضر المآل الأخروي عند تنزيل الفائدة",
  "ويُستصحب التواضع عند العمل بهذا المعنى",
  "ويُحذر من الرياء عند إظهار العمل بهذا الباب",
  "ويُؤخذ منه خلق ظاهر قبل كثرة الكلام",
  "مع مراعاة مراتب الأحكام وأحوال الناس",
  "مع إيثار الرفق في الدعوة والعمل",
  "ويُترك التكلّف فيما لم يدلّ عليه الوحي",
  "مع ضبط النفس عن الغلو",
  "ويُحذر من التكلّف في التنزيل",
  "والغاية تزكية النفس لا الجدل",
  "ويُسأل الله التوفيق للعمل لا لمجرد العلم",
  "مع التيسير المشروع بلا إسقاط للعزيمة",
  "ويُترك ما لم يثبت سندًا",
];

/** ≥12 fresh scholarly bridge styles (not already dominating). */
const ALT_POOL = [
  "ويبقى العمل الصالح مقياس الانتفاع لا كثرة الكلام",
  "ويُنظر في المعنى بحسب أدلة الشريعة لا عادات الناس",
  "ويُستحضر أن سعة العلم تزيد المسؤولية لا الغرور",
  "فالحكمة ألا يُؤخذ من الباب أكثر مما دلّ",
  "ويُراقب القلب حين يُعرض على النفس ما يُحبّ",
  "ويُحاذى بين ورع الظاهر وصدق الباطن",
  "فالاستمرار على المعروف أثقل عند الله من البدايات الحماسية",
  "ويُضبط الافتراض بقدر ما تثبته النصوص",
  "ومن الحلم ألا يُنسب للدين ما لم يُثبت",
  "ويُتجنب زخرفة الكلام على حساب صدق القصد",
  "فيهتم العبد بما يُغيّر قلبه قبل أن يُسمّع غيره",
  "ويُستصحب أن البر لا يكتمل بترك حقّ الله أو حقّ العباد",
  "ويراعي الفهم حال السامع لا غرور المتكلّم",
  "ويُوقف الطمع في النتائج عند أخذ السبب",
  "فتُفهم الآيات والأحاديث بضبط لا بإفراط",
  "ويُنزل الفائدة حيث أُذن أنزلها الشرع",
  "ويُحرص على ثبات القلب حين يختبره نفسه",
  "فلا تُضمّن للباب ما لم يُتبين منه",
  "ويُستحضر أن الإخلاص قبل الإظهار",
  "ويُراعى مقام الحكم بين التشديد والتساهل",
  "فيُجعل الانتفاع معيارًا لا زخرفة العبارة",
  "ويُحذّر نفسه من تزيين النفس بحسن الكلام",
  "فلا يُطوَّل في البيان على حساب سلامة الضمير",
  "ويُستدعى أثر المعنى في النية قبل الجهر",
  "فلا يُجعل الباب ذريعة للجدل بلا فائدة",
  "فيُجعل الباب سببًا لمحاسبة النفس لا لتزكيتها",
  "فيُقدَّم الإصلاح الذاتي على كثرة الوعظ لغيرك",
  "مع تقديم ما صحّ سندًا على المشهور الواهي",
  "والصبر على مقتضاه من تمام العمل",
  "فيُربط الفهم بنية صادقة وعمل ميسر",
  "ويُستحضر أن العبرة بصدق الامتثال لا بكثرة الكلام عن الباب",
  "ويُحذر من تحويل الفائدة إلى جدل يشغل عن العمل",
];

const TATBIQ_PREFIXES = [
  "تطبيق:",
  "عمليًا:",
  "خطوة اليوم:",
  "من التطبيق:",
  "في الميدان:",
  "ما يُستحسن:",
  "مناسب لك:",
  "ابدأ بـ:",
  "جرّب:",
  "التزم:",
  "نصيحة عملية:",
  "من أثر المعنى:",
];

const EXPANSIONS = [
  " ويُستحضر أن العبرة بصدق الامتثال لا بكثرة الكلام عن الباب.",
  " ويُحذر من تحويل الفائدة إلى جدل يشغل عن العمل.",
  " مع التيسير المشروع بلا إسقاط للعزيمة.",
  " ويُستصحب حسن الظن بالمسلمين حيث أمكن.",
  " والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة.",
  " فيُجعل الانتفاع معيارًا لا زخرفة العبارة.",
  " ويُحرص على ثبات القلب حين يختبره نفسه.",
];

const TUPLE_RE =
  /(\[\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*\])/g;

function countPhrases(text, phrases) {
  const counts = Object.fromEntries(phrases.map((p) => [p, 0]));
  for (const p of phrases) {
    let idx = 0;
    while ((idx = text.indexOf(p, idx)) !== -1) {
      counts[p]++;
      idx += p.length;
    }
  }
  return counts;
}

function mergeCounts(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = (out[k] || 0) + v;
  }
  return out;
}

function topEntries(counts, n = 15) {
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function nextAlt(state) {
  const alt = ALT_POOL[state.altIdx % ALT_POOL.length];
  state.altIdx++;
  return alt;
}

function replaceOverused(body, state) {
  let out = body;
  for (const phrase of OVERUSED) {
    while (out.includes(phrase)) {
      const alt = nextAlt(state);
      out = out.replace(phrase, alt);
    }
  }
  return out;
}

function varyTatbiq(body, state) {
  state.tatbiqCounter++;
  if (state.tatbiqCounter % 3 !== 0) return body;
  const prefix = TATBIQ_PREFIXES[state.tatbiqIdx % TATBIQ_PREFIXES.length];
  state.tatbiqIdx++;
  return body.replace(/(?:^|[\.،]\s*)تطبيق:/, (m) => m.replace("تطبيق:", prefix));
}

function expandIfShort(body, state) {
  if (body.length >= 170) return body;
  let out = body;
  let ei = state.expandIdx;
  while (out.length < 170 && ei < EXPANSIONS.length + 8) {
    const chunk = EXPANSIONS[ei % EXPANSIONS.length];
    ei++;
    if (out.includes(chunk.trim())) continue;
    const tatbiqMatch = out.match(
      /(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:)/
    );
    if (tatbiqMatch && tatbiqMatch.index != null) {
      out = out.slice(0, tatbiqMatch.index).trimEnd() + chunk + " " + out.slice(tatbiqMatch.index);
    } else {
      out = out.trimEnd() + chunk;
    }
  }
  state.expandIdx = ei;
  return out;
}

function diversifyBody(body, state) {
  let out = body;
  out = replaceOverused(out, state);
  out = varyTatbiq(out, state);
  out = expandIfShort(out, state);
  return out;
}

function processFile(filePath, apply) {
  const src = fs.readFileSync(filePath, "utf8");
  const state = {
    altIdx: Math.abs(hashStr(filePath)) % ALT_POOL.length,
    tatbiqIdx: Math.abs(hashStr(path.basename(filePath))) % TATBIQ_PREFIXES.length,
    tatbiqCounter: 0,
    expandIdx: 0,
  };

  let changed = 0;
  let shortBefore = 0;
  let shortAfter = 0;
  let bodies = 0;

  const out = src.replace(TUPLE_RE, (full, p1, title, p3, summary, p5, body, p7) => {
    bodies++;
    if (body.length < 170) shortBefore++;
    const next = diversifyBody(body, state);
    if (next.length < 170) shortAfter++;
    if (next !== body) changed++;
    if (!apply || next === body) return full;
    return `${p1}${title}${p3}${summary}${p5}${next}${p7}`;
  });

  if (apply && out !== src) {
    fs.writeFileSync(filePath, out, "utf8");
  }

  return { changed, bodies, shortBefore, shortAfter };
}

function extractBodies(text) {
  const bodies = [];
  let m;
  const re = new RegExp(TUPLE_RE.source, "g");
  while ((m = re.exec(text))) {
    bodies.push(m[6]);
  }
  return bodies;
}

function measureAll() {
  let combined = "";
  const bodyTexts = [];
  for (const f of FILES) {
    const text = fs.readFileSync(path.join(LIB, f), "utf8");
    combined += text;
    bodyTexts.push(...extractBodies(text));
  }
  const allPhrases = [...OVERUSED, ...ALT_POOL, "تطبيق:", ...TATBIQ_PREFIXES];
  const counts = countPhrases(combined, allPhrases);
  const shortBodies = bodyTexts.filter((b) => b.length < 170).length;
  return { counts, shortBodies, bodyCount: bodyTexts.length };
}

function main() {
  const apply = process.argv.includes("--apply");
  const before = measureAll();

  const fileStats = [];
  if (apply) {
    for (const f of FILES) {
      const fp = path.join(LIB, f);
      fileStats.push({ file: f, ...processFile(fp, true) });
    }
  }

  const after = apply ? measureAll() : before;

  const report = {
    mode: apply ? "apply" : "measure",
    bodyCount: before.bodyCount,
    shortBodiesBefore: before.shortBodies,
    shortBodiesAfter: apply ? after.shortBodies : null,
    beforeTop: topEntries(before.counts),
    afterTop: apply ? topEntries(after.counts) : null,
    overusedBefore: topEntries(
      Object.fromEntries(OVERUSED.map((p) => [p, before.counts[p] || 0]))
    ),
    overusedAfter: apply
      ? topEntries(Object.fromEntries(OVERUSED.map((p) => [p, after.counts[p] || 0])))
      : null,
    tatbiqBefore: before.counts["تطبيق:"] || 0,
    tatbiqAfter: apply ? after.counts["تطبيق:"] || 0 : null,
    fileStats: apply ? fileStats : null,
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
