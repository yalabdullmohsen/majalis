/**
 * بوابة كمون التلاوة الفورية + منع تسريب مفاتيح API للعميل.
 * تشغيل: node --import tsx src/lib/recitation-ai/__tests__/tarteel-latency-gate.test.ts
 * أو: pnpm run test:tarteel-latency
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AI_TARTEEL_FEATURE_DEFAULT,
  AI_TARTEEL_DISABLED_MESSAGE,
  isAiTarteelEnabled,
} from "../feature-flag";
import {
  TARTEEL_LATENCY_MARKS,
  TARTEEL_LATENCY_TARGETS,
  markTarteelLatency,
  summarizeTarteelLatency,
  resetTarteelLatency,
} from "../tarteel-latency";
import { getRecitationWsUrl } from "../streaming-audio";

const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

assert.equal(AI_TARTEEL_FEATURE_DEFAULT, true, "علم التلاوة يجب أن يكون مفعّلًا افتراضيًا");
assert.equal(isAiTarteelEnabled(), true, "بلا قتل سريع — الميزة مفعّلة");
assert.ok(AI_TARTEEL_DISABLED_MESSAGE.includes("التلاوة"));
assert.ok(TARTEEL_LATENCY_MARKS.includes("page_open"));
assert.ok(TARTEEL_LATENCY_MARKS.includes("ws_warm_ready"));
assert.ok(TARTEEL_LATENCY_MARKS.includes("first_partial"));
assert.ok(TARTEEL_LATENCY_MARKS.includes("first_match"));
assert.ok(TARTEEL_LATENCY_TARGETS.buttonToFirstPartialMs <= 800);

resetTarteelLatency();
markTarteelLatency("page_open");
markTarteelLatency("ws_warm_ready", { ms: 120 });
markTarteelLatency("session_button");
markTarteelLatency("first_partial");
markTarteelLatency("first_match");
const summary = summarizeTarteelLatency();
assert.ok(summary.pageToWsReadyMs !== null || summary.buttonToFirstPartialMs !== null);

assert.equal(getRecitationWsUrl(), null, "بلا VITE_RECITATION_WS_URL في بوابة الاختبار");

const requiredFiles = [
  "lib/recitation-ai/feature-flag.ts",
  "lib/recitation-ai/tarteel-latency.ts",
  "lib/recitation-ai/warm-connection.ts",
  "lib/recitation-ai/providers/websocket-provider.ts",
  "lib/recitation-ai/providers/web-speech-provider.ts",
  "pages/quran/ui/RecitationTestView.tsx",
];
for (const rel of requiredFiles) {
  assert.ok(existsSync(resolve(srcRoot, rel)), `مفقود: ${rel}`);
}

const warmSrc = readFileSync(resolve(srcRoot, "lib/recitation-ai/warm-connection.ts"), "utf8");
assert.match(warmSrc, /warmRecitationWsConnection/);
assert.match(warmSrc, /takeWarmedRecitationWs/);

const wsSrc = readFileSync(resolve(srcRoot, "lib/recitation-ai/providers/websocket-provider.ts"), "utf8");
assert.match(wsSrc, /takeWarmedRecitationWs/);
assert.match(wsSrc, /first_partial/);

const viewSrc = readFileSync(resolve(srcRoot, "pages/quran/ui/RecitationTestView.tsx"), "utf8");
assert.match(viewSrc, /warmRecitationWsConnection/);
assert.match(viewSrc, /markTarteelLatency\("page_open"\)/);
assert.match(viewSrc, /isAiTarteelEnabled/);
assert.match(viewSrc, /pausePlaybackForTasmee/);
assert.match(viewSrc, /stopAuxiliaryAudioForTasmee/);
assert.match(viewSrc, /ابدأ التلاوة/);

const webSrc = readFileSync(resolve(srcRoot, "lib/recitation-ai/providers/web-speech-provider.ts"), "utf8");
assert.match(webSrc, /INTERIM_CONFIDENCE/);
assert.match(webSrc, /emittedInterimNorms/);

/** مسح ثابت لمصدر العميل — لا قيم مفاتيح sk-/OPENAI في الحزمة الأمامية */
const FORBIDDEN = [
  /OPENAI_API_KEY\s*=\s*['"`][^'"`]+['"`]/,
  /\bsk-[a-zA-Z0-9]{20,}\b/,
  /\bgsk_[a-zA-Z0-9]{20,}\b/,
];
const SKIP_DIR = new Set(["node_modules", "dist", "__tests__", "coverage"]);

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTs(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const hits: string[] = [];
for (const file of walkTs(srcRoot)) {
  if (file.includes("tarteel-latency-gate.test")) continue;
  const text = readFileSync(file, "utf8");
  for (const re of FORBIDDEN) {
    if (re.test(text)) hits.push(`${file}: ${re}`);
  }
}
assert.equal(hits.length, 0, `أنماط مفاتيح محظورة في مصدر العميل:\n${hits.join("\n")}`);

console.log("tarteel-latency-gate.test.ts: ok");
