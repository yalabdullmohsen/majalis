import { createHash } from "node:crypto";
import { normalizeArabic } from "./normalize.mjs";

export function fingerprintPrimary(sourceId, externalId) {
  return createHash("sha1").update(`${sourceId}:${externalId}`).digest("hex");
}

export function fingerprintSecondary(title, dateKey, place) {
  const n = normalizeArabic(title);
  const p = normalizeArabic(place ?? "");
  return createHash("sha1").update(`${n}|${dateKey ?? ""}|${p}`).digest("hex");
}

/**
 * @param {import('./types.mjs').FeedCard[]} cards
 * @param {import('./types.mjs').FeedCard} incoming
 */
export function mergeOrAppend(cards, incoming) {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const existing = byId.get(incoming.id);
  if (!existing) {
    cards.push(incoming);
    return { merged: false };
  }
  const sourceUrls = new Set(existing.sources.map((s) => s.post_url));
  for (const src of incoming.sources) {
    if (!sourceUrls.has(src.post_url)) existing.sources.push(src);
  }
  if (!existing.register_url && incoming.register_url) existing.register_url = incoming.register_url;
  if (!existing.image_url && incoming.image_url) existing.image_url = incoming.image_url;
  if (incoming.confidence > existing.confidence) existing.confidence = incoming.confidence;
  return { merged: true };
}
