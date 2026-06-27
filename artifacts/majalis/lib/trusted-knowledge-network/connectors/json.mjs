/**
 * JSON feed / REST JSON connector.
 */
export const type = "json";

export async function fetch(source, contentType, { fetchText }) {
  const text = await fetchText(source.source_url);
  const data = JSON.parse(text);
  const cfg = source.connector_config || source.metadata?.connector_config || {};
  const itemsPath = cfg.itemsPath || "items";
  const raw = Array.isArray(data) ? data : resolvePath(data, itemsPath) || [];
  return (Array.isArray(raw) ? raw : []).slice(0, cfg.limit || 100).map((row) => mapJsonRow(row, contentType, cfg));
}

function resolvePath(obj, path) {
  return String(path || "").split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

function mapJsonRow(row, contentType, cfg) {
  const get = (key, fallback = "") => row[cfg.fields?.[key] || key] ?? fallback;
  const title = get("title");
  const body = get("body") || get("text") || get("content") || get("description");
  switch (contentType) {
    case "benefits":
      return { text: body || title, author_name: get("author"), category: get("category", "فوائد") };
    case "questions":
      return { question: get("question") || title, answer: get("answer") || body, category_name: get("category", "الفقه") };
    case "hadith":
      return { text: body || title, title, source_name: get("source", "سنة") };
    case "rulings":
      return { title, body, summary: String(body).slice(0, 300), category: get("category", "فقه عام") };
    case "stories":
      return { title, body, topic: get("topic"), summary: String(body).slice(0, 200) };
    case "articles":
      return { title, content: body, author: get("author"), category: get("category", "مقالات") };
    default:
      return { title, body, text: body, source_url: get("url") || get("link") };
  }
}
