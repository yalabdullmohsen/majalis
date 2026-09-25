/**
 * بوابة تنفيذ إعادة بناء قصص الأنبياء — مكوّنات حيّة + بلا كحلي + قراءة مركّزة.
 * تشغيل: node --import tsx src/lib/__tests__/prophets-stories-rebuild-impl-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isImmersiveChromePath,
  isPinnedChromePath,
  isProphetsReadingPath,
} from "@/lib/immersive-chrome";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const view = read("src/views/ProphetStoriesPage.tsx");
const css = read("src/styles/pages/prophet-stories.css");
const chrome = read("src/lib/immersive-chrome.ts");

assert.ok(existsSync(resolve(majalisRoot, "src/components/prophets/ProphetStoryReader.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/components/prophets/ProphetStoryReaderHeader.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/components/prophets/ProphetStorySectionHeader.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/components/prophets/ProphetTopicCard.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/components/prophets/ProphetStorySourcesBlock.tsx")));

assert.match(view, /ProphetStoryReader/);
assert.match(view, /ProphetStoryReaderHeader/);
assert.match(view, /ProphetStorySectionHeader/);
assert.match(view, /ProphetTopicCard/);
assert.match(view, /ProphetStorySourcesBlock/);
assert.match(view, /data-prophets-rebuild="1"/);
assert.match(view, /data-prophets-reader|ProphetStoryReader/);
assert.doesNotMatch(view, /prophet-detail-lux__keys-hint/);
assert.doesNotMatch(view, /prophet-detail-lux__hero-star/);

assert.equal(isProphetsReadingPath("/prophets/adam"), true);
assert.equal(isProphetsReadingPath("/prophets"), false);
assert.equal(isProphetsReadingPath("/prophets/tree"), false);
assert.equal(isImmersiveChromePath("/prophets/adam"), true);
assert.equal(isImmersiveChromePath("/prophets"), false);
assert.equal(isPinnedChromePath("/prophets"), true);
assert.equal(isPinnedChromePath("/prophets/adam"), false);
assert.match(chrome, /isProphetsReadingPath/);

assert.equal((css.match(/#0[Bb]1[Aa]2[Ee]/g) ?? []).length, 0, "لا كحلي #0B1A2E في CSS الأنبياء");
assert.match(css, /--prophets-bg\s*:/);
assert.match(css, /--prophets-surface\s*:/);
assert.match(css, /--prophets-ink\s*:/);
assert.match(css, /--prophets-accent\s*:/);
assert.match(css, /\.prophet-reader-header\s*\{/);
assert.match(css, /\.prophet-sources-block\s*\{/);
assert.match(css, /\.prophet-story-reader\s*\{/);
assert.match(css, /\.prophet-section-lux__rule\s*\{/);

assert.match(css, /\.prophet-fact-card__value[\s\S]{0,180}?var\(--prophets-ink/s);
assert.match(css, /\.prophet-detail-toc__btn--active[\s\S]{0,220}?box-shadow:\s*inset 0 -2px 0/s);

console.log("prophets-stories-rebuild-impl-gate: ok");
