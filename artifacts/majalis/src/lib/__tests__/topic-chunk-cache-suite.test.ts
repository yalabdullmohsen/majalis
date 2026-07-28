/**
 * اختبارات — فهرسة المواضيع، التقطيع، التوازن التعبدي، الروابط العميقة، إخلاء التخزين
 * تشغيل: npx tsx src/lib/__tests__/topic-chunk-cache-suite.test.ts
 */

import {
  listTopicCategories,
  queryTopicEvidence,
  resolveIslamicTopic,
  searchTopicsByLabel,
} from "../islamic-topic-index";
import {
  advanceChunk,
  chunkLines,
  chunkText,
  initChunkProgress,
  loadChunkProgress,
  setChunkIndex,
} from "../text-chunking-service";
import {
  generateTimeAwarePrompts,
  getSectionShare,
  loadDevotionalBalance,
  recordSectionTime,
  topTimeAwarePrompt,
} from "../devotional-balance-engine";
import {
  applyDeepLinkTarget,
  buildAdhkarDeepLink,
  buildAyahDeepLink,
  buildMatnDeepLink,
  encodeDeepLink,
  parseDeepLink,
} from "../smart-deep-link";
import {
  isEvictableLocalStorageKey,
  isProtectedIdbKey,
  isProtectedLocalStorageKey,
  PROTECTED_LS_KEYS,
  touchCacheAccess,
} from "../smart-cache-eviction";
import { OFFLINE_STORES } from "../offline-db";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
} as Storage;

console.log("\n=== 1. Islamic topic index ===");
{
  const cats = listTopicCategories();
  assert(cats.length >= 8, "taxonomy has categories");
  assert(Boolean(resolveIslamicTopic("prayer")), "resolve by id");
  assert(Boolean(resolveIslamicTopic("الصلاة")), "resolve by Arabic label");
  const travel = queryTopicEvidence("travel");
  assert(Boolean(travel), "travel evidence query");
  assert((travel?.adhkar.length ?? 0) > 0, "travel has adhkar evidence");
  const prayer = queryTopicEvidence("prayer");
  assert((prayer?.all.length ?? 0) > 0, "prayer has cross-category evidence");
  assert(searchTopicsByLabel("طهارة").some((t) => t.id === "purification"), "search by label");
}

console.log("\n=== 2. Text chunking ===");
{
  const long =
    "الحمد لله رب العالمين. الرحمن الرحيم. مالك يوم الدين. إياك نعبد وإياك نستعين. ".repeat(12);
  const chunks = chunkText(long, { targetChars: 200 });
  assert(chunks.length >= 2, "splits long text into multiple chunks");
  assert(chunks.every((c) => c.wordCount > 0), "chunks have word counts");
  assert(chunkLines(["آية ١", "آية ٢", "آية ٣"], { targetChars: 20 }).length >= 1, "chunkLines works");

  const progress = initChunkProgress("matn-demo", chunks.length);
  assert(progress.currentChunk === 0, "init at chunk 0");
  const advanced = advanceChunk("matn-demo", { dwellMs: 30_000, wordsRead: 40 });
  assert(Boolean(advanced), "advance returns state");
  assert((advanced?.currentChunk ?? 0) === 1 || chunks.length === 1, "advanced to next chunk");
  assert((advanced?.velocityWpm ?? 0) > 0, "velocity recorded");
  setChunkIndex("matn-demo", 0);
  assert(loadChunkProgress("matn-demo")?.currentChunk === 0, "setChunkIndex works");
}

console.log("\n=== 3. Devotional balance ===");
{
  mem.clear();
  const s1 = recordSectionTime("quran", 10 * 60_000);
  const s2 = recordSectionTime("adhkar", 2 * 60_000);
  assert(s2.buckets.quran.activeMs >= 10 * 60_000, "quran time accumulated");
  assert(s2.buckets.adhkar.activeMs >= 2 * 60_000, "adhkar time accumulated");
  const share = getSectionShare(s2);
  assert(share.quran > share.adhkar, "quran share dominates");
  assert(loadDevotionalBalance().dateKey.length === 10, "date key present");

  const friday = new Date("2026-07-24T10:00:00"); // Friday
  const prompts = generateTimeAwarePrompts({ now: friday, state: s1 });
  assert(prompts.some((p) => p.kind === "friday_kahf"), "Friday Kahf prompt");
  const morning = generateTimeAwarePrompts({
    now: new Date("2026-07-27T05:00:00"),
    state: s1,
  });
  assert(morning.some((p) => p.kind === "morning_adhkar"), "morning adhkar prompt");
  const top = topTimeAwarePrompt({ now: friday, state: s1 });
  assert(top.priority >= 10, "top prompt has priority");
}

console.log("\n=== 4. Smart deep links ===");
{
  assert(buildAyahDeepLink(2, 255) === "/mushaf/2?ayah=255", "ayah query link");
  assert(buildAyahDeepLink(18, 1, { useHash: true }) === "/mushaf/18#ayah-1", "ayah hash link");
  assert(buildMatnDeepLink("/fiqh/tahara", 3).includes("line=3"), "matn line query");
  assert(buildMatnDeepLink("/fiqh/tahara", 3).includes("#matn-line-3"), "matn line hash");
  assert(buildAdhkarDeepLink("morning", "x1").includes("cat=morning"), "adhkar cat");

  const parsed = parseDeepLink("/mushaf/2?ayah=255");
  assert(parsed?.kind === "ayah" && parsed.anchor === 255, "parse ayah query");
  const hashed = parseDeepLink("/mushaf/18#ayah-9");
  assert(hashed?.kind === "ayah" && hashed.anchor === 9, "parse ayah hash");
  const matn = parseDeepLink("/articles/foo?line=4#matn-line-4");
  assert(matn?.kind === "matn" && matn.anchor === 4, "parse matn");
  assert(encodeDeepLink({ kind: "ayah", resourceId: "1", anchor: 1 }) === "/mushaf/1?ayah=1", "encode");

  // apply without DOM should fail gracefully
  const applied = applyDeepLinkTarget({
    kind: "ayah",
    resourceId: "2",
    anchor: 255,
    path: "/mushaf/2",
    search: "?ayah=255",
    hash: "#ayah-255",
  });
  assert(applied.ok === false || typeof document === "undefined", "apply without matching DOM is safe");
}

console.log("\n=== 5. Cache eviction guards ===");
{
  assert(isProtectedLocalStorageKey("majalis-user-streak-v1"), "streak protected");
  assert(isProtectedLocalStorageKey("mj-quran-notes-v1"), "notes protected");
  assert(isProtectedLocalStorageKey("mj-quran-bookmarks-v1"), "bookmarks protected");
  assert(isProtectedLocalStorageKey("majalis-khatmah-tracker-v1"), "khatmah protected");
  assert(isProtectedLocalStorageKey("majalis-flashcard-reviews-v1"), "SM-2 flashcards protected");
  assert(isProtectedLocalStorageKey("majalis-knowledge-vault-index-v1"), "vault protected");
  assert(PROTECTED_LS_KEYS.has("majalis-chunk-progress-v1"), "chunk progress in protected set");
  assert(!isEvictableLocalStorageKey("majalis-user-streak-v1"), "streak not evictable");
  assert(isEvictableLocalStorageKey("mj-quran-v3-tmp-cache"), "ephemeral quran TTL evictable");
  assert(isEvictableLocalStorageKey("majalis-error-reports-v2"), "error reports evictable");
  assert(isProtectedIdbKey(OFFLINE_STORES.flashcards, "any"), "flashcards store protected");
  assert(isProtectedIdbKey(OFFLINE_STORES.meta, "chunk-progress-v1"), "chunk idb meta protected");
  touchCacheAccess("ls:mj-quran-v3-tmp");
  assert(Boolean(localStorage.getItem("majalis-cache-lru-v1")), "LRU map written");
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
