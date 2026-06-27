import { buildSitemapXml } from "../../cms/sitemap-builder.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const xml = await buildSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.statusCode = 200;
    res.end(xml);
  } catch (err) {
    console.error("[sitemap]", err);
    res.statusCode = 500;
    res.end("<?xml version=\"1.0\"?><error/>");
  }
}
