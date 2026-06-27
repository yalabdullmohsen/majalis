/**
 * XML connector — generic item extraction.
 */
export const type = "xml";

export async function fetch(source, contentType, { fetchText }) {
  const xml = await fetchText(source.source_url);
  const items = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];
  for (const block of matches.slice(0, 100)) {
    items.push({
      title: extractTag(block, "title"),
      body: extractTag(block, "description") || extractTag(block, "content:encoded"),
      link: extractTag(block, "link"),
      category: extractTag(block, "category"),
    });
  }
  if (!items.length) {
    const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
    for (const block of (xml.match(entryRegex) || []).slice(0, 100)) {
      items.push({
        title: extractTag(block, "title"),
        body: extractTag(block, "summary") || extractTag(block, "content"),
        link: extractTag(block, "link") || extractAttr(block, "link", "href"),
        category: extractTag(block, "category"),
      });
    }
  }
  return items.map((item) => mapXmlItem(item, contentType));
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? stripCdata(m[1]) : "";
}

function extractAttr(block, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function stripCdata(s) {
  return String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").trim();
}

function mapXmlItem(item, contentType) {
  const body = stripCdata(item.body);
  switch (contentType) {
    case "benefits":
      return { text: body || item.title, category: item.category || "فوائد" };
    case "questions":
      return { question: item.title, answer: body, category_name: item.category || "الفقه" };
    default:
      return { title: item.title, body, text: body, source_url: item.link, category: item.category };
  }
}
