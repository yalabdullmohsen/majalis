/**
 * بوابة تباين سمات TopicPage — كل زوج ≥ 4.5:1 للنص، ≥ 3:1 للعناوين الكبيرة.
 * node --import tsx src/lib/__tests__/topic-themes-contrast.test.ts
 */
import assert from "node:assert/strict";
import { TOPIC_THEMES, type TopicThemeId } from "../../config/topic-themes";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function relLum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg: string, bg: string): number {
  const l1 = relLum(hexToRgb(fg));
  const l2 = relLum(hexToRgb(bg));
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

/** سطوع تقريبي ≤ 30% للخلفيات الداكنة */
function approxBrightness(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const ids = Object.keys(TOPIC_THEMES) as TopicThemeId[];
assert.equal(ids.length, 13, "يُتوقع 13 سمة موضوعية");

for (const id of ids) {
  const t = TOPIC_THEMES[id];
  assert.ok(approxBrightness(t.heroFrom) <= 0.35, `${id}.heroFrom ساطع أكثر من اللازم`);
  assert.ok(approxBrightness(t.heroTo) <= 0.4, `${id}.heroTo ساطع أكثر من اللازم`);
  for (const pair of t.contrastPairs) {
    const min = pair.role === "title" ? 3 : 4.5;
    const ratio = contrast(pair.fg, pair.bg);
    assert.ok(
      ratio >= min,
      `${id} ${pair.role}: ${pair.fg} على ${pair.bg} = ${ratio}:1 < ${min}:1`,
    );
    console.log(`  ✓ ${id}/${pair.role} = ${ratio}:1`);
  }
}

console.log("topic-themes-contrast.test.ts: ok");
