/**
 * Unit check — RN storageService façade (localStorage mock).
 * Run: npx tsx src/tests/quran-storage-service.test.ts
 */
import { LAST_PAGE_KEY } from "../lib/quran-last-page";
import { MY_BOOKMARKS_KEY, type MyBookmark } from "../lib/quran-my-bookmarks";
import { storageService } from "../lib/quran-storage-service";

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

const mem = new Map<string, string>();

function installLocalStorageMock() {
  const store: Storage = {
    get length() {
      return mem.size;
    },
    clear() {
      mem.clear();
    },
    getItem(key: string) {
      return mem.has(key) ? mem.get(key)! : null;
    },
    setItem(key: string, value: string) {
      mem.set(key, String(value));
    },
    removeItem(key: string) {
      mem.delete(key);
    },
    key() {
      return null;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: store,
    configurable: true,
  });
}

async function main() {
  console.log("═══ storageService (RN AsyncStorage sketch) ═══");
  installLocalStorageMock();
  mem.clear();

  check(typeof storageService.saveLastPage === "function", "saveLastPage");
  check(typeof storageService.getLastPage === "function", "getLastPage");
  check(typeof storageService.saveBookmarks === "function", "saveBookmarks");
  check(typeof storageService.getBookmarks === "function", "getBookmarks");

  await storageService.saveLastPage(42);
  check(mem.get(LAST_PAGE_KEY) === "42", "lastPage key written");
  const raw = await storageService.getLastPage();
  check(raw === "42", "getLastPage string");
  check((await storageService.getLastPageNumber()) === 42, "getLastPageNumber");

  const empty = await storageService.getBookmarks();
  check(Array.isArray(empty) && empty.length === 0, "empty bookmarks");

  const bookmarks: MyBookmark[] = [
    { id: 1, page: 10, label: "فاصل أ", date: "١/١/٢٠٢٦" },
    { id: 2, page: 20, label: "فاصل ب", date: "٢/١/٢٠٢٦" },
  ];
  await storageService.saveBookmarks(bookmarks);
  check(mem.has(MY_BOOKMARKS_KEY), "myBookmarks key written");
  const loaded = await storageService.getBookmarks();
  check(loaded.length === 2 && loaded.some((b) => b.page === 10), "getBookmarks");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
