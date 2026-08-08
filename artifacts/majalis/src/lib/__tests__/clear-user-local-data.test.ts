/**
 * Run: npx tsx src/lib/__tests__/clear-user-local-data.test.ts
 */
import { clearUserLocalData } from "../clear-user-local-data";

let passed = 0;
let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function main() {
  console.log("═══ clearUserLocalData ═══");
  const store = new Map<string, string>();
  const fake = {
    get length() {
      return store.size;
    },
    key(i: number) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
  };
  (globalThis as { localStorage: typeof fake }).localStorage = fake;

  store.set("majalis-user-settings-v1", "1");
  store.set("majalis-mushaf-tafsir-edition-v1", "x");
  store.set("mj-quran-notes-v1", "[]");
  store.set("majalis-cookie-consent-v1", "keep");
  store.set("unrelated-app-key", "keep");

  const { removed } = clearUserLocalData();
  check(removed >= 3, "removes majalis/mj keys");
  check(!store.has("majalis-user-settings-v1"), "settings cleared");
  check(store.has("majalis-cookie-consent-v1"), "cookie consent kept");
  check(store.has("unrelated-app-key"), "unrelated kept");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
