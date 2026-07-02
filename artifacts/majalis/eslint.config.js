import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

const nodeFiles = ["lib/**/*.{js,mjs}", "scripts/**/*.{js,mjs}", "server/**/*.{js,mjs}", "api/**/*.js"];

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "seo-prerender/**", "node_modules/**", ".next/**", "src/lib/*.generated.ts"],
  },
  {
    files: nodeFiles,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
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
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-useless-assignment": "warn",
    },
  },
);
