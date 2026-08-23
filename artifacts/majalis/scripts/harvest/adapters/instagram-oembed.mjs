import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText, extractOg } from "../http.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INBOX_PATH = resolve(__dirname, "../../../public/data/sources/inbox.jsonl");

function readInboxForHandle(handle) {
  if (!existsSync(INBOX_PATH)) return [];
  const lines = readFileSync(INBOX_PATH, "utf8").split("\n").filter(Boolean);
  const out = [];
  for (const line of lines) {
    try {
      const row = JSON.parse(line);
      if (row.handle === handle || row.account === handle) out.push(row.url);
    } catch {
      /* skip */
    }
  }
  return out;
}

async function oembedPost(url) {
  const { text: html } = await fetchText(url);
  const title = extractOg(html, "og:title") || url;
  const desc = extractOg(html, "og:description") || "";
  const image = extractOg(html, "og:image") || undefined;
  return { title, text: desc || title, imageUrl: image };
}

/**
 * @param {import('../types.mjs').SourceAccount} account
 * @returns {Promise<import('../types.mjs').HarvestItem[]>}
 */
export async function fetchViaOembed(account) {
  const inboxUrls = readInboxForHandle(account.handle);
  const items = [];
  for (const postUrl of inboxUrls) {
    try {
      const meta = await oembedPost(postUrl);
      const externalId = postUrl.split("/").filter(Boolean).pop() ?? postUrl;
      items.push({
        sourceId: account.id,
        externalId,
        url: postUrl,
        title: meta.title,
        text: meta.text,
        imageUrl: meta.imageUrl,
        publishedAt: new Date().toISOString(),
      });
    } catch {
      /* تخطَّ الرابط الفاشل */
    }
  }
  return items;
}
