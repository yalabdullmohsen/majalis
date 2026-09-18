/**
 * Wave 15 — أبحاث بلا شارة تجريبي علنية + فراغات اقتباسات/خرائط/مسارات.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave15-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const research = read("src/views/AcademicResearchPage.tsx");
assert.match(research, /EMPTY\.data/, "فراغ الأبحاث من EMPTY");
assert.match(research, /!r\.isDemo/, "يستبعد التجريبي من القوائم العامة");
assert.doesNotMatch(research, /sr-badge">تجريبي/, "بلا شارة تجريبي في الواجهة العامة");

const citations = read("src/views/MyCitationsPage.tsx");
assert.match(citations, /EMPTY\.(search|citations|data)/, "اقتباسات تستخدم EMPTY");

const mind = read("src/views/MindMapPage.tsx");
assert.match(mind, /EMPTY\.data/, "خرائط ذهنية تستخدم EMPTY");

const paths = read("src/views/learning/LearningPathsPage.tsx");
assert.match(paths, /EMPTY\.data/, "مسارات التعلّم تستخدم EMPTY");
assert.match(paths, /STATUS\.loadError/, "خطأ التحميل من STATUS");

console.log("content-quality-wave15-gate.test.ts: ok");
