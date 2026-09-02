#!/usr/bin/env node
/**
 * يزيل أجسام الدروس المحشوّة آلياً في ملفات *-data.ts ذات الشكل
 * ["عنوان", "ملخص", "متن = ملخص + حشو"]
 * إن صار المتن مطابقاً للملخص بعد التنظيف يُحوَّل الزوج إلى ["عنوان","ملخص"].
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIB = path.join(root, "src/lib");

const TARGETS = [
  "usra-mujtama-data.ts",
  "tazkiya-topics-data.ts",
  "iman-topics-data.ts",
  "fikr-waqia-data.ts",
  "tarikh-islami-data.ts",
  "mawsuaat-data.ts",
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "maqasid-sharia-data.ts",
  "sunnah-studies-data.ts",
  "arabic-language-data.ts",
  "dalail-nubuwwah-data.ts",
];

const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";
const FILLER_RE = /\s*يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت\.?\s*$/;

const PAD_RE =
  /الصبر على مقتضاه|يُستحضر المآل|يُسأل الله التوفيق|يُترجم المعنى إلى طاعة|تُربط سيرته|البلاغة تُخدم بفهم السياق|علم الحديث يضبط الرواية|البرهان على النبوة تراكمي|يُقدَّم قول الجمهور عند تعادل|الموسوعة أداة مرجع|التحقيق يقتضي نسبة القول|يُراعى حال المتعلم فلا يُلقى|لا يُستدل بالمتشابه على هدم المحكم|تُقدَّم المعجزة القرآنية/;

function unescapeTs(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}
function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

let filesTouched = 0;
let triplesFixed = 0;

for (const name of TARGETS) {
  const file = path.join(LIB, name);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  let n = 0;
  const next = src.replace(
    /\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]/g,
    (full, titleRaw, summaryRaw, bodyRaw) => {
      const summary = unescapeTs(summaryRaw).trim();
      let body = unescapeTs(bodyRaw).trim();
      const hadFiller = body.includes(FILLER);
      const hadPad = PAD_RE.test(body);
      if (!hadFiller && !hadPad && body.length < 240) return full;
      if (hadFiller) {
        body = body.replace(FILLER_RE, "").split(FILLER).join("").replace(/\s{2,}/g, " ").trim();
      } else if (hadPad || body.length >= 400) {
        // متن حشو قديم طويل: اختزله إلى الملخص دون إضافة جملة قالب جديدة
        body = summary;
      } else {
        return full;
      }
      n++;
      if (!body || body === summary) {
        return `["${titleRaw}", "${summaryRaw}"]`;
      }
      return `["${titleRaw}", "${summaryRaw}", "${escapeTs(body)}"]`;
    },
  );
  if (n > 0) {
    fs.writeFileSync(file, next, "utf8");
    filesTouched++;
    triplesFixed += n;
    console.log(`✓ ${name}: ${n} متنًا`);
  } else {
    console.log(`· ${name}: لا تغيير`);
  }
}

console.log(`strip-lesson-filler: ${triplesFixed} متن في ${filesTouched} ملف`);
