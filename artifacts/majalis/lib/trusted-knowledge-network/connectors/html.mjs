/**
 * HTML parser connector — extract text blocks from web pages.
 */
export const type = "html";

export async function fetch(source, contentType, { fetchText }) {
  const html = await fetchText(source.source_url);
  const cfg = source.connector_config || {};
  const selector = cfg.selector;

  let blocks = [];
  if (selector) {
    const re = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, "gi");
    let m;
    while ((m = re.exec(html)) !== null && blocks.length < 50) {
      blocks.push(stripHtml(m[1]));
    }
  }
  if (!blocks.length) {
    const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
    const chunk = articleMatch?.[0] || mainMatch?.[0] || html;
    blocks = [stripHtml(chunk).slice(0, 4000)];
  }

  return blocks.filter((b) => b.length > 40).map((body, i) => {
    const title = body.slice(0, 80).trim();
    switch (contentType) {
      case "benefits":
        return { text: body, category: "فوائد" };
      case "articles":
        return { title: title || `قسم ${i + 1}`, content: body, category: "مقالات" };
      default:
        return { title, body, text: body };
    }
  });
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
