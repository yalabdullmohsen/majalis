import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { assertValidFeed } from "./schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = resolve(__dirname, "../../public/data");
const FEED_PATH = resolve(DATA_ROOT, "lessons/feed.json");
const ARCHIVE_DIR = resolve(DATA_ROOT, "lessons/archive");
const ACCOUNTS_PATH = resolve(DATA_ROOT, "sources/accounts.json");
const RETENTION_DAYS = 90;

export function loadAccounts() {
  const raw = JSON.parse(readFileSync(ACCOUNTS_PATH, "utf8"));
  return raw.accounts ?? raw;
}

export function saveAccounts(accounts) {
  writeFileSync(
    ACCOUNTS_PATH,
    `${JSON.stringify({ version: 1, updated_at: new Date().toISOString(), accounts }, null, 2)}\n`,
  );
}

export function loadFeed() {
  if (!existsSync(FEED_PATH)) {
    return { version: 1, generated_at: new Date().toISOString(), items: [] };
  }
  return JSON.parse(readFileSync(FEED_PATH, "utf8"));
}

export function publishFeed(items, accountsById) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86400000);
  const trimmed = items
    .filter((it) => new Date(it.published_at) >= cutoff)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  const doc = {
    version: 1,
    generated_at: now.toISOString(),
    items: trimmed,
  };
  assertValidFeed(doc);

  mkdirSync(dirname(FEED_PATH), { recursive: true });
  writeFileSync(FEED_PATH, `${JSON.stringify(doc, null, 2)}\n`);

  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  mkdirSync(ARCHIVE_DIR, { recursive: true });
  const archivePath = resolve(ARCHIVE_DIR, `${monthKey}.json`);
  writeFileSync(archivePath, `${JSON.stringify({ month: monthKey, items: trimmed }, null, 2)}\n`);

  for (const acc of accountsById.values()) {
    if (acc._maxPublished) acc.last_seen_at = acc._maxPublished;
    delete acc._maxPublished;
  }
  saveAccounts([...accountsById.values()]);

  return { feedPath: FEED_PATH, archivePath, count: trimmed.length };
}
