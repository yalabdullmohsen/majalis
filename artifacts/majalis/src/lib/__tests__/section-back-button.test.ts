/**
 * بوابة: زر رجوع موحّد من قالب SectionLobby — الفقه وكل جذور التبويبات.
 * تشغيل: node --import tsx src/lib/__tests__/section-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const lobby = read("src/components/lobby/SectionLobby.tsx");
const css = read("src/components/lobby/section-lobby.css");
assert.match(lobby, /data-section-back="1"/, "القالب يحمل زر الرجوع");
assert.match(lobby, /goBackOrFallback/);
assert.match(lobby, /DirectionalIcon/);
assert.match(css, /\.section-lobby__back[\s\S]*min-height:\s*44px/, "منطقة لمس ≥44px");
assert.match(css, /\.section-lobby__back[\s\S]*min-width:\s*44px/);
assert.match(css, /\.section-lobby__back[\s\S]*text-align:\s*center/);
assert.match(css, /\.section-lobby__back[\s\S]*position:\s*fixed/, "عائم أسفل يمين كبقية الأقسام");
assert.match(css, /\.section-lobby__back[\s\S]*inset-inline-start:\s*1rem/, "يمين في RTL");
assert.match(css, /\.section-lobby__back[\s\S]*bottom:\s*calc\(var\(--bottom-nav-total/);

const gate = read("scripts/section-back-button-gate.mjs");
assert.match(gate, /\/fiqh/);
assert.match(gate, /data-section-back/);
assert.ok((gate.match(/"[/][^"]+"/g) ?? []).length >= 8, "البوابة تزور مسارات الأقسام");

const pages: Array<[string, string]> = [
  ["fiqh", "src/pages/fiqh/ui/FiqhView.tsx"],
  ["quran", "src/pages/quran/ui/QuranHubView.tsx"],
  ["lessons", "src/pages/lessons/ui/LessonsView.tsx"],
  ["sections", "src/features/more/MoreHubFromRegistry.tsx"],
];

for (const [id, rel] of pages) {
  const src = read(rel);
  assert.match(src, /SectionLobby/, `${id}: يستهلك القالب — الرجوع من المصدر الواحد`);
  assert.doesNotMatch(src, /data-section-back/, `${id}: لا زر رجوع يدوي في الصفحة`);
}

console.log("section-back-button.test.ts: ok");
