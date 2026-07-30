/**
 * بوابات التسميع: لا نتائج فارغة صامتة + رسائل خطأ واضحة.
 * تشغيل: npx tsx src/lib/__tests__/recitation-empty-speech.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ASRProviderUnavailableError } from "../recitation-ai/asr-provider";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const hookSrc = readFileSync(resolve(appRoot, "src/hooks/useRecitationTest.ts"), "utf8");
assert.match(hookSrc, /setState\("error"\)/);
assert.ok(
  hookSrc.includes('if (!text.trim())') || hookSrc.includes("!text.trim()"),
  "useRecitationTest يرفض النتائج الفارغة",
);
assert.ok(
  !hookSrc.includes('perm.speechRecognition === "prompt"'),
  "لا نعامل prompt كرفض صامت بعد الإصلاح",
);
assert.match(hookSrc, /denied.*restricted|restricted.*denied/);

const onDeviceSrc = readFileSync(
  resolve(appRoot, "src/lib/recitation-ai/providers/on-device-provider.ts"),
  "utf8",
);
assert.match(onDeviceSrc, /code:\s*"NO_SPEECH"/);
assert.match(onDeviceSrc, /لم يُكتشف كلام/);

const err = new ASRProviderUnavailableError({
  code: "NO_SPEECH",
  message: "لم يُكتشف كلام واضح.",
});
assert.equal(err.detail.code, "NO_SPEECH");
assert.ok(err.message.includes("كلام"));

const memSrc = readFileSync(resolve(appRoot, "src/views/QuranMemorizationPage.tsx"), "utf8");
assert.match(memSrc, /getSpeechRecognitionPlugin/);
assert.match(memSrc, /voiceError/);
assert.match(memSrc, /لم يُكتشف كلام/);

console.log("recitation-empty-speech.test.ts: ok");
