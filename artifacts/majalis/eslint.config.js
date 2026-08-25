import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";

const nodeFiles = ["lib/**/*.{js,mjs}", "scripts/**/*.{js,mjs}", "server/**/*.{js,mjs}", "api/**/*.js"];

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
      ],
    },
  },
);