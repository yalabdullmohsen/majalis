#!/usr/bin/env node
/**
 * Round 47 — rebalance lesson bridges at cap (≥40) in core lesson tracks.
 * Usage: node scripts/diversify-lesson-bridges-r47.mjs [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "../src/lib");

const TARGET_FILES = [
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "fikr-waqia-data.ts",
  "usra-mujtama-data.ts",
  "quran-studies-data.ts",
  "iman-topics-data.ts",
  "tazkiya-topics-data.ts",
];

const MAX_BRIDGE_FREQ = 40;

const TUPLE_RE =
  /(\[\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*\])/g;
const BODY_FIELD_RE = /(body:\s*")((?:[^"\\]|\\.)*)(")/g;

/** Fresh scholarly bridges for round 47 — not in r40/r41/r42 dominant pools. */
const R47_BRIDGE_POOL = [
  "ويُستحضر أن الورع في السر أثبت من حسن الظاهر",
  "فلا يُستبدل التزام الحق بزخرفة العبارة",
  "ويُتأنى في الحكم حتى تتضح مقاصد الشريعة",
  "فالاستقامة على المعروف أبلغ من كثرة المواعظ",
  "ويُحذر من جعل العلم وسيلة للمباهاة",
  "فلا يُستعجل الجواب قبل ضبط السؤال",
  "ويُراعى أن الدعوة بالقدوة أسبق من كثرة الكلام",
  "فالثبات على الطاعة أثبت من انفعالات المجلس",
  "فلا يُخلط بين ما ثبت وما رُوي بلا سند",
  "ويُستدعى مراقبة الله عند كل تنزيل للمعنى",
  "فالبر يُقاس بما يُترك لله لا بما يُقال عنه",
  "ويُحافظ على تواضع المتعلم حتى يثبت العمل",
  "فلا يُستعجل ثمرة ما لم يُثبت أصله",
  "ويُؤخذ من الباب بقدر ما يُحتمله القلب والعمل",
  "فلا يُبالغ في التعميم على كل موقف بلا ضابط",
  "فالنية الصادقة شرط لقبول أي فهم",
  "ويُتجنب إلباس الهوى ثوب الدين",
  "فلا يُغتر بكثرة الاستماع دون أثر في السلوك",
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
  "فلا يُطلب من الباب ما لم يُقصد به الشرع",
  "ويُستحضر أن التزام الحق أثقل من إظهاره",
  "فلا يُستبدل الورع بالتشدق في العبارة",
  "فلا يُطوَّل في البيان على حساب سلامة الضمير",
  "ويُحذّر نفسه من تحويل الفائدة إلى جدل يشغل عن العمل",
  "ويُستحضر أن العبرة بصدق الامتثال لا بكثرة الكلام عن الباب",
  "مع التيسير المشروع بلا إسقاط للعزيمة",
  "مع ضبط اللسان عن الدعوى بلا برهان",
  "ويُترك ما لم يثبت سندًا",
  "فلا يُجعل الباب ذريعة للجدل بلا فائدة",
  "فلا تُضمّن للباب ما لم يُتبين منه",
  "ويُستحضر أن الإخلاص قبل الإظهار",
  "ويُراعى مقام الحكم بين التشديد والتساهل",
  "ويُحذّر نفسه من تزيين النفس بحسن الكلام",
  "فلا يُطلب من النص ما لم يُفتح له باب",
  "ويُستحضر أن كل باب يُسأل عنه يوم القيامة",
  "فالحذر من تزيين النفس بما لم يُعمل",
  "مع تقديم ما صحّ سندًا على المشهور الواهي",
  "والصبر على مقتضاه من تمام العمل",
];

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

function pickReplacement(body, pool, counts) {
  const candidates = pool.filter((p) => !body.includes(p)).sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
  const underCap = candidates.filter((p) => (counts[p] || 0) < MAX_BRIDGE_FREQ);
  const pick = (underCap.length ? underCap : candidates.length ? candidates : pool)[0];
  counts[pick] = (counts[pick] || 0) + 1;
  return pick;
}

function redistributeBody(body, counts, state) {
  let out = body;
  const over = R47_BRIDGE_POOL.filter((p) => (counts[p] || 0) >= MAX_BRIDGE_FREQ && out.includes(p)).sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0)
  );
  for (const phrase of over) {
    while ((counts[phrase] || 0) >= MAX_BRIDGE_FREQ && out.includes(phrase)) {
      const alt = pickReplacement(out, R47_BRIDGE_POOL, counts);
      if (alt === phrase) break;
      counts[phrase]--;
      out = out.replace(phrase, alt);
      state.replaced++;
    }
  }
  return out;
}

function processFile(filePath, counts, apply) {
  const src = fs.readFileSync(filePath, "utf8");
  const state = { replaced: 0 };
  let out = src.replace(TUPLE_RE, (full, p1, title, p3, summary, p5, body, p7) => {
    const next = redistributeBody(body, counts, state);
    if (!apply || next === body) return full;
    return `${p1}${title}${p3}${summary}${p5}${next}${p7}`;
  });
  out = out.replace(BODY_FIELD_RE, (full, p1, body, p3) => {
    const next = redistributeBody(body, counts, state);
    if (!apply || next === body) return full;
    return `${p1}${next}${p3}`;
  });
  if (apply && out !== src) fs.writeFileSync(filePath, out, "utf8");
  return state.replaced;
}

function main() {
  const apply = process.argv.includes("--apply");
  const existing = TARGET_FILES.filter((f) => fs.existsSync(path.join(LIB, f)));
  let combined = "";
  for (const f of existing) combined += fs.readFileSync(path.join(LIB, f), "utf8");
  const before = countPhrases(combined, R47_BRIDGE_POOL);
  const beforeOver = Object.entries(before).filter(([, c]) => c >= MAX_BRIDGE_FREQ).length;

  let totalReplaced = 0;
  if (apply) {
    let counts = { ...before };
    for (let pass = 0; pass < 6; pass++) {
      let any = false;
      for (const f of existing) {
        const n = processFile(path.join(LIB, f), counts, true);
        if (n > 0) {
          totalReplaced += n;
          any = true;
        }
      }
      combined = "";
      for (const f of existing) combined += fs.readFileSync(path.join(LIB, f), "utf8");
      counts = countPhrases(combined, R47_BRIDGE_POOL);
      const over = Object.values(counts).filter((c) => c >= MAX_BRIDGE_FREQ).length;
      if (over === 0 || !any) break;
    }
  }

  combined = "";
  for (const f of existing) combined += fs.readFileSync(path.join(LIB, f), "utf8");
  const after = countPhrases(combined, R47_BRIDGE_POOL);
  const afterOver = Object.entries(after).filter(([, c]) => c >= MAX_BRIDGE_FREQ).length;
  const maxAfter = Math.max(0, ...Object.values(after));

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        files: existing.length,
        bridgesAtCapBefore: beforeOver,
        bridgesAtCapAfter: afterOver,
        maxFreqAfter: maxAfter,
        replaced: totalReplaced,
      },
      null,
      2
    )
  );
}

main();
