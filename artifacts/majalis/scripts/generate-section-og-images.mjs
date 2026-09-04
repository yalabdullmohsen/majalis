#!/usr/bin/env node
/**
 * يولّد صور OG 1200×630 لأقسام سُنّة الرئيسية.
 * تشغيل: node scripts/generate-section-og-images.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const brand = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "brand");
const GREEN = { r: 16, g: 55, b: 42, alpha: 1 };
const GOLD = "#B8963F";
const WHITE = "#FFFFFF";

const sections = [
  { file: "og-home.png", title: "سُنّة", subtitle: "قرآن ودروس شرعية" },
  { file: "og-quran.png", title: "القرآن الكريم", subtitle: "المصحف وعلوم القرآن" },
  { file: "og-lessons.png", title: "الدروس العلمية", subtitle: "مواعيد ومشايخ ودورات" },
  { file: "og-fiqh.png", title: "الفقه والأحكام", subtitle: "أبواب ومسائل وقواعد" },
  { file: "og-hadith.png", title: "الحديث وعلومه", subtitle: "صحيح وحسن وتمييز الضعيف" },
  { file: "og-adhkar.png", title: "الأذكار", subtitle: "صباح ومساء ونوم وسفر" },
  { file: "og-search.png", title: "البحث", subtitle: "ابحث في الدروس والفقه والحديث" },
  { file: "og-contact.png", title: "تواصل معنا", subtitle: "سُنّة — منصة علمية" },
];

function svgFor(title, subtitle) {
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#143F35"/>
      <stop offset="100%" stop-color="#1A5245"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="90" r="120" fill="${GOLD}" opacity="0.12"/>
  <text x="600" y="280" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="700" fill="${WHITE}">${esc(title)}</text>
  <text x="600" y="360" text-anchor="middle" font-family="sans-serif" font-size="36" fill="${GOLD}">${esc(subtitle)}</text>
  <text x="600" y="560" text-anchor="middle" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.75)">www.ssunnah.com</text>
</svg>`);
}

for (const sec of sections) {
  const out = resolve(brand, sec.file);
  const png = await sharp(svgFor(sec.title, sec.subtitle))
    .png({ compressionLevel: 9, effort: 10, palette: true })
    .toBuffer();
  writeFileSync(out, png);
  console.log(`  ${sec.file} (${Math.round(png.length / 1024)} KB)`);
}

console.log("✓ generate-section-og-images done");
