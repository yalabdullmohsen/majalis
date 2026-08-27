/**
 * PageChrome — مسارات وألوان status bar.
 * node --import tsx src/lib/__tests__/page-chrome.test.ts
 */
import assert from "node:assert/strict";
import {
  PRAYER_STATUS_HEX,
  MUSHAF_PAPER_HEX,
  MUSHAF_NIGHT_HEX,
  resolvePageChrome,
  resolvePageChromeKey,
  resolveMushafThemeChrome,
} from "../page-chrome";

assert.equal(resolvePageChromeKey("/"), "home");
assert.equal(resolvePageChromeKey("/prayer-times"), "prayer");
assert.equal(resolvePageChromeKey("/prayer-times/"), "prayer");
assert.equal(resolvePageChromeKey("/adhan-settings"), "prayer");
assert.equal(resolvePageChromeKey("/quran-hub"), "quran");
assert.equal(resolvePageChromeKey("/mushaf"), "mushaf");
assert.equal(resolvePageChromeKey("/mushaf/2"), "mushaf");
assert.equal(resolvePageChromeKey("/lessons"), "lessons");
assert.equal(resolvePageChromeKey("/fiqh"), "fiqh");
assert.equal(resolvePageChromeKey("/settings"), "settings");
assert.equal(resolvePageChromeKey("/account"), "settings");

const prayer = resolvePageChrome("/prayer-times", "light");
assert.equal(prayer.key, "prayer");
assert.equal(prayer.statusBarColorHex, PRAYER_STATUS_HEX);
assert.equal(prayer.statusBarStyle, "light");

const quran = resolvePageChrome("/quran-hub", "light");
assert.equal(quran.statusBarStyle, "dark");
assert.equal(quran.statusBarColorHex, "#F2F4F3");

const mushaf = resolvePageChrome("/mushaf", "dark");
assert.equal(mushaf.statusBarColorHex, MUSHAF_PAPER_HEX);
assert.equal(mushaf.statusBarStyle, "dark");

const mushafNight = resolveMushafThemeChrome("night");
assert.equal(mushafNight.statusBarColorHex, MUSHAF_NIGHT_HEX);
assert.equal(mushafNight.statusBarStyle, "light");
const mushafPaper = resolveMushafThemeChrome("paper");
assert.equal(mushafPaper.statusBarStyle, "dark");

const homeDark = resolvePageChrome("/", "dark");
assert.equal(homeDark.statusBarStyle, "light");

console.log("page-chrome.test.ts: ok");
