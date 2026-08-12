import { buildFeedXml } from "../../cms/sitemap-builder.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const xml = await buildFeedXml();
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800");
    res.statusCode = 200;
    res.end(xml);
  } catch (err) {
    console.error("[feed]", err);
    res.statusCode = 500;
    res.end("<rss/>");
  }
}
