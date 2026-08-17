#!/usr/bin/env node
/**
 * بوابة شبكة الأسطر — ٦٠٤ صفحة: ١٥ خانة، صفر تعارض خانات.
 */
import assert from "node:assert/strict";
import { computePageSlots, loadChaptersJson, loadPageJson } from "./slot-layout.mjs";

const chapters = loadChaptersJson();

for (let n = 1; n <= 604; n++) {
  const raw = loadPageJson(n);
  const { slots, isOpening, headerStartLines } = computePageSlots(n, chapters, raw);
  const occupied = [...slots.keys()];
  assert.ok(occupied.every((s) => s >= 1 && s <= 15), `صفحة ${n}: خانة خارج ١–١٥`);
  assert.equal(occupied.length, slots.size, `صفحة ${n}: تعارض خانات`);

  if (!isOpening) {
    for (const [surahNum, firstLine] of headerStartLines) {
      const ch = chapters.find((c) => c.id === surahNum);
      if (!ch) continue;
      const usedLines = [...new Set(raw.flatMap((v) => v.words.map((w) => w.line_number)))].sort(
        (a, b) => a - b,
      );
      const prevUsed = usedLines.filter((ln) => ln < firstLine).pop() ?? 0;
      const bannerSlot = Math.max(1, prevUsed + 1);
      assert.ok(slots.has(bannerSlot), `صفحة ${n}: شارة سورة ${surahNum}`);
      if (ch.bismillah_pre) {
        assert.ok(slots.has(bannerSlot + 1), `صفحة ${n}: بسملة سورة ${surahNum}`);
        assert.equal(slots.get(bannerSlot + 1)?.kind, "basmala", `صفحة ${n}: خانة البسملة`);
      }
    }
  }

  if (n === 187) {
    assert.ok(![...slots.values()].some((s) => s.kind === "basmala"), "ص١٨٧ بلا بسملة");
  }
}

console.log("✓ mushaf-line-grid-gate (data): 604 pages ok");
