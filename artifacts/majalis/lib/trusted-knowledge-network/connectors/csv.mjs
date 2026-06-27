/**
 * CSV connector — uses content-import CSV parser.
 */
import { parseCsvString } from "../../content-import/csv-parse.mjs";

export const type = "csv";

export async function fetch(source, contentType, { fetchText }) {
  const text = await fetchText(source.source_url);
  const rows = parseCsvString(text);
  const cfg = source.connector_config || {};
  return rows.slice(0, cfg.limit || 500).map((row) => {
    const get = (k) => row[k] ?? row[cfg.fields?.[k]] ?? "";
    switch (contentType) {
      case "benefits":
        return { text: get("text") || get("faidah"), author_name: get("author_name") || get("author"), category: get("category") || "فوائد" };
      case "questions":
        return { question: get("question"), answer: get("answer"), category_name: get("category") || "الفقه" };
      default:
        return { title: get("title"), body: get("body") || get("text"), text: get("text"), category: get("category") };
    }
  });
}
