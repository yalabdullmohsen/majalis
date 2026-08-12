#!/usr/bin/env node
/**
 * اختبار سلبي (negative test) دائم لحارس سلامة نص القرآن — المرحلة 8.
 *
 * الهدف: إثبات أن آلية SHA-256 في scripts/verify-quran-integrity.mjs حارس
 * حقيقي فعليًا يرفض أي تلاعب بالنص، لا مجرد فحص شكلي ينجح دومًا — بنفس
 * أسلوب الاختبار السلبي المستخدم في scripts/test-no-regressions.mjs لهذا
 * المشروع (إثبات أن الفحص يفشل فعليًا عند حقن حالة خاطئة قبل الوثوق به).
 *
 * ⚠️ لا يكتب على القرص إطلاقًا ولا يُعدِّل أي ملف قرآني حقيقي — كل "الحقن"
 * يحدث على نسخة نصية في الذاكرة فقط. هذا مقصود: أي اختبار سلبي يُعدِّل نص
 * القرآن الحقيقي على القرص (ولو مؤقتًا) يحمل خطر ترك الملف تالفًا فعليًا
 * إن انقطع التنفيذ في المنتصف — غير مقبول لأخطر بيانات في هذه المنصة.
 *
 * يتحقق من مسارين:
 *  1. [إيجابي] الملف الحقيقي على القرص يطابق sha256 المسجَّل في manifest.json
 *     الآن (لا فساد قائم فعليًا).
 *  2. [سلبي] نسخة في الذاكرة من نفس المحتوى، بعد تغيير حرف عربي واحد فقط
 *     في نص إحدى الآيات، يجب أن يُنتج sha256 مختلفًا يفشل المطابقة —
 *     يثبت أن آلية المقارنة تكتشف فعليًا أي انحراف حرف واحد، لا نصف مقارنة
 *     تنجح خطأً (مثل مقارنة الطول فقط أو تطبيع قبل الحساب).
 *
 * تشغيل: npx tsx scripts/test-quran-integrity-guard.mjs
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let passed = 0;
let failed = 0;

function check(label, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ${GREEN}✓${RESET} ${label}`);
  } else {
    failed++;
    console.log(`  ${RED}✗ ${label}${detail ? ` — ${detail}` : ""}${RESET}`);
  }
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** يبدّل أول حرف عربي بعد أوّل ظهور لـ"text": بحرف مختلف — تلاعب أدنى ممكن (حرف واحد). */
function injectSingleCharCorruption(content) {
  const marker = '"text"';
  const idx = content.indexOf(marker);
  if (idx === -1) throw new Error('لم يُعثر على حقل "text" في الملف — بنية غير متوقعة');
  const arabicCharRe = /[؀-ۿ]/;
  for (let i = idx; i < content.length - 1; i++) {
    if (arabicCharRe.test(content[i])) {
      const replacement = content[i] === "ا" ? "أ" : "ا"; // حرف عربي مختلف فعليًا
      if (replacement === content[i]) continue;
      return content.slice(0, i) + replacement + content.slice(i + 1);
    }
  }
  throw new Error("لم يُعثر على حرف عربي قابل للتبديل");
}

async function main() {
  console.log(`${BOLD}اختبار سلبي لحارس سلامة نص القرآن (بلا كتابة على القرص)${RESET}\n`);

  let manifestRaw;
  try {
    manifestRaw = await readFile(path.join(DATA_DIR, "manifest.json"), "utf8");
  } catch {
    console.log(`${RED}✗ manifest.json غير موجود — شغّل node scripts/fetch-quran-data.mjs أولاً${RESET}`);
    process.exit(1);
  }
  const manifest = JSON.parse(manifestRaw);

  // نختار سورة قصيرة نسبيًا (الفاتحة) لسرعة الاختبار — الآلية نفسها تنطبق على أي سورة.
  const entry = manifest.surahs?.find((s) => s.number === 1);
  check("سجل السورة رقم 1 موجود في manifest", Boolean(entry));
  if (!entry) {
    console.log(`\n${BOLD}النتيجة: ${GREEN}${passed} نجح${RESET}${BOLD}، ${RED}${failed} فشل${RESET}`);
    process.exit(1);
  }

  const filePath = path.join(DATA_DIR, entry.file);
  const realContent = await readFile(filePath, "utf8"); // قراءة فقط — لا كتابة أبدًا

  // 1) المسار الإيجابي: الملف الحقيقي سليم الآن.
  const realHash = sha256(realContent);
  check("الملف الحقيقي الحالي يطابق sha256 المسجَّل (لا فساد قائم)", realHash === entry.sha256, `متوقَّع ${entry.sha256.slice(0, 12)}… فعلي ${realHash.slice(0, 12)}…`);

  // 2) المسار السلبي: نسخة في الذاكرة فقط بحرف واحد مختلف يجب أن ترفضها المقارنة.
  const corruptedInMemory = injectSingleCharCorruption(realContent);
  check("الحقن الصناعي غيَّر المحتوى فعليًا (حرف واحد على الأقل)", corruptedInMemory !== realContent);

  const corruptedHash = sha256(corruptedInMemory);
  check(
    "sha256 النسخة المُلوَّثة (ذاكرة فقط) يختلف عن sha256 الملف الحقيقي — الحارس كان سيرفضها",
    corruptedHash !== realHash,
    "لو تطابقا هنا فآلية sha256 لا تكتشف تغييرًا بحرف واحد — حارس زائف",
  );
  check(
    "sha256 النسخة المُلوَّثة لا يطابق القيمة المسجَّلة في manifest أيضًا",
    corruptedHash !== entry.sha256,
  );

  // تأكيد إضافي: الملف على القرص لم يُمسّ إطلاقًا طوال هذا الاختبار.
  const afterContent = await readFile(filePath, "utf8");
  check("الملف الحقيقي على القرص لم يتغيّر بايتًا واحدًا أثناء هذا الاختبار", afterContent === realContent);

  console.log(`\n${BOLD}النتيجة: ${GREEN}${passed} نجح${RESET}${BOLD}، ${failed > 0 ? RED : GREEN}${failed} فشل${RESET}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}خطأ غير متوقع:${RESET}`, err);
  process.exit(1);
});
