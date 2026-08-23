/**
 * رباعية الاختصارات ٢×٢ — صندوق واحد + pluralAr + تمييز ثابت.
 * node --import tsx src/lib/__tests__/quick-actions-quad.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getLobby } from "@/config/section-lobbies";
import { pluralAr, NOUN_DURUS, NOUN_HALAQAT } from "@/lib/arabic-count";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const cmp = read("src/components/lobby/QuickActionsQuad.tsx");
const css = read("src/components/lobby/quick-actions-quad.css");
const lobby = read("src/components/lobby/SectionLobby.tsx");

assert.match(cmp, /pluralAr/);
assert.match(cmp, /role="link"/);
assert.match(cmp, /افتح \$\{it\.label\} — \$\{countLabel\}/);
assert.match(css, /grid-template-columns:\s*1fr 1fr/);
assert.match(css, /data-count="5"/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /quick-quad__cell--accent/);
assert.doesNotMatch(css, /@keyframes|animation:/);
assert.match(css, /prefers-reduced-motion/);
assert.match(lobby, /QuickActionsQuad/);

assert.equal(pluralAr(12, NOUN_HALAQAT), "12 حلقة");
assert.equal(pluralAr(34, NOUN_DURUS), "34 درساً");
assert.equal(pluralAr(97, NOUN_DURUS), "97 درساً");

const lessons = getLobby("lessons");
assert.equal(lessons.quad?.[0]?.label, "الدروس");
assert.equal(lessons.quad?.[1]?.label, "الحلقات");
assert.equal(lessons.quad?.[2]?.label, "المسابقات");
assert.equal(lessons.quad?.[3]?.label, "التقويم");
assert.equal(lessons.quad?.[4]?.label, "الأرشيف");
assert.equal(lessons.quad?.length, 5);

console.log("quick-actions-quad.test.ts: ok");
