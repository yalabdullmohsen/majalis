// تدقيق وصول مؤقّت — لا يُستخدَم في بوابة lint الرئيسية (eslint.config.js) ولا
// في pre-commit hook. الهدف: قياس حجم مخالفات jsx-a11y الفعلي عبر الموقع قبل
// اتخاذ أي قرار حول تفعيلها ضمن البوابة الدائمة (قرار أكبر يحتاج فرصًا لإصلاح
// تراكمي، لا تفعيلًا فوريًا قد يُعطِّل كل commit قادم بسبب سقف 50 تحذيرًا).
import baseConfig from "./eslint.config.js";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  ...baseConfig,
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ["src/**/*.{ts,tsx}"],
  },
];
