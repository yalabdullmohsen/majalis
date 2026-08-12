#!/usr/bin/env node
/**
 * Dry-run: fetch + parse + AI (no DB) — verifies pipeline stages without Supabase.
 */
import { extractRssItems, probeFeedUrl, aiAnalyzeContent, detectContentType, generateSeoMetadata, createSlug } from "../lib/auto-content/auto-content-utils.mjs";

const FEED = "https://www.iifa-aifi.org/ar/feed";

console.log("=== Auto Content Dry-Run (no DB) ===\n");
console.log("[START] Cron Started");
console.log("[probe] Probing feed...");

const probe = await probeFeedUrl(FEED);
console.log("[probe]", probe.ok ? `OK — ${probe.items} items, ${probe.bytes} bytes` : `FAILED — ${probe.reason}`);

if (!probe.ok) process.exit(1);

const xml = await (await fetch(FEED)).text();
console.log("[download] Downloaded Successfully");
console.log("[parse] Parsing RSS...");
const items = extractRssItems(xml);
console.log(`[parse] Parsed ${items.length} items`);

const sample = items[0];
console.log(`[sample] Title: ${sample.title.slice(0, 60)}...`);

console.log("[classify] Category:", detectContentType(sample.title, sample.description));
console.log("[ai] AI Started...");
const analysis = await aiAnalyzeContent({ title: sample.title, description: sample.description, sourceName: "IIFA" });
console.log("[ai] AI Finished — category:", analysis.category);
console.log("[seo] Summary:", (analysis.summary || "").slice(0, 100));
const slug = createSlug(sample.title);
const seo = generateSeoMetadata({ title: sample.title, summary: analysis.summary, category: analysis.category, slug, sourceName: "IIFA" });
console.log("[seo] SEO Title:", seo.seoTitle);
console.log("[finish] Dry-run pipeline OK — ready for Supabase insert when SERVICE_ROLE_KEY is set");
process.exit(0);
