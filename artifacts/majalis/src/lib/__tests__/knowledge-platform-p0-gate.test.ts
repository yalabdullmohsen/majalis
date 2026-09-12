/**
 * بوابة سلامة P0 لمنصة المعرفة.
 * node --import tsx src/lib/__tests__/knowledge-platform-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTENT_ENTITY_KINDS,
  SEARCH_KIND_TO_ENTITY,
  VERIFICATION_STATUSES,
  clearActivityHistory,
  isKnowledgePlatformP0Enabled,
  isPubliclyVisible,
  recordActivity,
  resolveContentRef,
  resolveSearchHit,
  setPersonalizationEnabled,
} from "@/lib/knowledge-platform";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "src/lib/knowledge-platform/content-entity.ts")));
assert.ok(existsSync(resolve(root, "src/lib/knowledge-platform/content-resolver.ts")));
assert.ok(existsSync(resolve(root, "docs/KNOWLEDGE_PLATFORM_P0_BASELINE.md")));
assert.ok(isKnowledgePlatformP0Enabled());

assert.ok(CONTENT_ENTITY_KINDS.includes("quran_page"));
assert.ok(CONTENT_ENTITY_KINDS.includes("hadith"));
assert.ok(VERIFICATION_STATUSES.includes("proposed"));
assert.ok(VERIFICATION_STATUSES.includes("published"));
assert.equal(SEARCH_KIND_TO_ENTITY.hadith, "hadith");

const page = resolveContentRef({ kind: "quran_page", id: "50" }, "صفحة 50");
assert.ok(page);
assert.equal(page.href, "/mushaf?page=50");
assert.ok(isPubliclyVisible(page));

const draftLike = { ...page, verificationStatus: "proposed" as const };
assert.equal(isPubliclyVisible(draftLike), false);

const hit = resolveSearchHit({
  id: "n1",
  kind: "hadith",
  title: "حديث",
  href: "/hadith#n1",
});
assert.ok(hit);
assert.equal(hit.href, "/hadith#n1");

const progressUi = read("src/pages/account/ui/ProgressCenterView.tsx");
assert.doesNotMatch(progressUi, /verificationStatus:\s*"proposed"/);

const routes = read("src/AppRoutes.tsx");
assert.match(routes, /path="\/progress"/);
assert.match(routes, /path="\/offline"/);

// التكامل الفعلي: واجهات البحث تستخدم runKnowledgeSearch
const searchView = read("src/pages/account/ui/SearchView.tsx");
assert.match(searchView, /runKnowledgeSearch/);
assert.match(searchView, /isKnowledgePlatformP0Enabled/);
const globalSearch = read("src/components/GlobalSearchModal.tsx");
assert.match(globalSearch, /runKnowledgeSearch/);
const universal = read("src/lib/knowledge-platform/universal-search.ts");
assert.match(universal, /limit\?:/);
assert.match(universal, /href:\s*entity\?\.href/);

const clear = read("src/lib/clear-user-local-data.ts");
assert.match(clear, /majalis-kp-activity-v1/);

setPersonalizationEnabled(true);
clearActivityHistory();
const at = new Date().toISOString();
const ev = recordActivity({
  type: "open",
  entityKind: "quran_page",
  entityId: "2",
  title: "صفحة 2",
  href: "/mushaf?page=2",
  at,
});
assert.ok(ev);
const dup = recordActivity({
  type: "open",
  entityKind: "quran_page",
  entityId: "2",
  title: "صفحة 2",
  href: "/mushaf?page=2",
  at,
});
assert.equal(dup?.id, ev?.id);

const entitySrc = read("src/lib/knowledge-platform/content-entity.ts");
assert.match(entitySrc, /لا يمس/);
assert.doesNotMatch(entitySrc, /generateAyah|completeAyah|inventHadith/);

console.log("knowledge-platform-p0-gate.test.ts: ok");
