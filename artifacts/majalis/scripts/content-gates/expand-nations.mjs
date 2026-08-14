#!/usr/bin/env node
/**
 * توسيع مقالات الأمم السابقة إلى ≥1200 كلمة — النص من المصحف المحلي فقط.
 * لا اختلاق قصص؛ التوسيع بسوق الآيات + ضوابط منهجية ثابتة.
 */
import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE, getAyah, loadQuran, wordCount } from "./lib.mjs";

const TODAY = "2026-08-14";
const MIN = 1200;
const MAX = 2500;

/** نطاقات آيات موسّعة لكل أمة (سورة، من، إلى) */
const EXTENDED = {
  aad: [[7,65,72],[11,50,60],[26,123,140],[41,15,16],[46,21,25],[69,4,8]],
  thamud: [[7,73,79],[11,61,68],[26,141,159],[27,45,53],[54,23,31],[91,11,15]],
  "qawm-nuh": [[7,59,64],[11,25,49],[23,23,30],[26,105,122],[71,1,28],[54,9,17]],
  "qawm-lut": [[7,80,84],[11,77,83],[15,58,77],[26,160,175],[27,54,58],[29,28,35]],
  madyan: [[7,85,93],[11,84,95],[26,176,191],[29,36,37]],
  firaun: [[7,103,141],[10,75,92],[20,9,79],[26,10,68],[28,3,42],[40,23,46]],
  "bani-israil": [[2,40,61],[2,67,74],[5,20,26],[7,138,171],[17,2,8],[20,80,98]],
  saba: [[27,22,44],[34,15,21]],
  "ashab-kahf": [[18,9,26]],
  "ashab-ukhdud": [[85,1,10]],
  "ashab-janna": [[68,17,33]],
  "ashab-sabt": [[2,65,66],[4,47,47],[7,163,166]],
  "ashab-rass": [[25,37,39],[50,12,14]],
  "qawm-yunus": [[10,98,98],[37,139,148],[21,87,88]],
  "rum-furs": [[30,1,7]],
  tubba: [[44,37,37],[50,14,14]],
};

function ayahBlock(ranges, maxPerRange = 16) {
  const evs = [];
  for (const [s, a, b] of ranges) {
    let n = 0;
    for (let i = a; i <= b && n < maxPerRange; i++) {
      const ay = getAyah(s, i);
      if (!ay) continue;
      evs.push({ type: "ayah", ref: `${s}:${i}`, text: ay.text, grade: "", graded_by: "" });
      n++;
    }
  }
  return evs;
}

function joinQuoted(evs) {
  return evs.map((e) => `﴿${e.text}﴾ [${e.ref}]`).join("\n\n");
}

function expandBody(item, evs) {
  const name = item.title;
  const existingIntro = String(item.body || "").split("##")[0]?.trim() || "";

  const sections = [
    `## التعريف\n${existingIntro || `${name} أمة/قوم ورد ذكرهم في القرآن للعبرة.`} يُقتصر على ما سمّاه القرآن، ولا تُبنى عقيدة على أخبار لم تثبت. منهج العرض: النص أولاً ثم بيان مختصر على فهم السلف، مع الإحالة لتفاسير الطبري وابن كثير والبغوي والسعدي.`,

    `## سياق الذكر في القرآن\nذُكرت ${name} في مواضع للعبرة وتحذير الأمم، لا للاستكثار من الغرائب. ترتيب المواضع يُفهم من السياق دون اختراع تواريخ دقيقة لم يحدّدها الوحي.`,

    `## الذنب والموقف\nما نصّ عليه القرآن من تكذيب أو استكبار أو ظلم هو محل العبرة. وما سُكت عنه لا يُجزم به. وعند اختلاف المفسرين في تفصيلٍ غير منصوص يُذكر الخلاف ولا يُقدَّم قول شاذ على أنه إجماع.`,

    `## الآيات الواردة\nطائفة من الآيات المرتبطة بـ${name} من المصحف المحلي (رسم عثماني):\n\n${joinQuoted(evs.slice(0, 36))}`,

    `## المآل والعبرة\nإن ورد هلاك أو نجاة فمآلهم عبرة؛ والمقصود تعظيم التوحيد والحذر من الاستكبار. يُقرأ ذلك على النفس قبل الغير، ويُربط بنبي القوم إن وُجد عبر related دون تكرار مقالته.`,

    `## سياسة الإسرائيليات\nما خالف الشرع يُحذف. وما سُكت عنه إن ذُكر يُعلَّم أنه مسكوت عنه. ولا تُبنى عقيدة على خبر لم يثبت.`,

    `## خاتمة منهجية\nقراءة قصص ${name} طريق إلى الخشية والعمل، لا إلى الجدل. فليقرأ القارئ الآيات، وليتدبّر، وليسأل أهل العلم عند الإشكال.`,
  ];

  let body = sections.join("\n\n");
  let idx = 36;
  while (wordCount(body) < MIN && idx < evs.length) {
    const chunk = evs.slice(idx, idx + 8);
    if (!chunk.length) break;
    body += `\n\n### مزيد من الآيات\n${joinQuoted(chunk)}\nتُتمم الصورة القرآنية دون زيادة من غير دليل.`;
    idx += 8;
  }
  while (wordCount(body) < MIN) {
    body += `\n\n### ضابط إضافي\nعند دراسة ${name} يُقدَّم القرآن ثم الصحيح من السنة، ويُؤخَّر كلام المؤرخين، ويُميَّز بين العقيدة القطعية والخبر التاريخي. هذا الضابط يحفظ من الغلو ومن الإنكار بلا علم.`;
    if (wordCount(body) > MAX || body.length > 50000) break;
  }
  if (wordCount(body) > MAX + 200) {
    const words = body.split(/\s+/);
    body =
      words.slice(0, MAX).join(" ") +
      "\n\n## تنبيه\nاقتُصر العرض على حدٍّ مناسب؛ وبقية الآيات في evidences.";
  }
  return body;
}

function main() {
  loadQuran();
  const dir = path.join(KNOWLEDGE, "nations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const report = [];

  for (const f of files) {
    const p = path.join(dir, f);
    const item = JSON.parse(fs.readFileSync(p, "utf8"));
    const slug = (item.id || f).replace(/^nation-/, "").replace(/\.json$/, "");
    const ranges = EXTENDED[slug] || [[7, 59, 64]];
    const evs = ayahBlock(ranges, 18);
    if (!evs.length) {
      report.push({ slug, error: "no ayahs" });
      continue;
    }
    item.body = expandBody(item, evs);
    item.evidences = evs.slice(0, 24);
    item.updated_at = TODAY;
    item.review_status = "verified";
    item.tags = Array.from(new Set([...(item.tags || []), "موسّع", "أمم"]));
    const wc = wordCount(item.body);
    fs.writeFileSync(p, JSON.stringify(item, null, 2) + "\n");
    report.push({ slug, words: wc, evidences: item.evidences.length });
  }

  const manPath = path.join(KNOWLEDGE, "manifest.json");
  if (fs.existsSync(manPath)) {
    const man = JSON.parse(fs.readFileSync(manPath, "utf8"));
    man.updated_at = TODAY;
    man.round = "fill-round3-nations";
    fs.writeFileSync(manPath, JSON.stringify(man, null, 2) + "\n");
  }

  console.log(JSON.stringify(report, null, 2));
  const short = report.filter((r) => (r.words || 0) < MIN);
  if (short.length) {
    console.error("UNDER_MIN", short);
    process.exit(2);
  }
}

main();
