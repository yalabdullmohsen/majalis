#!/usr/bin/env node
/**
 * يُثبت أن بوابة verify-no-mock-asr-in-app.mjs **تكتشف فعليًا** استيرادًا
 * مخالفًا — لا فقط أنها لا تُبلّغ عن شيء في الحالة الحالية النظيفة
 * (اجتياز صامت ليس دليل نجاح الأداة نفسها).
 * تشغيل: node scripts/__tests__/verify-no-mock-asr-in-app.test.mjs
 */
import { isViolatingImport } from "../verify-no-mock-asr-in-app.mjs";

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

console.log("═══ isViolatingImport ═══");
{
  assert(
    isViolatingImport("src/views/RecitationTestPage.tsx", 'import { MockQuranASRProvider } from "@/lib/recitation-ai/providers/mock-provider";'),
    "استيراد المزوّد الوهمي داخل ملف واجهة حقيقي ← مخالفة مكتشَفة",
  );
  assert(
    isViolatingImport("src/lib/recitation-ai/provider-registry.ts", 'import { MockQuranASRProvider } from "./providers/mock-provider";'),
    "نفس الاستيراد بمسار نسبي مختلف ← لا يزال يُكتشَف",
  );
  assert(
    !isViolatingImport(
      "src/lib/recitation-ai/__tests__/asr-providers.test.ts",
      'import { MockQuranASRProvider } from "../providers/mock-provider";',
    ),
    "نفس الاستيراد داخل __tests__ ← مسموح، لا مخالفة",
  );
  assert(
    !isViolatingImport(
      "src/lib/recitation-ai/providers/mock-provider.ts",
      "export class MockQuranASRProvider {}",
    ),
    "الملف المُعرِّف نفسه (بلا import) ← لا مخالفة",
  );
  assert(
    !isViolatingImport(
      "src/lib/recitation-ai/asr-provider.ts",
      "// mock-provider.ts: للاختبارات الآلية فقط، لا يظهر للمستخدم أبدًا.",
    ),
    "ذِكر نصّي في تعليق بلا import فعلي ← لا مخالفة (تفادي إنذار كاذب)",
  );
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
