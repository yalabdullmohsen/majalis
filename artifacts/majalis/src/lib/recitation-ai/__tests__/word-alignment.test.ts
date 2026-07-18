/**
 * اختبارات محاذاة النافذة (Needleman-Wunsch) — src/lib/recitation-ai/word-alignment.ts
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/word-alignment.test.ts
 */
import { alignWindow, type AlignOp } from "../word-alignment";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

function types(ops: AlignOp[]): string {
  return ops.map((o) => o.type[0]).join("");
}

console.log("═══ alignWindow — سيناريوهات القسم 14 ═══");
{
  // 1. قراءة صحيحة تمامًا
  const r1 = alignWindow(["الحمد", "لله", "رب", "العالمين"], ["الحمد", "لله", "رب", "العالمين"]);
  assert(types(r1) === "mmmm", `قراءة صحيحة ← كل الكلمات match (${types(r1)})`);

  // 2. حذف كلمة (نسيان)
  const r2 = alignWindow(["الحمد", "رب", "العالمين"], ["الحمد", "لله", "رب", "العالمين"]);
  assert(types(r2) === "mdmm", `حذف "لله" ← delete واحدة (${types(r2)})`);
  assert(r2.find((o) => o.type === "delete")?.refIndex === 1, "الحذف عند فهرس \"لله\" في المرجع");

  // 3. تبديل كلمة (خطأ حفظ)
  const r3 = alignWindow(["الحمد", "لله", "ملك", "العالمين"], ["الحمد", "لله", "رب", "العالمين"]);
  assert(types(r3) === "mmsm", `تبديل "رب"←"ملك" ← substitute (${types(r3)})`);

  // 4. كلمة زائدة (يقين المستخدم أضاف كلمة)
  const r4 = alignWindow(["الحمد", "لله", "يا", "رب", "العالمين"], ["الحمد", "لله", "رب", "العالمين"]);
  assert(types(r4) === "mmimm", `زيادة "يا" ← insert (${types(r4)})`);

  // 5. تقديم/تأخير كلمتين متجاورتين — للخوارزمية العالمية البسيطة هذه لا
  //    "swap" مخصص، فتُمثَّل بمزيج delete+insert أو substitute+substitute
  //    (نفس الدرجة رياضيًا) — المهم هنا: النتيجة ليست "مطابقة تامة" رغم
  //    أن نفس الكلمات موجودة، أي أن الخوارزمية اكتشفت خللاً في الترتيب.
  //    تصنيف "تقديم/تأخير" كنوع خطأ مستقل يقع في طبقة أعلى
  //    (RecitationErrorDetector تفحص نمط delete(X)...insert(X) القريب).
  const r5 = alignWindow(["الحمد", "رب", "لله", "العالمين"], ["الحمد", "لله", "رب", "العالمين"]);
  assert(types(r5) !== "mmmm", `تقديم/تأخير يُكتشَف كخلل وليس تطابقًا تامًا (${types(r5)})`);
  assert(r5.some((o) => o.type !== "match"), "توجد عملية غير match واحدة على الأقل");

  // 6. نافذة سماع فارغة (توقف طويل قبل أي نطق) ← كل المرجع delete
  const r6 = alignWindow([], ["الحمد", "لله"]);
  assert(r6.every((o) => o.type === "delete"), "نافذة سماع فارغة ← كل شيء ناقص");

  // 7. نافذة مرجعية فارغة (لا كلمات متوقعة، كل المسموع زائد)
  const r7 = alignWindow(["كلام", "زائد"], []);
  assert(r7.every((o) => o.type === "insert"), "لا مرجع ← كل شيء زائد");

  // 8. تلاوة مجوّدة (مدود لا تُعتبر أخطاء لأنها نفس الكلمة المطبَّعة —
  //    التطبيع يُزيل المدود قبل هذه الخوارزمية أصلاً، فهذا اختبار أن
  //    الخوارزمية نفسها لا تُنشئ فروقًا وهمية لسلاسل متطابقة)
  const r8 = alignWindow(["الرحمن", "الرحيم"], ["الرحمن", "الرحيم"]);
  assert(types(r8) === "mm", "نص مطبَّع متطابق ← match تام بلا أثر لطول المدّ");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
