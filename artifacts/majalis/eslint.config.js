import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const nodeFiles = ["lib/**/*.{js,mjs}", "scripts/**/*.{js,mjs}", "server/**/*.{js,mjs}", "api/**/*.js"];

/** ملفات شاشات لم تُهاجَر بعد — تُقلَّص مع دفعات Typography 2–7 */
const dsLegacyAllowlist = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "eslint-ds-legacy-allowlist.json"), "utf8"),
);

/** قواعد تثبيت نظام التصميم — قيم مباشرة ممنوعة */
const designSystemLockRules = [
  {
    selector:
      "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name='fontSize'] > Literal[value=/px|rem|em|%/i]",
    message:
      "سُنّة DS: لا fontSize حرفي في style — استخدم مكوّنات SsText / --ss-type-* / أصناف .ss-text",
  },
  {
    selector:
      "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name='fontSize'] > TemplateLiteral",
    message:
      "سُنّة DS: لا fontSize ديناميكي حرفي في style — استخدم --ss-type-* / أصناف .ss-text أو مقياس عبر CSS var",
  },
  {
    selector:
      "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name=/^(color|background|backgroundColor|borderColor)$/] > Literal[value=/^#|^rgb|^hsl/i]",
    message:
      "سُنّة DS: لا لون حرفي في style — استخدم --ss-color-* / --mj-* / tone على SsText",
  },
  {
    selector: "JSXAttribute[name.name='className'] Literal[value=/text-\\[[0-9]/]",
    message: "سُنّة DS: لا text-[Npx|rem] — استخدم أدوار Typography (--ss-type-*)",
  },
  {
    selector:
      "JSXAttribute[name.name='className'] Literal[value=/(^|[\\s:])(text-black|text-white|bg-white|bg-black)(\\s|$)/]",
    message:
      "سُنّة DS: لا text-black/white أو bg-white/black (بما فيها dark:) — استخدم رموز السطح والنص",
  },
];

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "seo-prerender/**", "node_modules/**", ".next/**", "src/lib/*.generated.ts", "next-env.d.ts"],
  },
  {
    // Service worker — has its own global scope (self, caches, clients, …)
    files: ["public/sw.js", "**/sw.js", "**/service-worker.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        // بعض السكربتات تشغّل كود المتصفح عبر Playwright (page.evaluate)
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-useless-assignment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-useless-assignment": "warn",
    },
  },
  {
    files: ["src/**/*.{tsx,jsx}"],
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: [
      "src/components/layout/**/*.{ts,tsx}",
      "src/components/ui/sheet.tsx",
      "src/components/ui/drawer.tsx",
      "src/components/ui/dialog.tsx",
      "src/components/ui/alert-dialog.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/bg-white|bg-background|#fff|#ffffff/i]",
          message: "استخدم رموز @theme (--mj-surface / --mj-bg) لا bg-white أو bg-background",
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/**/__tests__/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
      "src/tests/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='console'][callee.property.name=/^(log|debug)$/]",
          message: "أزل console.log/debug من كود الإنتاج — استخدم warn/error أو structured-logger",
        },
      ],
    },
  },
  {
    files: ["src/lib/structured-logger.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["src/components/topic/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/text-(black|gray|slate|zinc)-/]",
          message: "داخل TopicPage/.on-dark: لا تستخدم text-black أو text-gray-* أو text-slate-* — استخدم رموز --on-dark",
        },
        ...designSystemLockRules,
      ],
    },
  },
  /* تثبيت DS على القوالب المشتركة المهاجَرة (دفعة 1) */
  {
    files: [
      "src/components/ui/PageHero.tsx",
      "src/components/ui/HubCard.tsx",
      "src/components/ui/CompactSectionHeader.tsx",
      "src/components/SectionAccordionLayout.tsx",
      "src/components/topic/SectionHero.tsx",
      "src/components/design-system/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...designSystemLockRules,
        {
          selector: "JSXOpeningElement[name.name=/^h[1-3]$/]",
          message:
            "سُنّة DS: عناوين h1–h3 عبر ScreenTitle / SectionTitle / CardTitle (أو SsText) لا وسم خام",
        },
      ],
    },
  },
  /*
   * شاشات المنتج: قيود القيم المباشرة (fontSize/لون/text-[]).
   * عناوين h1–h6 تُرصد ببوابة التغطية (لا error شامل حتى تكتمل دفعات الهجرة).
   * المصحف مستثنى — أحجام ديناميكية موثّقة لمحرّك القراءة.
   */
  {
    files: ["src/pages/**/*.{ts,tsx}", "src/views/**/*.{ts,tsx}"],
    ignores: [
      "src/**/__tests__/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/pages/quran/**/Mushaf*.tsx",
      "src/pages/quran/**/*Mushaf*",
      "src/pages/quran/**/ImmersiveQuran*.tsx",
      "src/views/**/Mushaf*.tsx",
      ...dsLegacyAllowlist,
    ],
    rules: {
      "no-restricted-syntax": ["error", ...designSystemLockRules],
    },
  },
);
