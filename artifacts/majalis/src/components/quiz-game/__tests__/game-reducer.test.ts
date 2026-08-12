/**
 * اختبار وحدة لـ reducer محرّك لعبة الاختبارات (IslamicQuizGame.tsx) —
 * بلا React/DOM، منطق نقي بحت: بدء اللعبة (فردي/فرق)، حساب النتائج عند
 * الإجابة الصحيحة/الخاطئة، دوران الأدوار، وسائل المساعدة (خصم نقاط بحدّ
 * أدنى صفر)، اكتمال اللوحة ← مرحلة الفائز، وإعادة الاختبار (RESET).
 *
 * تُشغَّل عبر: npx tsx src/components/quiz-game/__tests__/game-reducer.test.ts
 */
import {
  reducer, initial, buildBoard, nextTeamId, isBoardDone,
  type Cell,
} from "../IslamicQuizGame";
import { GAME_CATEGORIES } from "../../../data/islamicQuizData";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

const CAT1 = GAME_CATEGORIES[0].id;
const CAT2 = GAME_CATEGORIES[1].id;

console.log("\n=== START_GAME — وضع الفرق ===");
{
  const state = reducer(initial, {
    type: "START_GAME", mode: "team", categories: [CAT1, CAT2], names: ["فريق أ", "فريق ب"],
  });
  assert(state.phase === "board", "الانتقال لمرحلة اللوحة بعد بدء اللعبة");
  assert(state.teams.length === 2, "فريقان بالضبط بالأسماء المُدخَلة");
  assert(state.teams[0].name === "فريق أ" && state.teams[1].name === "فريق ب", "أسماء الفرق محفوظة بالترتيب");
  assert(state.teams.every((t) => t.score === 0), "كل الفرق تبدأ بنتيجة صفر");
  assert(state.activeTeamId === state.teams[0].id, "الفريق الأول هو النشط أولاً");
  assert(state.board.length === 2 && state.board[0].length === 3, "اللوحة بحجم صحيح (فئتان × 3 مستويات نقاط)");
}

console.log("\n=== START_GAME — الوضع الفردي ===");
{
  const state = reducer(initial, {
    type: "START_GAME", mode: "solo", categories: [CAT1], names: ["أحمد"],
  });
  assert(state.teams.length === 1 && state.teams[0].id === "solo", "لاعب واحد بمعرّف \"solo\"");
  assert(state.teams[0].name === "أحمد", "اسم اللاعب محفوظ");
  assert(nextTeamId(state.teams, "solo") === "solo", "دوران الدور في الوضع الفردي يبقى على نفس اللاعب دومًا");
}

console.log("\n=== حساب النتائج — MARK_CORRECT يضيف نقاط الخلية للفريق الصحيح فقط ===");
{
  let state = reducer(initial, { type: "START_GAME", mode: "team", categories: [CAT1, CAT2], names: ["أ", "ب"] });
  const cell: Cell = { categoryId: CAT1, points: 400, used: false };
  state = { ...state, activeCell: cell, activeQuestion: { id: "test-q", q: "?", a: "!", hint: "" } };
  const scorerId = state.activeTeamId;
  const next = reducer(state, { type: "MARK_CORRECT" });
  const scorer = next.teams.find((t) => t.id === scorerId)!;
  const other = next.teams.find((t) => t.id !== scorerId)!;
  assert(scorer.score === 400, `الفريق المجيب اكتسب نقاط الخلية بالضبط (400) — الفعلي: ${scorer.score}`);
  assert(other.score === 0, "الفريق الآخر لم تتأثر نتيجته إطلاقًا");
  assert(next.board[0][1].used === true, "الخلية (فئة1/400) وُسمت مُستخدَمة بعد الإجابة");
  assert(next.usedIds.includes("test-q"), "معرّف السؤال المُجاب أُضيف لقائمة المُستخدَمة (لا تكرار لاحقًا)");
  assert(next.activeTeamId === nextTeamId(state.teams, scorerId), "الدور انتقل للفريق التالي بعد الإجابة");
  assert(next.phase === "board", "العودة لمرحلة اللوحة (لا انتهاء بعد لخليتين فقط من 6)");
}

console.log("\n=== حساب النتائج — MARK_WRONG لا يضيف نقاطًا لأحد ===");
{
  let state = reducer(initial, { type: "START_GAME", mode: "team", categories: [CAT1], names: ["أ", "ب"] });
  const cell: Cell = { categoryId: CAT1, points: 600, used: false };
  state = { ...state, activeCell: cell, activeQuestion: { id: "wrong-q", q: "?", a: "!", hint: "" } };
  const next = reducer(state, { type: "MARK_WRONG" });
  assert(next.teams.every((t) => t.score === 0), "لا فريق يكتسب نقاطًا عند الإجابة الخاطئة");
  assert(next.board.flat().find((c) => c.points === 600)?.used === true, "الخلية تُستهلك رغم الإجابة الخاطئة (لا إعادة طرحها)");
}

console.log("\n=== وسيلة خصم النقاط — لا تنزل النتيجة تحت الصفر ===");
{
  let state = reducer(initial, { type: "START_GAME", mode: "team", categories: [CAT1], names: ["أ", "ب"] });
  const targetId = state.teams[1].id;
  state = { ...state, activeCell: { categoryId: CAT1, points: 600, used: false } };
  // الفريق الهدف برصيد 0 أصلاً؛ خصم 600 يجب ألا يُنتج رصيدًا سالبًا
  const next = reducer(state, { type: "USE_LIFELINE_PENALIZE", targetId });
  const target = next.teams.find((t) => t.id === targetId)!;
  assert(target.score === 0, `الرصيد لا ينزل تحت الصفر (Math.max(0,...)) — الفعلي: ${target.score}`);
  assert(target.score >= 0, "لا رصيد سالب مطلقًا");

  const activeAfter = next.teams.find((t) => t.id === state.activeTeamId)!;
  assert(activeAfter.lifelines.penalize === false, "وسيلة الخصم تُستهلَك بعد استخدامها (لا استخدام مزدوج)");

  const usedAgain = reducer(next, { type: "USE_LIFELINE_PENALIZE", targetId });
  assert(usedAgain === next, "استخدام وسيلة مُستهلَكة فعلاً لا يُغيّر الحالة (محمي من الاستخدام المزدوج)");
}

console.log("\n=== اكتمال اللوحة ← مرحلة الفائز ===");
{
  let state = reducer(initial, { type: "START_GAME", mode: "team", categories: [CAT1], names: ["أ", "ب"] });
  // فئة واحدة = 3 خلايا فقط (200/400/600). الدور يتبدّل تلقائيًا بعد كل
  // إجابة صحيحة (MARK_CORRECT يستدعي nextTeamId) — فالفريقان يتبادلان
  // الإجابات هنا، لا فريق واحد يستولي على الثلاث كلها.
  for (const pts of [200, 400, 600] as const) {
    state = { ...state, activeCell: { categoryId: CAT1, points: pts, used: false }, activeQuestion: { id: `q-${pts}`, q: "?", a: "!", hint: "" } };
    state = reducer(state, { type: "MARK_CORRECT" });
  }
  assert(isBoardDone(state.board), "دالة isBoardDone تُقرّ اكتمال اللوحة بعد استهلاك كل الخلايا");
  assert(state.phase === "winner", "الحالة تنتقل تلقائيًا لمرحلة \"winner\" عند اكتمال آخر خلية");
  const totalScore = state.teams.reduce((sum, t) => sum + t.score, 0);
  assert(totalScore === 200 + 400 + 600, `مجموع نقاط كل الفرق يساوي مجموع نقاط الخلايا بالضبط (1200) — لا نقاط ضاعت أو تضاعفت — الفعلي: ${totalScore}`);
  // بالتبادل: أ يجيب 200 (الدور الأول) ← ينتقل لـ"ب" ← ب يجيب 400 ← ينتقل لـ"أ" ← أ يجيب 600
  assert(state.teams[0].score === 200 + 600, `الفريق "أ" أجاب على الجولتين الأولى والثالثة (200+600=800) — الفعلي: ${state.teams[0].score}`);
  assert(state.teams[1].score === 400, `الفريق "ب" أجاب على الجولة الثانية فقط (400) — الفعلي: ${state.teams[1].score}`);
}

console.log("\n=== فريق واحد يجيب على كل الأسئلة (نفس النشط ثابتًا) — تراكم صحيح ===");
{
  let state = reducer(initial, { type: "START_GAME", mode: "team", categories: [CAT1], names: ["أ", "ب"] });
  for (const pts of [200, 400, 600] as const) {
    // إجبار نفس الفريق على البقاء نشطًا في كل جولة (محاكاة تدخّل يدوي/واجهة)
    state = {
      ...state,
      activeTeamId: state.teams[0].id,
      activeCell: { categoryId: CAT1, points: pts, used: false },
      activeQuestion: { id: `solo-run-${pts}`, q: "?", a: "!", hint: "" },
    };
    state = reducer(state, { type: "MARK_CORRECT" });
  }
  assert(state.teams[0].score === 200 + 400 + 600,
    `فريق واحد يجيب على كل الخلايا الثلاث يتراكم رصيده حسابيًا بالضبط (1200) — الفعلي: ${state.teams[0].score}`);
}

console.log("\n=== RESET — إعادة الاختبار تُرجع الحالة الابتدائية بالكامل ===");
{
  let state = reducer(initial, { type: "START_GAME", mode: "team", categories: [CAT1, CAT2], names: ["أ", "ب"] });
  state = { ...state, activeCell: { categoryId: CAT1, points: 200, used: false }, activeQuestion: { id: "x", q: "?", a: "!", hint: "" } };
  state = reducer(state, { type: "MARK_CORRECT" });
  assert(state.teams[0].score > 0, "تحقّق تمهيدي: النتيجة تراكمت فعلاً قبل إعادة الضبط");
  const reset = reducer(state, { type: "RESET" });
  assert(reset === initial, "RESET يُرجع نفس مرجع الحالة الابتدائية (لا بقايا نتائج أو حالة سابقة)");
  assert(reset.phase === "setup", "العودة لمرحلة الإعداد — جاهز لجولة جديدة كاملة");
  assert(reset.teams.every((t) => t.score === 0), "كل النتائج صُفِّرت فعليًا بعد إعادة الاختبار");
}

console.log("\n=== نتائج غير متعادلة — لا فوز وهمي بالتعادل الحقيقي (فحص بيانات لا واجهة) ===");
{
  const board = buildBoard([CAT1, CAT2]);
  assert(board.length === 2, "buildBoard يبني عمودًا لكل فئة مطلوبة بالضبط");
  assert(board.every((col) => col.length === 3), "كل عمود بثلاث خلايا (200/400/600) دومًا");
  assert(!isBoardDone(board), "لوحة جديدة كليًا ليست \"مكتملة\" (كل الخلايا غير مُستخدَمة)");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
