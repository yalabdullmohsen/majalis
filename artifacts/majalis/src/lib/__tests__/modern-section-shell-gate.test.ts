/**
 * بوابة: التصميم العصري موحّد عبر كل الأقسام (modern-section-shell).
 * تشغيل: node --import tsx src/lib/__tests__/modern-section-shell-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const shell = read("src/styles/components/modern-section-shell.css");
const main = read("src/main.tsx");
const pageHero = read("src/styles/components/page-hero.css");
const topic = read("src/styles/components/topic-page.css");
const assistant = read("src/styles/pages/assistant.css");

assert.match(main, /modern-section-shell\.css/, "main يستورد الغلاف العصري");
assert.match(shell, /--mss-hero-from/, "رموز هيرو عصرية");
assert.match(shell, /--mss-hero-gradient/, "تدرج هيرو عصري");
assert.match(shell, /\.page-hero-mj--bleed:not\(\.home-page-hero\)/, "PageHero الداخلي مغطى");
assert.match(shell, /\.topic-page__hero/, "TopicPage مغطى");
assert.match(shell, /\.section-lobby__head/, "لوبي الأقسام مغطى");
assert.match(shell, /\.card--featured/, "البطاقات المميزة مغطاة");
assert.match(shell, /\.hp-featured-card/, "استكشاف الرئيسية مغطى");
assert.match(shell, /\.twh-hub-hero/, "هيرو التوحيد مغطى");
assert.match(shell, /\.pts-hero/, "هيرو مواقيت الصلاة مغطى");
assert.match(shell, /data-lessons-hub/, "استثناء لوبي الدروس المخفي");
assert.match(shell, /\.fiqh-lux-page/, "استثناء لوبي الفقه المخفي");

const polish = read("src/styles/components/surface-polish.css");
assert.match(polish, /--mss-hero-gradient/, "surface-polish يوافق mss");

assert.match(pageHero, /--mss-hero-gradient|--mss-hero-from/, "page-hero يستخدم رموز mss");
assert.match(topic, /--mss-hero-from|mss-hero/, "topic-page يستخدم رموز mss");
assert.match(assistant, /--mss-hero-gradient/, "المساعد يشارك التدرج الموحّد");

console.log("modern-section-shell-gate.test.ts: ok");
