#!/usr/bin/env node
/**
 * يمنع رجوع إيموجي Unicode ظاهرة في نصوص/JSX الواجهة.
 * مسموح: مفاتيح icon:/emoji: وخصائص name= داخل SectionIcon فقط، وملف SectionIcon.tsx.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

/** إيموجي العرض (Emoji_Presentation / VS16 / pictographs) — بلا ✓ ▶ © */
const EMOJI_RE =
  /(?:[\u{1F300}-\u{1FAFF}]|\p{Emoji_Presentation}|(?:\p{Extended_Pictographic}\uFE0F)|[\u{23F0}-\u{23F3}])/gu;

const ALLOW_FILES = new Set(["SectionIcon.tsx"]);

function stripAllowed(line) {
  return line
    // SectionIcon ... /> أو >...</SectionIcon>
    .replace(/<SectionIcon\b[^>]*\/?\s*>/g, "")
    .replace(/<\/SectionIcon>/g, "")
    // مفاتيح بيانات الأيقونة فقط
    .replace(/(?:icon|emoji)\s*[:=]\s*["'][^"']*["']/g, "")
    .replace(/(?:icon|emoji)=\{?["'][^"']*["']\}?/g, "");
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist") continue;
      walk(p, out);
    } else if (/\.(tsx|jsx)$/.test(ent.name) && !ALLOW_FILES.has(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

const violations = [];
for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file);
  const lines = fs.readFileSync(file, "utf8").split(/\n/);
  lines.forEach((line, i) => {
    const cleaned = stripAllowed(line);
    EMOJI_RE.lastIndex = 0;
    if (!EMOJI_RE.test(cleaned)) return;
    // تجاهل تعليقات بلا عرض
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
    EMOJI_RE.lastIndex = 0;
    const sample = cleaned.match(EMOJI_RE)?.[0] ?? "?";
    violations.push(`${rel}:${i + 1}: إيموجي ظاهر «${sample}» — استخدم SectionIcon أو احذف الزخرفة`);
  });
}

// عرض خام لـ {x.icon} خارج مكوّنات الأيقونة (عندما تكون المفاتيح نص إيموجي)
const RAW_ICON = /\{[a-zA-Z0-9_$.]+\.icon\}/;
const ICON_COMP =
  /SectionIcon|CategoryIcon|BadgeIcon|PMIcon|StoryIcon|CatIcon|IntroIcon|name=\{/;
for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, "utf8");
  // أيقونات JSX/مكوّنات (ReactNode) وليست إيموجي نصي
  if (/icon:\s*</.test(src) || /icon:\s*ReactNode/.test(src)) continue;
  const lines = src.split(/\n/);
  lines.forEach((line, i) => {
    if (!RAW_ICON.test(line)) return;
    if (ICON_COMP.test(line)) return;
    if (/icon\s*:\s*\{/.test(line)) return;
    violations.push(
      `${rel}:${i + 1}: عرض خام لـ .icon — لفّه بـ <SectionIcon name={…} />`,
    );
  });
}

if (violations.length) {
  console.error(`✗ حارس الإيموجي في الواجهة: ${violations.length} مخالفة\n`);
  for (const v of violations.slice(0, 40)) console.error("  • " + v);
  if (violations.length > 40) console.error(`  … و${violations.length - 40} أخرى`);
  process.exit(1);
}

console.log("✓ حارس الإيموجي في الواجهة: لا إيموجي ظاهر في JSX (خارج مفاتيح SectionIcon).");
