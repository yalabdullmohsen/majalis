/**
 * Markdown connector — fetch .md and split by headings.
 */
export const type = "markdown";

export async function fetch(source, contentType, { fetchText }) {
  const md = await fetchText(source.source_url);
  const sections = md.split(/^#{1,3}\s+/m).filter(Boolean);
  return sections.slice(0, 50).map((section) => {
    const lines = section.trim().split("\n");
    const title = lines[0]?.trim() || "مقال";
    const body = lines.slice(1).join("\n").trim();
    switch (contentType) {
      case "benefits":
        return { text: body || title, category: "فوائد" };
      case "articles":
        return { title, content: body, category: "مقالات" };
      default:
        return { title, body, text: body };
    }
  });
}
