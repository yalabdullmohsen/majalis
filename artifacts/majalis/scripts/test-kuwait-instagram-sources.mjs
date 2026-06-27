#!/usr/bin/env node
/**
 * Test Kuwait Instagram source discovery (og:tags fetch only).
 * Usage: node scripts/test-kuwait-instagram-sources.mjs
 */
import { discoverInstagramSource } from "../lib/cms/instagram-connector.mjs";

const TEST_SOURCES = [
  { name: "دروس شرعية الكويت", url: "https://instagram.com/drooss_kw", config: { handle: "drooss_kw", source_subtype: "lesson_aggregator" }, source_type: "instagram" },
  { name: "دورة ابن أبي طالب", url: "https://instagram.com/ibnabitallib", config: { handle: "ibnabitallib", source_subtype: "course_account" }, source_type: "instagram" },
  { name: "د. عثمان الخميس", url: "https://instagram.com/othmanalkamees", config: { handle: "othmanalkamees", website_url: "https://www.othmanalkamees.com", source_subtype: "scholar_official" }, source_type: "instagram" },
  { name: "جامع سعد الشلاحي", url: "https://instagram.com/alshalahi_masjid", config: { handle: "alshalahi_masjid", source_subtype: "mosque_official" }, source_type: "instagram" },
  { name: "مسجد بتلة الخرينج", url: "https://instagram.com/mpe.kh11", config: { handle: "mpe.kh11", source_subtype: "mosque_official" }, source_type: "instagram" },
];

console.log("Kuwait Instagram Source Fetch Test\n");

for (const source of TEST_SOURCES) {
  process.stdout.write(`→ ${source.config.handle} ... `);
  try {
    const result = await discoverInstagramSource(source);
    const item = result.items[0];
    console.log(
      result.connectorRequired ? "CONNECTOR_NEEDED" : "OK",
      "| title:", (item?.title || "").slice(0, 40),
      "| image:", item?.imageUrl ? "yes" : "no",
      result.instagramLimited ? "| limited" : "",
    );
    if (result.hint && result.connectorRequired) {
      console.log("  hint:", result.hint.slice(0, 120));
    }
  } catch (err) {
    console.log("ERROR", String(err.message || err).slice(0, 80));
  }
}

console.log("\nDone. Sources remain in DB even when Instagram blocks automated fetch.");
