/**
 * PR-18: منسّق نيّات المصحف + سباقات صريحة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-intent-coordinator-pr18-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createMushafIntentCoordinator,
  inferTurnKind,
  isPageMutatingIntent,
  MUSHAF_INTENT_PAGE_BOUNDS,
} from "@/features/mushaf-reader/mushaf-intent-coordinator";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const coordinatorSrc = read("src/features/mushaf-reader/mushaf-intent-coordinator.ts");

assert.match(coordinatorSrc, /createMushafIntentCoordinator/);
assert.match(coordinatorSrc, /TURN_NEXT/);
assert.match(coordinatorSrc, /SEARCH_RESULT/);
assert.match(coordinatorSrc, /SCRUB_COMMIT/);
assert.match(coordinatorSrc, /RESUME/);
assert.match(coordinatorSrc, /user_intent_active|lower_priority/);
assert.match(coordinatorSrc, /superseded_by/);
/* PR-18: عقد + اختبارات سباق — الربط الكامل في القارئ في PR-19 مع Transition SM */
assert.doesNotMatch(
  read("src/features/mushaf-reader/NewMushafReader.tsx"),
  /createMushafIntentCoordinator/,
  "PR-18 keeps coordinator out of NewMushafReader to protect entry budget; wire in PR-19",
);

assert.equal(MUSHAF_INTENT_PAGE_BOUNDS.min, 1);
assert.equal(MUSHAF_INTENT_PAGE_BOUNDS.max, 604);
assert.equal(inferTurnKind(10, 11), "TURN_NEXT");
assert.equal(inferTurnKind(10, 9), "TURN_PREVIOUS");
assert.equal(inferTurnKind(10, 100), "JUMP_PAGE");
assert.equal(isPageMutatingIntent("ROTATE"), false);
assert.equal(isPageMutatingIntent("TURN_NEXT"), true);

function finalPage(coord: ReturnType<typeof createMushafIntentCoordinator>): number | null {
  const snap = coord.snapshot();
  const completed = snap.intents.filter((i) => i.status === "completed" && i.targetPage != null);
  const last = completed[completed.length - 1];
  return last?.targetPage ?? null;
}

/* 1) Swipe ثم سهم — الأحدث يفوز */
{
  const c = createMushafIntentCoordinator();
  const swipe = c.submit({
    kind: "TURN_NEXT",
    source: "swipe",
    targetPage: 11,
  });
  assert.equal(swipe.accepted, true);
  c.beginExecute(swipe.intent.id);
  const arrow = c.submit({
    kind: "TURN_NEXT",
    source: "page-arrow",
    targetPage: 12,
  });
  assert.equal(arrow.accepted, true);
  assert.ok(arrow.cancelledIds.includes(swipe.intent.id));
  assert.equal(c.isActive(swipe.intent.id), false);
  assert.equal(c.complete(swipe.intent.id, { ok: true, page: 11 }), false);
  c.beginExecute(arrow.intent.id);
  assert.equal(c.complete(arrow.intent.id, { ok: true, page: 12 }), true);
  assert.equal(c.getById(arrow.intent.id)?.result?.ok, true);
}

/* 2) سهمان متتاليان بسرعة */
{
  const c = createMushafIntentCoordinator();
  const a = c.submit({ kind: "TURN_NEXT", source: "arrow", targetPage: 2 });
  const b = c.submit({ kind: "TURN_NEXT", source: "arrow", targetPage: 3 });
  assert.equal(a.accepted, true);
  assert.equal(b.accepted, true);
  assert.equal(c.isActive(a.intent.id), false);
  assert.equal(c.getActive()?.targetPage, 3);
}

/* 3) Swipe ثم Search Result */
{
  const c = createMushafIntentCoordinator();
  const swipe = c.submit({ kind: "TURN_NEXT", source: "swipe", targetPage: 50 });
  c.beginExecute(swipe.intent.id);
  const search = c.submit({
    kind: "SEARCH_RESULT",
    source: "search",
    targetPage: 221,
  });
  assert.equal(search.accepted, true);
  assert.equal(c.isActive(swipe.intent.id), false);
  assert.equal(c.getActive()?.kind, "SEARCH_RESULT");
  assert.equal(c.getActive()?.targetPage, 221);
}

/* 4) Search ثم Back (JUMP أقدم يُلغى بـ TURN سابق؟ — Intent جديد يفوز) */
{
  const c = createMushafIntentCoordinator();
  const search = c.submit({
    kind: "SEARCH_RESULT",
    source: "search",
    targetPage: 300,
  });
  c.beginExecute(search.intent.id);
  const back = c.submit({
    kind: "JUMP_PAGE",
    source: "history-back",
    targetPage: 5,
  });
  assert.equal(back.accepted, true);
  assert.equal(c.getActive()?.targetPage, 5);
}

/* 5) Scrubber ثم Rotation — الدوران لا يلغي ولا يغيّر الصفحة */
{
  const c = createMushafIntentCoordinator();
  const scrub = c.submit({
    kind: "SCRUB_COMMIT",
    source: "scrubber",
    targetPage: 100,
  });
  c.beginExecute(scrub.intent.id);
  const rot = c.submit({ kind: "ROTATE", source: "orientation", targetPage: 100 });
  assert.equal(rot.accepted, true);
  assert.equal(c.isActive(scrub.intent.id), true);
  assert.equal(c.getActive()?.targetPage, 100);
}

/* 6) Swipe ثم Background — إلغاء جماعي يوقف الكتابة */
{
  const c = createMushafIntentCoordinator();
  const swipe = c.submit({ kind: "TURN_NEXT", source: "swipe", targetPage: 6 });
  c.beginExecute(swipe.intent.id);
  c.cancelAll("background");
  assert.equal(c.complete(swipe.intent.id, { ok: true, page: 6 }), false);
  assert.equal(c.getActive(), null);
}

/* 7) Resume أثناء Prefetch — Resume system لا يتجاوز user */
{
  const c = createMushafIntentCoordinator();
  const user = c.submit({ kind: "TURN_NEXT", source: "swipe", targetPage: 20 });
  c.beginExecute(user.intent.id);
  const resume = c.submit({
    kind: "RESUME",
    source: "visibility",
    targetPage: 1,
  });
  assert.equal(resume.accepted, false);
  assert.equal(resume.reason, "user_intent_active");
  assert.equal(c.getActive()?.targetPage, 20);
}

/* 8) Prefetch لا يغلب المستخدم */
{
  const c = createMushafIntentCoordinator();
  c.submit({ kind: "TURN_NEXT", source: "swipe", targetPage: 8 });
  const prefetch = c.submit({
    kind: "JUMP_PAGE",
    source: "prefetch",
    targetPage: 10,
    priority: "prefetch",
  });
  assert.equal(prefetch.accepted, false);
  assert.equal(prefetch.reason, "lower_priority");
}

/* 9) Sync صوت لا يغلب Commit مستخدم */
{
  const c = createMushafIntentCoordinator();
  const user = c.submit({ kind: "SCRUB_COMMIT", source: "scrubber", targetPage: 459 });
  c.beginExecute(user.intent.id);
  const sync = c.submit({
    kind: "JUMP_PAGE",
    source: "audio-page-sync",
    targetPage: 460,
    priority: "sync",
  });
  assert.equal(sync.accepted, false);
  assert.equal(c.getActive()?.targetPage, 459);
}

/* 10) Deep Link أثناء Restore — الأحدث (مساوٍ أو أعلى) يفوز */
{
  const c = createMushafIntentCoordinator();
  const restore = c.submit({
    kind: "RESTORE_POSITION",
    source: "boot",
    targetPage: 1,
  });
  assert.equal(restore.accepted, true);
  const deep = c.submit({
    kind: "DEEP_LINK",
    source: "url",
    targetPage: 604,
  });
  assert.equal(deep.accepted, true);
  assert.equal(c.getActive()?.targetPage, 604);
}

/* 11) Bookmark أثناء Search */
{
  const c = createMushafIntentCoordinator();
  c.submit({ kind: "SEARCH_RESULT", source: "search", targetPage: 50 });
  const bm = c.submit({
    kind: "BOOKMARK_RESULT",
    source: "bookmark",
    targetPage: 221,
  });
  assert.equal(bm.accepted, true);
  assert.equal(c.getActive()?.kind, "BOOKMARK_RESULT");
}

/* 12) هدف تالف يُرفض */
{
  const c = createMushafIntentCoordinator();
  const bad = c.submit({
    kind: "JUMP_PAGE",
    source: "corrupt",
    targetPage: Number.NaN,
  });
  assert.equal(bad.accepted, false);
  assert.equal(bad.reason, "invalid_target");
}

/* 13) الحدود تُثبَّت */
{
  const c = createMushafIntentCoordinator();
  const hi = c.submit({ kind: "JUMP_PAGE", source: "t", targetPage: 9999 });
  assert.equal(hi.accepted, true);
  assert.equal(hi.intent.targetPage, 604);
  const lo = c.submit({ kind: "JUMP_PAGE", source: "t", targetPage: -5 });
  assert.equal(lo.intent.targetPage, 1);
}

/* 14) لا كتابة مزدوجة لنفس الانتقال بعد الإلغاء */
{
  const c = createMushafIntentCoordinator();
  const first = c.submit({ kind: "TURN_NEXT", source: "a", targetPage: 2 });
  c.beginExecute(first.intent.id);
  c.submit({ kind: "TURN_NEXT", source: "b", targetPage: 3 });
  assert.equal(c.complete(first.intent.id, { ok: true, page: 2 }), false);
  assert.equal(finalPage(c), null);
}

console.log("mushaf-intent-coordinator-pr18-gate.test.ts: ok");
