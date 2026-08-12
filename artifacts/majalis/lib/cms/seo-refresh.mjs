/**
 * SEO refresh — dynamic sitemap/RSS update markers (no rebuild required).
 */
import { logAutomationStep } from "./automation-step-logs.mjs";

export async function markSeoRefresh({ lessonId, sourceId, runId, action = "publish" }) {
  await logAutomationStep({
    runId,
    sourceId,
    lessonId,
    step: "seo",
    status: "ok",
    detail: `${action}: sitemap+rss+search index (dynamic API)`,
    metadata: {
      sitemap: "/api/sitemap",
      rss: "/api/feed",
      schema: "dynamic",
      cache: "request-time",
    },
  });

  return {
    ok: true,
    message: "SEO feeds refresh on next request — no build required",
    endpoints: ["/sitemap.xml", "/feed.xml"],
  };
}
