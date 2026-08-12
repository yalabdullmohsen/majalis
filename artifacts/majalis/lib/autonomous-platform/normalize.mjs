/**
 * Text normalization for dedup and verification.
 */
import { createHash } from "node:crypto";

export function normalizeArabicText(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeTitle(title) {
  return normalizeArabicText(title).slice(0, 200);
}

export function contentHash(contentType, parts) {
  const joined = [contentType, ...parts.map(normalizeArabicText)].join("|");
  return createHash("sha256").update(joined).digest("hex").slice(0, 32);
}

export function tokenize(text) {
  return normalizeArabicText(text)
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function tokenOverlapSimilarity(a, b) {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (!ta.size || !tb.size) return 0;
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection += 1;
  }
  return intersection / Math.max(ta.size, tb.size);
}

export function kuwaitDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function periodStart(period = "daily") {
  const d = new Date();
  if (period === "weekly") {
    d.setDate(d.getDate() - d.getDay());
  }
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
