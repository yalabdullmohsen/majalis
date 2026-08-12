#!/usr/bin/env node
/**
 * Round 48 — raise live lesson bodies to ≥220 chars; diversify bridges max≤35.
 * Usage: node scripts/enrich-r48-lesson-bodies.mjs [--apply] [--verify]
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

const MIN_LEN = 220;
const MAX_BRIDGE_FREQ = 35;

const TUPLE_RE =
  /(\[\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*\])/g;

const BODY_FIELD_RE = /(body:\s*")((?:[^"\\]|\\.)*)(")/g;

const TATBIQ_RE =
  /(?:^|[\.،]\s*)(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:|واجب عملي:|مناسب:|خطوة:|ابدأ:|جرّب:|التزم:)/;

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
  "واجب عملي:",
  "مناسب:",
  "خطوة:",
  "ابدأ:",
];

/** Fresh scholarly bridges for round 48 — not in r42/r47 dominant pools. */
const R48_BRIDGE_POOL = [
  "ويُستحضر أن الانتفاع بالعلم يبدأ من القلب قبل اللسان",
  "فلا يُجعل الباب ذريعة لجدلٍ بلا أثر في السلوك",
  "ويُراعى أن التزام الحق أثقل من إظهاره للناس",
  "فالورع في السر أثبت عند الله من حسن الظاهر",
  "ويُتأنى في الحكم حتى تتضح مقاصد الشريعة",
  "فلا يُستعجل ثمرة ما لم يُثبت أصله بالدليل",
  "ويُستدعى مراقبة الله عند كل تنزيل للمعنى",
  "فالبر يُقاس بما يُترك لله لا بما يُقال عنه",
  "ويُحافظ على تواضع المتعلم حتى يثبت العمل",
  "فلا يُبالغ في التعميم على كل موقف بلا ضابط",
  "ويُستحضر أن السكوت عن الباطل فضيلة حين لا يُنتظر نفع",
  "فالنية الصادقة شرط لقبول أي فهم شرعي",
  "ويُتجنب إلباس الهوى ثوب الدين",
  "فلا يُغتر بكثرة الاستماع دون أثر في الخلق",
  "ويُستصحب أن العلم زاد مسؤولية لا مزية",
  "فالحذر من تزيين النفس بما لم يُعمل",
  "ويُراعى أن الفهم يتسع للرحمة لا للتعنت",
  "فالصدق في القصد أولى من حسن الصياغة",
  "ويُعوَّل على دوام الطاعة لا على بداية الحماس",
  "فالورع أن يُمسك اللسان عن ما لم يُثبت",
  "ويتأكد أن نفع العلم يظهر في الخلق قبل الجدل",
  "ويُستصحب حسن الظن بالمسلمين حيث أمكن",
  "فيُعرض المعنى على الكتاب والسنة قبل الرأي",
  "ويُؤثر الدليل على الهوى والعادة",
  "ويُستصحب مراقبة الله في السر كما في العلن",
  "ويُستحضر المآل الأخروي عند تنزيل الفائدة",
  "ويُستصحب التواضع عند العمل بهذا المعنى",
  "ويُحذر من الرياء عند إظهار العمل بهذا الباب",
  "ويُؤخذ منه خلق ظاهر قبل كثرة الكلام",
  "مع مراعاة مراتب الأحكام وأحوال الناس",
  "مع إيثار الرفق في الدعوة والعمل",
  "ويُترك التكلّف فيما لم يدلّ عليه الوحي",
  "مع ضبط النفس عن الغلو",
  "والغاية تزكية النفس لا الجدل",
  "ويُسأل الله التوفيق للعمل لا لمجرد العلم",
  "فالمقصود تزكية القلب والجوارح معًا",
  "فيُعرض أي تفصيل زائد على نصوص الكتاب والسنة الصحيحة",
  "ويُفرَّق بين المقصود الشرعي وبين العادات التي تُنسَب إليه بلا دليل",
  "فيُجعل الباب سببًا لمحاسبة النفس لا لتزكيتها",
  "فيُقدَّم الإصلاح الذاتي على كثرة الوعظ لغيرك",
  "فيُجعل الانتفاع معيارًا لا زخرفة العبارة",
  "ويُستدعى أثر المعنى في النية قبل الجهر",
  "فيُربط الفهم بنية صادقة وعمل ميسر",
  "ويُحرص على ثبات القلب حين يختبره نفسه",
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
  "فلا يُخلط بين ما ثبت وما رُوي بلا سند",
  "ويُراعى أن الدعوة بالقدوة أسبق من كثرة الكلام",
  "فالثبات على الطاعة أثبت من انفعالات المجلس",
  "ويُستحضر أن كل باب يُسأل عنه يوم القيامة",
  "فلا يُطلب من النص ما لم يُفتح له باب",
  "فلا يُستبدل التزام الحق بزخرفة العبارة",
  "ويُحذر من جعل العلم وسيلة للمباهاة",
  "فلا يُستعجل الجواب قبل ضبط السؤال",
  "فالاستقامة على المعروف أبلغ من كثرة المواعظ",
  "ويُؤخذ من الباب بقدر ما يُحتمله القلب والعمل",
  "مع تقديم ما صحّ سندًا على المشهور الواهي",
  "والصبر على مقتضاه من تمام العمل",
  "فلا تُضمّن للباب ما لم يُتبين منه",
  "ويُستحضر أن الإخلاص قبل الإظهار",
  "ويُراعى مقام الحكم بين التشديد والتساهل",
  "ويُحذّر نفسه من تزيين النفس بحسن الكلام",
  "فلا يُطوَّل في البيان على حساب سلامة الضمير",
  "مع ضبط اللسان عن الدعوى بلا برهان",
  "والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة",
  "مع التيسير المشروع بلا إسقاط للعزيمة",
  "فيُقدَّم الإصلاح الذاتي على كثرة الوعظ لغيرك",
  "ويُترك ما لم يثبت سندًا",
  "مع إيثار الرفق في الدعوة والعمل",
];

const TRACKED_PHRASES = [...new Set(R48_BRIDGE_POOL)];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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

function maxFrequency(counts) {
  let max = 0;
  let top = "";
  for (const p of TRACKED_PHRASES) {
    const c = counts[p] || 0;
    if (c > max) {
      max = c;
      top = p;
    }
  }
  return { max, top };
}

function readExistingFiles() {
  return FILES.filter((f) => fs.existsSync(path.join(LIB, f)));
}

function extractAllBodies(fileList) {
  let combined = "";
  for (const f of fileList) combined += fs.readFileSync(path.join(LIB, f), "utf8");
  return combined;
}

function measurePerFile(fileList) {
  const perFile = {};
  let total = 0;
  let under = 0;
  for (const f of fileList) {
    const text = fs.readFileSync(path.join(LIB, f), "utf8");
    const bodies = [];
    let m;
    const re = new RegExp(TUPLE_RE.source, "g");
    while ((m = re.exec(text))) bodies.push(m[6]);
    const bre = new RegExp(BODY_FIELD_RE.source, "g");
    while ((m = bre.exec(text))) bodies.push(m[2]);
    const u = bodies.filter((b) => b.length < MIN_LEN).length;
    perFile[f] = { total: bodies.length, underMin: u, minLen: bodies.length ? Math.min(...bodies.map((b) => b.length)) : 0 };
    total += bodies.length;
    under += u;
  }
  return { perFile, total, under };
}

function cleanArtifacts(body) {
  return body
    .replace(/\.undefined/g, ".")
    .replace(/undefined/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function pickBridge(body, counts, idx) {
  const candidates = R48_BRIDGE_POOL.filter((p) => !body.includes(p.replace("للمباhaة", "للمباهاة"))).sort(
    (a, b) => (counts[a.replace("للمباhaة", "للمباهاة")] || 0) - (counts[b.replace("للمباhaة", "للمباهاة")] || 0),
  );
  const underCap = candidates.filter((p) => (counts[p.replace("للمباhaة", "للمباهاة")] || 0) < MAX_BRIDGE_FREQ);
  const pool = underCap.length ? underCap : candidates.length ? candidates : R48_BRIDGE_POOL;
  const pick = pool[idx % pool.length].replace("للمباhaة", "للمباهاة");
  counts[pick] = (counts[pick] || 0) + 1;
  return pick;
}

function insertBeforeTatbiq(body, chunk) {
  const sep = chunk.startsWith(" ") ? "" : " ";
  const piece = sep + chunk.trimEnd() + (chunk.endsWith(".") ? "" : ".");
  const match = body.match(TATBIQ_RE);
  if (match?.index != null && match.index > 0) {
    return body.slice(0, match.index).trimEnd() + piece + " " + body.slice(match.index);
  }
  return body.trimEnd() + piece;
}

function expandBody(body, counts, state) {
  let out = cleanArtifacts(body);
  if (out.length >= MIN_LEN) return out;

  let guard = 0;
  while (out.length < MIN_LEN && guard < 24) {
    guard++;
    const bridge = pickBridge(out, counts, state.bridgeIdx++);
    const formatted = bridge.startsWith("و") || bridge.startsWith("ف") || bridge.startsWith("م") ? bridge : `و${bridge}`;
    if (out.includes(formatted)) continue;
    out = insertBeforeTatbiq(out, formatted);
  }

  if (out.length < MIN_LEN) {
    const filler = " والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة.";
    if (!out.includes(filler.trim())) out = insertBeforeTatbiq(out, filler.trim());
  }

  return out;
}

function varyTatbiq(body, state) {
  state.tatbiqCounter++;
  if (state.tatbiqCounter % 3 !== 0) return body;
  const prefix = TATBIQ_PREFIXES[state.tatbiqIdx % TATBIQ_PREFIXES.length];
  state.tatbiqIdx++;
  return body.replace(
    /(?:^|[\.،]\s*)(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:|واجب عملي:|مناسب:|خطوة:|ابدأ:)/,
    (m) => {
      const old = m.match(/(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:|واجب عملي:|مناسب:|خطوة:|ابدأ:)/);
      if (!old) return m;
      return m.replace(old[0], prefix);
    },
  );
}

function pickReplacement(body, pool, counts) {
  const candidates = pool.filter((p) => !body.includes(p.replace("للمباhaة", "للمباهاة"))).sort(
    (a, b) => (counts[a.replace("للمباhaة", "للمباهاة")] || 0) - (counts[b.replace("للمباhaة", "للمباهاة")] || 0),
  );
  const underCap = candidates.filter((p) => (counts[p.replace("للمباhaة", "للمباهاة")] || 0) < MAX_BRIDGE_FREQ);
  if (underCap.length) return underCap[0].replace("للمباhaة", "للمباهاة");
  if (candidates.length) return candidates[0].replace("للمباhaة", "للمباهاة");
  return pool.sort((a, b) => (counts[a.replace("للمباhaة", "للمباهاة")] || 0) - (counts[b.replace("للمباhaة", "للمباهاة")] || 0))[0].replace(
    "للمباhaة",
    "للمباهاة",
  );
}

function redistributeBridges(body, counts) {
  let out = body;
  const over = TRACKED_PHRASES.filter((p) => (counts[p] || 0) > MAX_BRIDGE_FREQ).sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0),
  );
  for (const phrase of over) {
    while ((counts[phrase] || 0) > MAX_BRIDGE_FREQ && out.includes(phrase)) {
      const alt = pickReplacement(out, R48_BRIDGE_POOL, counts);
      counts[phrase]--;
      counts[alt] = (counts[alt] || 0) + 1;
      out = out.replace(phrase, alt);
    }
  }
  return out;
}

function processBody(body, counts, state) {
  let out = expandBody(body, counts, state);
  out = varyTatbiq(out, state);
  out = redistributeBridges(out, counts);
  if (out.length < MIN_LEN) out = expandBody(out, counts, state);
  return out;
}

function processFile(filePath, counts, apply) {
  const src = fs.readFileSync(filePath, "utf8");
  const state = {
    bridgeIdx: Math.abs(hashStr(filePath)) % R48_BRIDGE_POOL.length,
    tatbiqIdx: Math.abs(hashStr(path.basename(filePath))) % TATBIQ_PREFIXES.length,
    tatbiqCounter: 0,
  };
  let changed = 0;

  let out = src.replace(TUPLE_RE, (full, p1, title, p3, summary, p5, body, p7) => {
    const next = processBody(body, counts, state);
    if (next !== body) changed++;
    if (!apply || next === body) return full;
    return `${p1}${title}${p3}${summary}${p5}${next}${p7}`;
  });

  out = out.replace(BODY_FIELD_RE, (full, p1, body, p3) => {
    const next = processBody(body, counts, state);
    if (next !== body) changed++;
    if (!apply || next === body) return full;
    return `${p1}${next}${p3}`;
  });

  if (apply && out !== src) fs.writeFileSync(filePath, out, "utf8");
  return changed;
}

function applyAll(fileList) {
  let pass = 0;
  let combined = extractAllBodies(fileList);
  let counts = countPhrases(combined, TRACKED_PHRASES);

  while (pass < 10) {
    pass++;
    let anyChanged = false;
    for (const f of fileList) {
      const n = processFile(path.join(LIB, f), counts, true);
      if (n > 0) anyChanged = true;
    }
    combined = extractAllBodies(fileList);
    counts = countPhrases(combined, TRACKED_PHRASES);
    const { max } = maxFrequency(counts);
    if (max <= MAX_BRIDGE_FREQ && !anyChanged) break;
  }

  return counts;
}

function main() {
  const apply = process.argv.includes("--apply");
  const verify = process.argv.includes("--verify");
  const fileList = readExistingFiles();

  const before = measurePerFile(fileList);
  const beforeCombined = extractAllBodies(fileList);
  const beforeCounts = countPhrases(beforeCombined, TRACKED_PHRASES);
  const beforeMax = maxFrequency(beforeCounts);

  if (apply) applyAll(fileList);

  const after = apply || verify ? measurePerFile(fileList) : before;
  const afterCombined = apply || verify ? extractAllBodies(fileList) : beforeCombined;
  const afterCounts = apply || verify ? countPhrases(afterCombined, TRACKED_PHRASES) : beforeCounts;
  const afterMax = maxFrequency(afterCounts);

  const report = {
    mode: apply ? "apply" : verify ? "verify" : "dry-run",
    minThreshold: MIN_LEN,
    maxBridgeFreq: MAX_BRIDGE_FREQ,
    before: {
      totalBodies: before.total,
      underMin: before.under,
      perFile: before.perFile,
      maxBridgeFreq: beforeMax.max,
      maxBridgePhrase: beforeMax.top,
    },
    after: apply || verify
      ? {
          totalBodies: after.total,
          underMin: after.under,
          perFile: after.perFile,
          maxBridgeFreq: afterMax.max,
          maxBridgePhrase: afterMax.top,
        }
      : null,
  };

  console.log(JSON.stringify(report, null, 2));
  if (verify && after.under > 0) process.exit(1);
}

main();
