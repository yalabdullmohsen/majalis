/**
 * اختبارات محرك الجلسات والتقدم — src/lib/learning-paths/engine.ts
 * تشغيل: npx tsx src/lib/learning-paths/__tests__/engine.test.ts
 */
import {
  buildSchedule,
  canIssueCertificate,
  computeCourseProgress,
  computeRemainingSessions,
  computeTotalSessions,
  estimateWeeksRange,
  generateCertificateCode,
  hasCircularPrerequisite,
  isCourseComplete,
  isCourseUnlocked,
  isItemComplete,
  resolveItemState,
} from "../engine";
import type { CompletionEvent, LearningItem, Prerequisite } from "../types";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

function item(overrides: Partial<LearningItem> = {}): LearningItem {
  return {
    id: "item-1",
    unitId: "unit-1",
    itemType: "lesson",
    title: "عنصر",
    sessionEstimate: 1,
    minutesEstimate: 30,
    weight: 1,
    isRequired: true,
    completionMethod: "manual_confirm",
    completionThreshold: null,
    ...overrides,
  };
}

function ev(overrides: Partial<CompletionEvent> = {}): CompletionEvent {
  return {
    learningItemId: "item-1",
    eventType: "completed",
    evidenceValue: null,
    occurredAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

console.log("═══ resolveItemState ═══");
{
  const s1 = resolveItemState([]);
  assert(s1.status === "not_started", "بلا أحداث ← لم يبدأ");

  const s2 = resolveItemState([ev({ eventType: "started", occurredAt: "2026-01-01T00:00:00Z" })]);
  assert(s2.status === "in_progress", "حدث started ← قيد التقدم");

  const s3 = resolveItemState([
    ev({ eventType: "started", occurredAt: "2026-01-01T00:00:00Z" }),
    ev({ eventType: "completed", occurredAt: "2026-01-02T00:00:00Z" }),
  ]);
  assert(s3.status === "completed", "started ثم completed ← مكتمل");
  assert(s3.completedAt === "2026-01-02T00:00:00Z", "تاريخ الإكمال صحيح");

  const s4 = resolveItemState([
    ev({ eventType: "completed", occurredAt: "2026-01-01T00:00:00Z" }),
    ev({ eventType: "reopened", occurredAt: "2026-01-02T00:00:00Z" }),
  ]);
  assert(s4.status === "in_progress", "completed ثم reopened ← عاد قيد التقدم");
  assert(s4.completedAt === null, "تاريخ الإكمال يُمسَح بعد إعادة الفتح");

  const s5 = resolveItemState([
    ev({ eventType: "progress_update", occurredAt: "2026-01-02T00:00:00Z", evidenceValue: 60 }),
    ev({ eventType: "progress_update", occurredAt: "2026-01-01T00:00:00Z", evidenceValue: 30 }),
  ]);
  assert(s5.latestEvidenceValue === 60, "الترتيب الزمني صحيح رغم إدخال الأحداث بترتيب معكوس");
}

console.log("\n═══ isItemComplete — آليات احتساب مختلفة حسب النوع ═══");
{
  const manual = item({ id: "m1", completionMethod: "manual_confirm" });
  assert(!isItemComplete(manual, []), "manual_confirm بلا أحداث ← غير مكتمل");
  assert(isItemComplete(manual, [ev({ learningItemId: "m1", eventType: "completed" })]), "manual_confirm مع حدث completed ← مكتمل");

  const watch = item({ id: "w1", completionMethod: "watch_percent", completionThreshold: 80 });
  assert(!isItemComplete(watch, [ev({ learningItemId: "w1", eventType: "progress_update", evidenceValue: 50 })]), "watch_percent دون الحد ← غير مكتمل");
  assert(isItemComplete(watch, [ev({ learningItemId: "w1", eventType: "progress_update", evidenceValue: 80 })]), "watch_percent عند الحد بالضبط ← مكتمل");
  assert(isItemComplete(watch, [ev({ learningItemId: "w1", eventType: "progress_update", evidenceValue: 95 })]), "watch_percent فوق الحد ← مكتمل");

  const readItem = item({ id: "r1", completionMethod: "read_scroll", completionThreshold: 90 });
  assert(!isItemComplete(readItem, [ev({ learningItemId: "r1", eventType: "progress_update", evidenceValue: 89 })]), "read_scroll دون الحد بقليل ← غير مكتمل");

  const quiz = item({ id: "q1", completionMethod: "assessment_pass" });
  assert(!isItemComplete(quiz, []), "assessment_pass بلا حدث ← غير مكتمل");
  assert(isItemComplete(quiz, [ev({ learningItemId: "q1", eventType: "completed" })]), "assessment_pass مع حدث completed (بعد اجتياز فعلي) ← مكتمل");
}

console.log("\n═══ حساب الجلسات ═══");
{
  const items = [
    item({ id: "a", sessionEstimate: 2, isRequired: true }),
    item({ id: "b", sessionEstimate: 3, isRequired: true }),
    item({ id: "c", sessionEstimate: 1, isRequired: false }),
  ];
  assert(computeTotalSessions(items) === 6, "إجمالي الجلسات (كل العناصر) = 6");
  assert(computeTotalSessions(items, true) === 5, "إجمالي الجلسات الإلزامية فقط = 5");

  const events = [ev({ learningItemId: "a", eventType: "completed" })];
  assert(computeRemainingSessions(items, events) === 3, "الجلسات المتبقية بعد إنجاز العنصر الأول (2 جلسة) من الإلزامي = 3");
}

console.log("\n═══ estimateWeeksRange — مدى صادق لا رقم واحد وهمي ═══");
{
  const r1 = estimateWeeksRange(36, 4);
  assert(r1.minWeeks <= 9 && r1.maxWeeks >= 9, `36 جلسة بوتيرة 4/أسبوع ← مدى يشمل 9 أسابيع (${r1.minWeeks}-${r1.maxWeeks})`);
  assert(r1.minWeeks < r1.maxWeeks || r1.minWeeks === r1.maxWeeks, "الحد الأدنى ≤ الحد الأعلى دومًا");

  const r0 = estimateWeeksRange(0, 4);
  assert(r0.minWeeks === 0 && r0.maxWeeks === 0, "صفر جلسات ← مدى صفري");

  const rZeroPace = estimateWeeksRange(20, 0);
  assert(rZeroPace.minWeeks === 0, "وتيرة صفرية ← لا قسمة على صفر، مدى صفري بأمان");
}

console.log("\n═══ computeCourseProgress — بالأوزان لا بعدد الصفحات المفتوحة ═══");
{
  const items = [
    item({ id: "read", weight: 40, isRequired: true }),
    item({ id: "lesson", weight: 30, isRequired: true }),
    item({ id: "quiz", weight: 30, isRequired: true, itemType: "assessment" }),
  ];
  const noEvents: CompletionEvent[] = [];
  assert(computeCourseProgress(items, noEvents) === 0, "بلا أي إنجاز ← 0%");

  const readOnly = [ev({ learningItemId: "read", eventType: "completed" })];
  assert(computeCourseProgress(items, readOnly) === 40, "إنجاز القراءة فقط (وزن 40) ← 40%");

  const readAndLesson = [
    ev({ learningItemId: "read", eventType: "completed" }),
    ev({ learningItemId: "lesson", eventType: "completed" }),
  ];
  assert(computeCourseProgress(items, readAndLesson) === 70, "إنجاز القراءة والدرس (40+30) ← 70%");

  const all = [
    ev({ learningItemId: "read", eventType: "completed" }),
    ev({ learningItemId: "lesson", eventType: "completed" }),
    ev({ learningItemId: "quiz", eventType: "completed" }),
  ];
  assert(computeCourseProgress(items, all) === 100, "إنجاز الكل ← 100%");

  assert(computeCourseProgress([], []) === 0, "مقرر بلا عناصر إلزامية ← 0% (لا قسمة على صفر)");
}

console.log("\n═══ isCourseComplete — بوابة الاختبار الإلزامي لا تُتجاوَز ═══");
{
  const items = [
    item({ id: "read", weight: 50, isRequired: true, itemType: "book" }),
    item({ id: "lesson", weight: 20, isRequired: true, itemType: "lesson" }),
    item({ id: "quiz", weight: 30, isRequired: true, itemType: "assessment" }),
  ];
  const contentDoneNoQuiz = [
    ev({ learningItemId: "read", eventType: "completed" }),
    ev({ learningItemId: "lesson", eventType: "completed" }),
  ];
  assert(computeCourseProgress(items, contentDoneNoQuiz) === 70, "عرض المحتوى وحده لا يبلغ 100% بعد (سيطرة القراءة+الدرس فقط)");
  assert(!isCourseComplete(items, contentDoneNoQuiz, null), "لا اختبار مُجتاز ← المقرر غير مكتمل رغم عرض محتوى مرتفع");
  assert(!isCourseComplete(items, contentDoneNoQuiz, { courseId: "c1", passed: false }), "اختبار مرسوب ← المقرر غير مكتمل");

  const allContentDone = [
    ...contentDoneNoQuiz,
    ev({ learningItemId: "quiz", eventType: "completed" }),
  ];
  assert(isCourseComplete(items, allContentDone, { courseId: "c1", passed: true }), "محتوى كامل + اختبار مُجتاز ← مكتمل فعليًا");

  const noAssessmentItems = [item({ id: "read", weight: 100, isRequired: true, itemType: "book" })];
  const doneNoAssessment = [ev({ learningItemId: "read", eventType: "completed" })];
  assert(isCourseComplete(noAssessmentItems, doneNoAssessment, null), "مقرر بلا اختبار إلزامي أصلاً ← يكتمل بإتمام المحتوى فقط");
}

console.log("\n═══ isCourseUnlocked / المتطلبات السابقة ═══");
{
  const prereqs: Prerequisite[] = [
    { courseId: "c2", requiresCourseId: "c1" },
    { courseId: "c3", requiresCourseId: "c2" },
  ];
  assert(isCourseUnlocked("c1", prereqs, new Set()), "مقرر بلا متطلبات ← مفتوح دومًا");
  assert(!isCourseUnlocked("c2", prereqs, new Set()), "c2 يتطلب c1 غير المُنجَز ← مقفل");
  assert(isCourseUnlocked("c2", prereqs, new Set(["c1"])), "c2 بعد إنجاز c1 ← مفتوح");
  assert(!isCourseUnlocked("c3", prereqs, new Set(["c1"])), "c3 يتطلب c2 غير المُنجَز رغم إنجاز c1 ← مقفل");
  assert(isCourseUnlocked("c3", prereqs, new Set(["c1", "c2"])), "c3 بعد إنجاز c1 وc2 ← مفتوح");
}

console.log("\n═══ hasCircularPrerequisite — طبقة تحقق تطبيقية موازية لمشغّل قاعدة البيانات ═══");
{
  assert(!hasCircularPrerequisite([{ courseId: "c2", requiresCourseId: "c1" }]), "سلسلة خطية بسيطة ← لا دائرية");
  assert(
    hasCircularPrerequisite([
      { courseId: "c2", requiresCourseId: "c1" },
      { courseId: "c3", requiresCourseId: "c2" },
      { courseId: "c1", requiresCourseId: "c3" },
    ]),
    "c1←c3←c2←c1 دائرة كاملة ← تُكتشَف",
  );
  assert(!hasCircularPrerequisite([]), "قائمة فارغة ← لا دائرية");
  assert(
    hasCircularPrerequisite([{ courseId: "c1", requiresCourseId: "c1" }]),
    "مقرر يتطلب نفسه مباشرة ← دائرية (حتى لو تجاوز قيد قاعدة البيانات CHECK بطريق آخر)",
  );
}

console.log("\n═══ buildSchedule / rescheduleFromToday ═══");
{
  const items = [
    item({ id: "i1", sessionEstimate: 1, isRequired: true }),
    item({ id: "i2", sessionEstimate: 1, isRequired: true }),
    item({ id: "i3", sessionEstimate: 1, isRequired: true }),
  ];
  const schedule = buildSchedule(items, [], { weeklySessions: 7, preferredDays: [] }, "2026-01-01");
  assert(schedule.length === 3, "جدولة 3 عناصر بلا استبعاد أيام ← 3 جلسات مجدولة");
  assert(schedule[0].scheduledDate === "2026-01-01", "أول جلسة تبدأ من تاريخ البدء نفسه");

  const doneEvents = [ev({ learningItemId: "i1", eventType: "completed" })];
  const remaining = buildSchedule(items, doneEvents, { weeklySessions: 7, preferredDays: [] }, "2026-01-01");
  assert(remaining.length === 2, "العنصر المُنجَز لا يُعاد جدولته");

  const limitedDays = buildSchedule(items, [], { weeklySessions: 2, preferredDays: [1, 4] }, "2026-01-01"); // خميس/أحد بالترقيم 0-6
  assert(limitedDays.every((s) => [1, 4].includes(new Date(`${s.scheduledDate}T00:00:00Z`).getUTCDay())), "الجدولة تلتزم فقط بالأيام المفضّلة المحدَّدة");

  const empty = buildSchedule([], [], { weeklySessions: 4, preferredDays: [] }, "2026-01-01");
  assert(empty.length === 0, "لا عناصر متبقية ← جدول فارغ بلا خطأ");
}

console.log("\n═══ canIssueCertificate — لا شهادة لمن فتح الدروس دون اجتياز المتطلبات ═══");
{
  const courses = [{ id: "c1", stageId: "s1", title: "م1", passPercentage: 70 }, { id: "c2", stageId: "s1", title: "م2", passPercentage: 70 }];
  const allDone = new Map([["c1", true], ["c2", true]]);
  const partialDone = new Map([["c1", true], ["c2", false]]);

  assert(!canIssueCertificate(courses, partialDone, null, false), "مقرر واحد غير مكتمل ← لا شهادة");
  assert(canIssueCertificate(courses, allDone, null, false), "كل المقررات مكتملة وبلا اختبار مسار إلزامي ← شهادة");
  assert(!canIssueCertificate(courses, allDone, null, true), "اختبار المسار الإلزامي مطلوب لكن غير موجود نتيجة ← لا شهادة");
  assert(!canIssueCertificate(courses, allDone, { courseId: "path", passed: false }, true), "رسوب في اختبار المسار الشامل ← لا شهادة رغم اكتمال كل المقررات");
  assert(canIssueCertificate(courses, allDone, { courseId: "path", passed: true }, true), "اكتمال كل المقررات + اجتياز اختبار المسار ← شهادة");
}

console.log("\n═══ generateCertificateCode ═══");
{
  const code1 = generateCertificateCode("aqeedah-path", "user-abc-123");
  const code2 = generateCertificateCode("aqeedah-path", "user-abc-123");
  assert(code1.startsWith("MJ-AQEEDAH-PA-"), "رمز الشهادة يبدأ ببادئة المنصة وجزء من المسار");
  assert(code1 !== code2, "كل استدعاء يُنتج رمزًا فريدًا حتى لنفس المسار والمستخدم");
}

console.log(`\n═══ النتيجة: ${passed} نجح، ${failed} فشل ═══`);
if (failed > 0) process.exit(1);
