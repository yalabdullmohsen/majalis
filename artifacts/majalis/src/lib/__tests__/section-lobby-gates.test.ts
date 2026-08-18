/**
 * بوابات لوبي الأقسام الموحّد.
 * تشغيل: node --import tsx src/lib/__tests__/section-lobby-gates.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getLobby, LOBBY_IDS, isTabRootPath } from "@/config/section-lobbies";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const PAGES = [
  ["quran", "src/pages/quran/ui/QuranHubView.tsx"],
  ["lessons", "src/pages/lessons/ui/LessonsView.tsx"],
  ["fiqh", "src/pages/fiqh/ui/FiqhView.tsx"],
  ["sections", "src/pages/account/SectionsPage.tsx"],
] as const;

console.log("=== SectionLobby على جذور التبويبات ===");
for (const [id, rel] of PAGES) {
  const src = read(rel);
  if (id === "sections") {
    assert.match(src, /MoreHubFromRegistry/, `${id}: من السجل`);
  } else {
    assert.match(src, /SectionLobby/, `${id}: يستعمل SectionLobby`);
  }
  assert.doesNotMatch(src, /<PageHero/, `${id}: بلا PageHero`);
  assert.doesNotMatch(src, /showBack\s*=\s*true/, `${id}: بلا زر رجوع`);
  assert.doesNotMatch(src, /type=["']search["']/, `${id}: بلا حقل بحث محلي`);
  assert.doesNotMatch(src, /ابحث في الأقسام/, `${id}: بلا بحث أقسام مكرر`);
}

const more = read("src/features/more/MoreHubFromRegistry.tsx");
assert.match(more, /SectionLobby/);
assert.match(more, /getLobby\("sections"\)/);
assert.doesNotMatch(more, /sections-hub__search/);

const merged = read("src/views/MergedSectionHubPage.tsx");
assert.match(merged, /SectionLobby/);
assert.match(merged, /lobbyId="hub"/);
assert.doesNotMatch(merged, /<PageHero/);
assert.doesNotMatch(merged, /lobbyId="sections"/);

const back = read("src/components/GlobalBackButton.tsx");
assert.match(back, /isTabRootPath/);
assert.match(back, /section-lobby-chrome/);

const css = read("src/components/lobby/section-lobby.css");
assert.match(css, /font-size:\s*24px/);
assert.match(css, /font-size:\s*17px/);
assert.match(css, /font-size:\s*15px/);
assert.match(css, /font-size:\s*13px/);
assert.match(css, /gap:\s*8px/);
assert.match(css, /gap:\s*12px/);
assert.match(css, /gap:\s*16px|padding-top:\s*16px/);
assert.match(css, /gap:\s*24px/);
assert.match(css, /white-space:\s*nowrap/);
assert.match(css, /overflow-x:\s*auto/);
assert.match(css, /scroll-snap-type:\s*x/);
assert.match(css, /grid-auto-rows:\s*1fr/);
assert.match(css, /section-lobby__grid--solo/);
assert.match(css, /assistant-fab-size/);
assert.match(css, /section-lobby__shot/);
assert.doesNotMatch(css, /env\(safe-area-inset/);

const lobbyCmp = read("src/components/lobby/SectionLobby.tsx");
assert.match(lobbyCmp, /FeaturedSectionCard|HeroActionCard/);
assert.match(lobbyCmp, /SectionCard/);
assert.match(lobbyCmp, /chip-label/);
assert.match(lobbyCmp, /data-lobby-shot/);
assert.doesNotMatch(lobbyCmp, /page-hero-mj/);
assert.match(lobbyCmp, /data-section-back/);
assert.match(lobbyCmp, /رجوع/);
assert.match(lobbyCmp, /goBackOrFallback/);

console.log("=== محتوى السجل ===");
const quran = getLobby("quran");
assert.equal(quran.primary?.id, "open-mushaf");
assert.equal(quran.groups.length, 4);
assert.ok(quran.groups.every((g) => g.items.length >= 1));
assert.equal(quran.groups.find((g) => g.id === "numbers")?.items.length, 1);

const lessons = getLobby("lessons");
assert.ok(lessons.primary);
assert.deepEqual(lessons.chips?.map((c) => c.id), ["all", "men", "women", "courses"]);
assert.equal(lessons.groups.length, 3);
assert.ok(lessons.groups.every((g) => g.items.length === 1));

const prayer = getLobby("prayer");
assert.ok(prayer.primary);
assert.equal(prayer.groups.length, 4);

const fiqh = getLobby("fiqh");
assert.equal(fiqh.primary, undefined);
assert.ok((fiqh.chips?.length ?? 0) === 5);
assert.ok(fiqh.groups.some((g) => g.id === "ibadat" && g.items.length > 0));
assert.ok(fiqh.groups.some((g) => g.id === "supporting"));

const sections = getLobby("sections");
assert.equal(sections.primary, undefined);
assert.equal(sections.groups.length, 7);

assert.equal(LOBBY_IDS.length, 5);
assert.equal(isTabRootPath("/fiqh"), true);
assert.equal(isTabRootPath("/quran-hub"), true);
assert.equal(isTabRootPath("/mushaf"), false);

const greenCount = (spec: ReturnType<typeof getLobby>) => (spec.primary ? 1 : 0);
for (const id of LOBBY_IDS) {
  assert.ok(greenCount(getLobby(id)) <= 1, `${id}: بطاقة خضراء واحدة كحد أقصى`);
}

console.log("section-lobby-gates.test.ts: ok");
