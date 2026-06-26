import { sendJson } from "./_http.js";
import { getTopicContent } from "../lib/scholarly-intelligence/unified-search.mjs";
import { getAllTopics, getTopicBySlug } from "../lib/scholarly-intelligence/topics.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const slug = req.query?.slug;
  if (!slug) {
    sendJson(res, 200, {
      ok: true,
      topics: getAllTopics().map((t) => ({
        slug: t.slug,
        title: t.title,
        title_en: t.title_en,
        category: t.category,
      })),
    });
    return;
  }

  const topic = getTopicBySlug(slug);
  if (!topic) {
    sendJson(res, 404, { ok: false, error: "topic_not_found" });
    return;
  }

  try {
    const result = await getTopicContent(slug, {
      limit: Number(req.query?.limit || 30),
    });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
