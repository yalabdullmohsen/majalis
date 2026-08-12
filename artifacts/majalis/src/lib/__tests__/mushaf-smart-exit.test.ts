/**
 * بوابة خروج ذكي من المصحف.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-smart-exit.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  captureMushafEntryOrigin,
  consumeMushafEntryOrigin,
  peekMushafEntryOrigin,
  clearMushafEntryOrigin,
} from "../mushaf-entry-origin.ts";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../..");

{
  const store = new Map<string, string>();
  const g = globalThis as typeof globalThis & { sessionStorage?: Storage };
  g.sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => store.clear(),
    key: () => null,
    get length() { return store.size; },
  };
  clearMushafEntryOrigin();
  captureMushafEntryOrigin("/");
  captureMushafEntryOrigin("/search/foo"); // لا يستبدل أول أصل
  assert.equal(peekMushafEntryOrigin(), "/");
  captureMushafEntryOrigin("/mushaf/page/1"); // يُتجاهل
  assert.equal(peekMushafEntryOrigin(), "/");
  assert.equal(consumeMushafEntryOrigin(), "/");
  assert.equal(peekMushafEntryOrigin(), null);
}

{
  const view = readFileSync(join(SRC, "pages/quran/ui/MushafPageView.tsx"), "utf8");
  assert.match(view, /textChromeVisible/);
  assert.match(view, /consumeMushafEntryOrigin/);
  assert.match(view, /handoffMushafPlayback/);
  assert.match(view, /hasMushafUnsavedWork/);
  assert.match(view, /loadReadingAyahKey|resumeAyahKey/);
}

{
  const app = readFileSync(join(SRC, "App.tsx"), "utf8");
  assert.match(app, /QuranMiniPlayerBar/);
}

console.log("mushaf-smart-exit.test.ts: ok");
