/**
 * بوابة P0 — سرد سُنّة العصبي + حماية النصوص + رجوع عام + داكن الأنبياء.
 * node --import tsx src/lib/__tests__/sunnah-ai-narration-back-dark-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ARABIC_PRONUNCIATION_LEXICON,
  applyPronunciationLexicon,
  assertSegmentsPreserveText,
  buildArabicSsml,
  lexiconWordCount,
  prepareNarrationForPlayback,
  segmentEditorialText,
  SSML_VERSION,
  PRONUNCIATION_LEXICON_VERSION,
} from "@/lib/ai-narration";
import { partitionProtectedText } from "@/lib/audio-reader/protected-text";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== Lexicon + SSML versions ===");
assert.ok(lexiconWordCount() >= 30, "قاموس النطق ≥ 30");
assert.equal(PRONUNCIATION_LEXICON_VERSION, "lexicon-v1");
assert.equal(SSML_VERSION, "ssml-v1");
assert.ok(ARABIC_PRONUNCIATION_LEXICON.every((e) => e.locale === "ar-SA"));

console.log("=== Pronunciation layer stays non-empty ===");
{
  const display = "نوح عليه السلام في قصة الطوفان";
  const spoken = applyPronunciationLexicon(display);
  assert.ok(spoken.length > 0);
  assert.ok(!spoken.includes("http"));
}

console.log("=== Protected Quran never enters speakable TTS path ===");
{
  const body =
    "مقدمة تحريرية عن نوح.\n\n﴿إِنَّا أَرْسَلْنَا نُوحًا إِلَىٰ قَوْمِهِ﴾\n\nخاتمة تحريرية موثّقة.";
  const prepared = prepareNarrationForPlayback({
    contentId: "prophet:nuh",
    title: "نوح عليه السلام",
    body,
  });
  assert.ok(prepared.protectedSkipped >= 1, "آية مُعلَّمة كمحمية");
  assert.ok(!prepared.speakableText.includes("﴿"), "لا أقواس قرآن في النص المنطوق");
  assert.ok(
    !prepared.speakableText.includes("إِنَّا أَرْسَلْنَا"),
    "لا نص الآية في Neural/Device TTS",
  );
  assert.ok(
    prepared.speakableText.includes("مقدمة") || prepared.speakableText.includes("خاتمة"),
  );
  const parts = partitionProtectedText(body);
  assert.ok(parts.some((p) => p.type === "protected"));
  assert.ok(parts.some((p) => p.type === "speakable"));
}

console.log("=== Segmentation preserves tokens ===");
{
  const src = "عنوان القصة. فقرة أولى عن الدعوة. فقرة ثانية عن الصبر.";
  const segs = segmentEditorialText(src);
  const check = assertSegmentsPreserveText(src, segs);
  assert.equal(check.ok, true, check.ok ? "" : check.reason);
  const ssml = buildArabicSsml({
    segments: segs,
    locale: "ar-SA",
    voiceName: "ar-SA-ZariyahNeural",
    rate: 1,
  });
  assert.match(ssml, /<speak[\s\S]*<\/speak>/);
  // xmlns المعياري مسموح؛ يُمنع رابط محتوى داخل النص المنطوق فقط
  assert.doesNotMatch(ssml.replace(/xmlns="[^"]+"/g, ""), /https?:\/\/(?!www\.w3\.org)/);
}

console.log("=== No API keys in client narration sources ===");
{
  const dir = resolve(root, "src/lib/ai-narration");
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    const src = read(`src/lib/ai-narration/${name}`);
    assert.doesNotMatch(src, /AZURE_SPEECH_KEY\s*=\s*['"][^'"]+['"]/);
    assert.doesNotMatch(src, /sk-[a-zA-Z0-9]{20,}/);
  }
}

console.log("=== Server neural handler exists; keys server-only ===");
{
  const handler = read("lib/api-handlers/narration-tts.js");
  assert.match(handler, /AZURE_SPEECH_KEY|AZURE_TTS_KEY/);
  assert.match(handler, /protected|﴿/);
  assert.match(handler, /fallbackToDevice/);
  const dispatch = read("lib/api-dispatch.mjs");
  assert.match(dispatch, /\/api\/narration\/tts/);
}

console.log("=== Prophets page uses AI orchestrator + honest labels ===");
{
  const page = read("src/views/ProphetStoriesPage.tsx");
  assert.match(page, /playAiNarration/);
  assert.match(page, /from \"@\/lib\/ai-narration\"/);
  assert.match(page, /صوت الجهاز|device-speech/);
  assert.match(page, /سرد عصبي|azure-neural/);
  assert.doesNotMatch(page, /قارئ بالذكاء الاصطناعي/);
}

console.log("=== GlobalBackControlHost is single source ===");
{
  const fab = read("src/components/FloatingBackButton.tsx");
  assert.match(fab, /GlobalBackControlHost/);
  assert.match(fab, /FLOATING_BACK_DISABLED/);
  assert.match(fab, /FIXED_BACK_BAR_ENABLED/);
  assert.match(fab, /data-global-back-control-host="1"/);
  assert.match(fab, /variant="bar"/);
  const app = `${read("src/App.tsx")}\n${read("src/AppRoutes.tsx")}`;
  assert.match(app, /FloatingBackButton|GlobalBackButton/);
}

console.log("=== Dark prophets: no light mint surfaces / glow ===");
{
  const css = read("src/styles/pages/prophet-stories.css");
  assert.match(css, /SUNNAH_DARK_PROPHETS_P0/);
  assert.match(css, /background-image:\s*none/);
  const darkCard =
    css.includes("html.dark .prophet-lux-card") ||
    css.includes('html[data-theme="dark"] .prophet-lux-card');
  assert.ok(darkCard, "dark prophet card override");
  assert.match(
    css,
    /prophet-lux-card__glow[\s\S]{0,240}(?:display:\s*none|opacity:\s*0)/,
  );
}

console.log("sunnah-ai-narration-back-dark-p0-gate: ok");
