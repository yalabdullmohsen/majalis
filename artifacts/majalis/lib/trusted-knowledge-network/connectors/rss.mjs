/**
 * RSS connector — wraps existing RSS extraction.
 */
import { extractRssItems } from "../../auto-content/auto-content-utils.mjs";

export const type = "rss";

export async function fetch(source, contentType, { fetchText }) {
  const xml = await fetchText(source.source_url);
  const items = await extractRssItems(xml, source.source_url);
  return (items || []).map((item) => mapItem(item, contentType));
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapItem(item, contentType) {
  const body = stripHtml(item.content || item.description || item.summary || "");
  const base = {
    title: item.title || "",
    body,
    text: body,
    source_url: item.link || item.url,
    link: item.link || item.url,
    category: item.category || null,
    published_at: item.pubDate || item.published || null,
  };
  switch (contentType) {
    case "benefits":
      return { text: body || item.title, author_name: item.author, category: item.category || "فوائد" };
    case "questions":
      return { question: item.title, answer: body, category_name: item.category || "الفقه", reference: item.link };
    case "hadith":
      return { text: body || item.title, title: item.title, source_name: item.source || "سنة", source_url: item.link };
    case "rulings":
      return { title: item.title, body, summary: body.slice(0, 300), category: item.category || "فقه عام" };
    case "stories":
      return { title: item.title, body, topic: item.category, summary: body.slice(0, 200) };
    case "articles":
      return { title: item.title, content: body, author: item.author, category: item.category || "مقالات" };
    default:
      return base;
  }
}
