/**
 * بوابة محتوى السيرة — كل حدث منشور يلزم بمصادر غير فارغة.
 * تشغيل: node --import tsx src/tests/seerah-content-gate.test.ts
 */
import assert from "node:assert/strict";
import { SEERAH_EVENTS, SEERAH_REVIEW_QUEUE } from "../content/seerah";

assert.ok(SEERAH_EVENTS.length >= 18, `expected ≥18 events, got ${SEERAH_EVENTS.length}`);

for (const event of SEERAH_EVENTS) {
  assert.ok(event.id?.trim(), `event missing id: ${JSON.stringify(event)}`);
  assert.ok(event.titleAr?.trim(), `event ${event.id} missing titleAr`);
  assert.ok(event.phase, `event ${event.id} missing phase`);
  assert.ok(event.shortDescription?.trim(), `event ${event.id} missing shortDescription`);
  assert.ok(
    Array.isArray(event.sources) && event.sources.length >= 1,
    `event ${event.id} needs sources.length >= 1`,
  );
  for (const source of event.sources) {
    assert.ok(source.work, `event ${event.id}: source.work empty`);
    assert.ok(
      typeof source.reference === "string" && source.reference.trim().length > 0,
      `event ${event.id}: source.reference empty`,
    );
  }
}

assert.ok(
  SEERAH_REVIEW_QUEUE.length >= 10,
  `SEERAH_REVIEW_QUEUE length >= 10, got ${SEERAH_REVIEW_QUEUE.length}`,
);

console.log(
  `seerah-content-gate.test.ts: ok (${SEERAH_EVENTS.length} events, ${SEERAH_REVIEW_QUEUE.length} review items)`,
);
