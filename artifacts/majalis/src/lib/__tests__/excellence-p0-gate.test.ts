/**
 * بوابة P0 — Excellence: تكامل الحديث/الملاحظات/المساعد/صحة الصلاة.
 * node --import tsx src/lib/__tests__/excellence-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hrefHadith } from "@/lib/content-href";
import { isAssistantFeatureEnabled } from "@/lib/assistant-feature-flag";
import {
  __resetSyncLocalStoreForTests,
  bootstrapSyncEngine,
  enqueueSyncRecord,
} from "@/lib/sync-engine";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.equal(hrefHadith("bukhari:1"), "/hadith/bukhari:1");
assert.equal(hrefHadith("n1"), "/hadith#n1");
assert.equal(hrefHadith(null), "/hadith");

assert.equal(isAssistantFeatureEnabled(), false);

const personal = read("src/lib/quran-personal.ts");
assert.match(personal, /enqueueSyncRecord/);
assert.match(personal, /kind:\s*"note"/);
assert.match(personal, /kind:\s*"bookmark"/);

const engine = read("src/lib/sync-engine/engine.ts");
assert.match(engine, /kind === "note"/);

const gate = read("src/pages/assistant/AssistantGate.tsx");
assert.match(gate, /isAssistantFeatureEnabled/);
assert.doesNotMatch(gate, /asp-hero__eyebrow/);

const adhan = read("src/pages/worship/ui/AdhanSettingsView.tsx");
assert.match(adhan, /PrayerScheduleHealthCard/);
assert.match(adhan, /classifyPrayerScheduleHealth/);

const routes = read("src/AppRoutes.tsx");
assert.match(routes, /AssistantGate/);
assert.match(routes, /mushaf\/page\/:page[\s\S]*Redirect to=\{`\/mushaf\?page=/);

const hybrid = read("src/lib/hybrid-sync-handlers.ts");
assert.match(hybrid, /user_notes/);
assert.match(hybrid, /preference_patch/);

const search = read("src/pages/account/ui/SearchView.tsx");
assert.match(search, /requestSeqRef/);

const surah = read("src/pages/quran/ui/SurahIndexView.tsx");
assert.match(surah, /منهج سُنّة/);
assert.doesNotMatch(surah, /منهج مجالس/);

const app = read("src/App.tsx");
assert.match(app, /assistant-feature-flag/);

const registry = read("src/lib/feature-registry.ts");
assert.match(registry, /id:\s*"assistant"[\s\S]*?status:\s*"coming-soon"/);

__resetSyncLocalStoreForTests();
bootstrapSyncEngine(null);
const note = enqueueSyncRecord({
  kind: "note",
  entityId: "quran:2:255",
  payload: { text: "اختبار" },
});
assert.equal(note.kind, "note");
assert.equal(note.entityId, "quran:2:255");

console.log("excellence-p0-gate.test.ts: ok");
