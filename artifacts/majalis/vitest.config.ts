/// <reference types="vitest/globals" />
import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Fast unit-test runner for Quran Engine (`src/tests/unit`).
 * IndexedDB is provided by `fake-indexeddb` (see setup file).
 */
export default defineConfig({
  test: {
    name: "quran-engine-unit",
    globals: true,
    environment: "node",
    include: ["src/tests/unit/**/*.{test,spec}.ts"],
    setupFiles: ["src/tests/setup/vitest.setup.ts"],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    // Keep CI snappy but serialize files — they share IndexedDB name.
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    sequence: { concurrent: false },
    reporters: ["default"],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
