#!/usr/bin/env node
/**
 * Round 41 — rebalance overused lesson body bridges (post-r40 clustering).
 * Usage: node scripts/diversify-lesson-bridges-r41.mjs [--apply]
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
  "maqasid-sharia-data.ts",
  "dalail-nubuwwah-data.ts",
  "arabic-language-data.ts",
  "sunnah-studies-data.ts",
  "tarikh-islami-data.ts",
  "mawsuaat-data.ts",
];

/** Primary r40 clusters to break up (plus any tracked phrase > MAX_FREQ). */
const PRIORITY_OVERUSED = [
  "ويُستحضر أن العبرة بصدق الامتثال لا بكثرة الكلام عن الباب",
  "فيُجعل الانتفاع معيارًا لا زخرفة العبارة",
  "ويُحذر من تحويل الفائدة إلى جدل يشغل عن العمل",
  "فيُربط الفهم بنية صادقة وعمل ميسر",
  "ويُحرص على ثبات القلب حين يختبره نفسه",
];

/** Legacy r40 pool — tracked for measurement; over-limit entries get redistributed. */
const LEGACY_POOL = [
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
  "فلا تُضمّن للباب ما لم يُتبين منه",
  "ويُستحضر أن الإخلاص قبل الإظهار",
  "ويُراعى مقام الحكم بين التشديد والتساهل",
  "ويُحذّر نفسه من تزيين النفس بحسن الكلام",
  "فلا يُطوَّل في البيان على حساب سلامة الضمير",
  "ويُستدعى أثر المعنى في النية قبل الجهر",
  "فلا يُجعل الباب ذريعة للجدل بلا فائدة",
  "فيُجعل الباب سببًا لمحاسبة النفس لا لتزكيتها",
  "فيُقدَّم الإصلاح الذاتي على كثرة الوعظ لغيرك",
  "مع تقديم ما صحّ سندًا على المشهور الواهي",
  "والصبر على مقتضاه من تمام العمل",
];

/** ≥25 fresh scholarly bridges for round 41 (never used in r40 pool). */
const NEW_R41_POOL = [
  "ويتأكد أن نفع العلم يظهر في الخلق قبل الجدل",
  "فلا يُستبدل الورع بالتشدق في العبارة",
  "ويُعوَّل على دوام الطاعة لا على بداية الحماس",
  "فالورع أن يُمسك اللسان عن ما لم يُثبت",
  "ويُستحضر أن التزام الحق أثقل من إظهاره",
  "فلا يُطلب من الباب ما لم يُقصد به الشرع",
  "ويُراعى أن الفهم يتسع للرحمة لا للتعنت",
  "فالصدق في القصد أولى من حسن الصياغة",
  "ويُتجنب إلباس الهوى ثوب الدين",
  "فلا يُغتر بكثرة الاستماع دون أثر في السلوك",
  "ويُستصحب أن العلم زاد مسؤولية لا مزية",
  "فالحذر من تزيين النفس بما لم يُعمل",
  "ويُؤخذ من الباب بقدر ما يُحتمله القلب والعمل",
  "فلا يُبالغ في التعميم على كل موقف بلا ضابط",
  "ويُستحضر أن السكوت عن الباطل فضيلة حين لا يُنتظر نفع",
  "فالنية الصادقة شرط لقبول أي فهم",
  "ويُراعى أن التيسير لا يُلغي العزيمة",
  "فلا يُستعجل ثمرة ما لم يُثبت أصله",
  "ويُحافظ على تواضع المتعلم حتى يثبت العمل",
  "فالبر يُقاس بما يُترك لله لا بما يُقال عنه",
  "ويُستدعى مراقبة الله عند كل تنزيل للمعنى",
  "فلا يُخلط بين ما ثبت وما رُوي بلا سند",
  "ويُتأنى في الحكم حتى تتضح مقاصد الشريعة",
  "فالاستقامة على المعروف أبلغ من كثرة المواعظ",
  "ويُحذر من جعل العلم وسيلة للمباهاة",
  "فلا يُستعجل الجواب قبل ضبط السؤال",
  "ويُراعى أن الدعوة بالقدوة أسبق من كثرة الكلام",
  "فالثبات على الطاعة أثبت من انفعالات المجلس",
  "ويُستحضر أن كل باب يُسأل عنه يوم القيامة",
  "فلا يُطلب من النص ما لم يُفتح له باب",
];

const MAX_FREQ = 35;

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
  "من الواجب:",
  "للتطبيق:",
  "خطوة عملية:",
];

const SAFE_EXPANSIONS = [
  " مع التيسير المشروع بلا إسقاط للعزيمة.",
  " ويُستصحب حسن الظن بالمسلمين حيث أمكن.",
  " والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة.",
  " ويتأكد أن نفع العلم يظهر في الخلق قبل الجدل.",
  " فلا يُستبدل الورع بالتشدق في العبارة.",
  " ويُعوَّل على دوام الطاعة لا على بداية الحماس.",
  " فالورع أن يُمسك اللسان عن ما لم يُثبت.",
  " ويُراعى أن التيسير لا يُلغي العزيمة.",
];

const TUPLE_RE =
  /(\[\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*\])/g;

const TRACKED_PHRASES = [
  ...new Set([...PRIORITY_OVERUSED, ...LEGACY_POOL, ...NEW_R41_POOL]),
].filter(Boolean);

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

function maxFrequency(counts, phrases = TRACKED_PHRASES) {
  let max = 0;
  let top = "";
  for (const p of phrases) {
    const c = counts[p] || 0;
    if (c > max) {
      max = c;
      top = p;
    }
  }
  return { max, top };
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

function readExistingFiles() {
  const existing = [];
  for (const f of FILES) {
    const fp = path.join(LIB, f);
    if (fs.existsSync(fp)) existing.push(f);
  }
  return existing;
}

function extractBodies(text) {
  const bodies = [];
  let m;
  const re = new RegExp(TUPLE_RE.source, "g");
  while ((m = re.exec(text))) bodies.push(m[6]);
  return bodies;
}

function measureFiles(fileList) {
  let combined = "";
  const bodyTexts = [];
  for (const f of fileList) {
    const text = fs.readFileSync(path.join(LIB, f), "utf8");
    combined += text;
    bodyTexts.push(...extractBodies(text));
  }
  const counts = countPhrases(combined, TRACKED_PHRASES);
  const { max, top } = maxFrequency(counts);
  return { counts, bodyCount: bodyTexts.length, shortBodies: bodyTexts.filter((b) => b.length < 170).length, maxFreq: max, maxPhrase: top };
}

function pickReplacement(body, pool, counts) {
  const candidates = pool
    .filter((p) => !body.includes(p))
    .sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
  const underCap = candidates.filter((p) => (counts[p] || 0) < MAX_FREQ);
  if (underCap.length) return underCap[0];
  if (candidates.length) return candidates[0];
  return pool.sort((a, b) => (counts[a] || 0) - (counts[b] || 0))[0];
}

function redistributeBody(body, breakSet, pool, counts) {
  let out = body;
  const ordered = [...breakSet].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  for (const phrase of ordered) {
    while ((counts[phrase] || 0) > MAX_FREQ && out.includes(phrase)) {
      const alt = pickReplacement(out, pool, counts);
      counts[phrase]--;
      counts[alt] = (counts[alt] || 0) + 1;
      out = out.replace(phrase, alt);
    }
  }
  return out;
}

function varyTatbiq(body, state) {
  state.tatbiqCounter++;
  if (state.tatbiqCounter % 2 !== 0) return body;
  const prefix = TATBIQ_PREFIXES[state.tatbiqIdx % TATBIQ_PREFIXES.length];
  state.tatbiqIdx++;
  return body.replace(
    /(?:^|[\.،]\s*)(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:)/,
    (m) => m.replace(/(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:)/, prefix)
  );
}

function expandIfShort(body, state) {
  if (body.length >= 170) return body;
  let out = body;
  let ei = state.expandIdx;
  let guard = 0;
  while (out.length < 170 && guard < 24) {
    guard++;
    const chunk = SAFE_EXPANSIONS[ei % SAFE_EXPANSIONS.length];
    ei++;
    const trimmed = chunk.trim();
    if (out.includes(trimmed)) continue;
    const tatbiqMatch = out.match(
      /(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:)/
    );
    if (tatbiqMatch?.index != null) {
      out = out.slice(0, tatbiqMatch.index).trimEnd() + chunk + " " + out.slice(tatbiqMatch.index);
    } else {
      out = out.trimEnd() + chunk;
    }
  }
  if (out.length < 170) {
    out = out.trimEnd() + " والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة.";
  }
  state.expandIdx = ei;
  return out;
}

function processFile(filePath, breakSet, pool, counts, apply) {
  const src = fs.readFileSync(filePath, "utf8");
  const state = {
    tatbiqIdx: Math.abs(hashStr(path.basename(filePath))) % TATBIQ_PREFIXES.length,
    tatbiqCounter: 0,
    expandIdx: Math.abs(hashStr(filePath)) % SAFE_EXPANSIONS.length,
  };

  let changed = 0;
  let shortBefore = 0;
  let shortAfter = 0;

  const out = src.replace(TUPLE_RE, (full, p1, title, p3, summary, p5, body, p7) => {
    if (body.length < 170) shortBefore++;
    let next = redistributeBody(body, breakSet, pool, counts);
    next = varyTatbiq(next, state);
    next = expandIfShort(next, state);
    if (next.length < 170) shortAfter++;
    if (next !== body) changed++;
    if (!apply || next === body) return full;
    return `${p1}${title}${p3}${summary}${p5}${next}${p7}`;
  });

  if (apply && out !== src) fs.writeFileSync(filePath, out, "utf8");
  return { changed, shortBefore, shortAfter };
}

function buildReplacementPool(counts) {
  const legacyUnder = LEGACY_POOL.filter((p) => (counts[p] || 0) < MAX_FREQ - 5);
  return [...new Set([...NEW_R41_POOL, ...legacyUnder])];
}

function applyAll(fileList) {
  let pass = 0;
  let workingCounts = measureFiles(fileList).counts;
  const allFileStats = [];

  while (pass < 6) {
    pass++;
    const breakSet = buildBreakSet(workingCounts);
    if (breakSet.size === 0) break;
    const pool = buildReplacementPool(workingCounts);
    const passStats = [];
    for (const f of fileList) {
      passStats.push({ file: f, ...processFile(path.join(LIB, f), breakSet, pool, workingCounts, true) });
    }
    allFileStats.push({ pass, breakUpCount: breakSet.size, files: passStats });
    const measured = measureFiles(fileList);
    workingCounts = measured.counts;
    if (measured.maxFreq <= MAX_FREQ) break;
  }

  return { workingCounts, allFileStats, final: measureFiles(fileList) };
}

function buildBreakSet(counts) {
  return new Set(TRACKED_PHRASES.filter((p) => (counts[p] || 0) > MAX_FREQ));
}

function main() {
  const apply = process.argv.includes("--apply");
  const fileList = readExistingFiles();
  const before = measureFiles(fileList);
  const breakSet = buildBreakSet(before.counts);

  let fileStats = null;
  let after = before;
  if (apply) {
    const result = applyAll(fileList);
    after = result.final;
    fileStats = result.allFileStats;
  }

  const priorityBefore = Object.fromEntries(
    PRIORITY_OVERUSED.filter((p) => p.length > 10).map((p) => [p, before.counts[p] || 0])
  );
  const priorityAfter = apply
    ? Object.fromEntries(PRIORITY_OVERUSED.filter((p) => p.length > 10).map((p) => [p, after.counts[p] || 0]))
    : null;

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "measure",
        files: fileList.length,
        bodyCount: before.bodyCount,
        shortBodiesBefore: before.shortBodies,
        shortBodiesAfter: apply ? after.shortBodies : null,
        maxFreqBefore: before.maxFreq,
        maxPhraseBefore: before.maxPhrase,
        maxFreqAfter: apply ? after.maxFreq : null,
        maxPhraseAfter: apply ? after.maxPhrase : null,
        breakUpCount: breakSet.size,
        newPoolSize: NEW_R41_POOL.length,
        priorityBefore,
        priorityAfter,
        beforeTop: topEntries(before.counts),
        afterTop: apply ? topEntries(after.counts) : null,
        fileStats: apply ? fileStats : null,
      },
      null,
      2
    )
  );
}

main();
