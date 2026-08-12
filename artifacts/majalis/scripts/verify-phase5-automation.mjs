#!/usr/bin/env node
/**
 * Phase 5 — plugin connectors, discovery snapshot, update-on-duplicate.
 */
import { createSourceConnector, listSupportedConnectors } from "../lib/cms/connectors/index.mjs";
import { detectRemovedSourcePosts } from "../lib/cms/lesson-history.mjs";
import { detectCourseFromParsed } from "../lib/cms/course-handler.mjs";
import { simulateAutoPublishScenario } from "../lib/cms/lesson-source-monitor.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

const connectors = listSupportedConnectors();
assert("Phase 5 #1: instagram connector registered", connectors.includes("instagram"));
assert("Phase 5 #2: whatsapp connector registered", connectors.includes("whatsapp"));
assert("Phase 5 #3: facebook connector registered", connectors.includes("facebook"));

const ig = createSourceConnector({ source_type: "instagram", url: "https://instagram.com/test" });
assert("Phase 5 #4: Instagram connector label", ig.label === "Instagram");

const rss = createSourceConnector({ source_type: "rss", url: "https://example.com/feed.xml" });
assert("Phase 5 #5: RSS connector label", rss.label === "RSS");

const removed = detectRemovedSourcePosts(
  { config: { last_discovered_urls: ["https://a", "https://b", "https://c"] } },
  ["https://a", "https://c"],
);
assert("Phase 5 #6: removed post detection", removed.length === 1 && removed[0] === "https://b");

const notRemoved = detectRemovedSourcePosts(
  { config: { last_discovered_urls: ["https://a"] } },
  ["https://a", "https://b"],
);
assert("Phase 5 #7: no false removal when new items appear", notRemoved.length === 0);

assert("Phase 5 #8: course detection", detectCourseFromParsed({ title: "دورة فقه العبادات المكثفة" }));

const future = new Date();
future.setMonth(future.getMonth() + 2);
const futureIso = future.toISOString().slice(0, 10);

const updateScenario = simulateAutoPublishScenario({
  source: { active: true, auto_publish_allowed: true, trust_level: "official" },
  parsed: {
    title: "شرح رياض الصالحين",
    speaker_name: "الشيخ فلان",
    start_date: futureIso,
    gregorian_date: futureIso,
    day_of_week: "الجمعة",
    lesson_time: "بعد العشاء",
    mosque: "مسجد السلام",
    region: "الجهراء",
    city: "العاصمة",
  },
  confidenceScore: 0.97,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "s1" } },
  sourceUrl: "https://instagram.com/p/abc",
  imageUrl: "https://cdn.example/poster.jpg",
});
assert("Phase 5 #9: auto-publish still works", updateScenario.decision === "approved");

console.log(failed ? `\n${failed} failed` : "\nAll Phase 5 checks passed");
process.exit(failed ? 1 : 0);
