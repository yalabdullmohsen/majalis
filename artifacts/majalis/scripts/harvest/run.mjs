import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { adapterFor } from "./adapters/index.mjs";
import { getInstagramProviderStatus } from "./adapters/instagram.mjs";
import { normalizeArabic, stripEmojiFromTitle, summaryFromText } from "./normalize.mjs";
import { classifyType, extractFields, confidenceFor } from "./classify.mjs";
import { fingerprintPrimary, fingerprintSecondary, mergeOrAppend } from "./dedupe.mjs";
import { loadAccounts, loadFeed, publishFeed } from "./publish.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures/harvest-items.json");

const HOURS_48 = 48 * 60 * 60 * 1000;

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    fixture: argv.includes("--fixture"),
    verbose: argv.includes("--verbose"),
  };
}

function itemToCard(item, account) {
  const title = stripEmojiFromTitle(item.title || item.text?.slice(0, 80) || "إعلان");
  const text = item.text || title;
  const fields = extractFields(text, account.audience);
  const type = classifyType(text);
  const published_at = item.publishedAt || new Date().toISOString();
  const dateKey = fields.starts_at || published_at.slice(0, 10);
  const id = fingerprintSecondary(title, dateKey, fields.place);
  return {
    id,
    type,
    title_ar: title,
    summary_ar: summaryFromText(text, 160),
    sheikh: fields.sheikh,
    place: fields.place,
    audience: fields.audience,
    starts_at: fields.starts_at,
    time_text: fields.time_text,
    register_url: fields.register_url,
    sources: [
      {
        id: account.id,
        name_ar: account.name_ar,
        url: account.url,
        post_url: item.url,
        platform: account.platform,
      },
    ],
    image_url: item.imageUrl ?? null,
    published_at,
    confidence: confidenceFor(item, fields),
    _primary: fingerprintPrimary(account.id, item.externalId),
  };
}

function loadFixtureItems() {
  const raw = JSON.parse(readFileSync(FIXTURES, "utf8"));
  return raw.items ?? [];
}

function appendHarvestReport(stats) {
  const reportPath = resolve(__dirname, "../../docs/HARVEST_REPORT.md");
  const igNote = stats.instagram?.message ? ` | IG: ${stats.instagram.message}` : "";
  const line = `| ${new Date().toISOString()} | ${stats.sources} | ${stats.fetched} | ${stats.published} | ${stats.merged} | ${stats.failed.length}${igNote} |`;
  let body = "";
  try {
    body = readFileSync(reportPath, "utf8");
  } catch {
    body = "# تقرير حصاد المصادر\n\n| التشغيلة | المصادر | المجلوب | المنشور | المكرر | الفاشل |\n|---|---:|---:|---:|---:|---:|\n";
  }
  if (!body.includes(line)) {
    const rows = body.trimEnd().split("\n");
    rows.push(line);
    writeFileSync(reportPath, `${rows.join("\n")}\n`);
  }
}

export async function runHarvest({ dryRun = false, fixture = false, verbose = false } = {}) {
  const stats = {
    sources: 0,
    fetched: 0,
    published: 0,
    merged: 0,
    failed: [],
    skipped: 0,
    instagram: getInstagramProviderStatus(),
  };

  const accounts = loadAccounts().filter((a) => a.enabled);
  stats.sources = accounts.length;
  const accountsById = new Map(accounts.map((a) => [a.id, { ...a }]));

  const existing = loadFeed().items ?? [];
  const cards = [...existing];
  const seenPrimary = new Set(cards.flatMap((c) => c.sources.map((s) => `${s.id}:${c.id}`)));
  const seenSecondary = new Set(cards.map((c) => c.id));

  const now = Date.now();
  const defaultSince = new Date(now - HOURS_48);

  let harvested = [];
  if (fixture || dryRun) {
    harvested = loadFixtureItems();
    stats.fetched = harvested.length;
  } else {
    for (const account of accounts) {
      const adapter = adapterFor(account.platform);
      if (!adapter) {
        stats.skipped++;
        continue;
      }
      const since = account.last_seen_at ? new Date(account.last_seen_at) : defaultSince;
      try {
        const items = await adapter.fetch(account, since);
        stats.fetched += items.length;
        harvested.push(...items);
        if (items.length) {
          const maxPub = items.reduce((m, it) => {
            const t = new Date(it.publishedAt).getTime();
            return t > m ? t : m;
          }, 0);
          const acc = accountsById.get(account.id);
          if (acc && maxPub) acc._maxPublished = new Date(maxPub).toISOString();
        }
      } catch (err) {
        stats.failed.push({ id: account.id, reason: String(err?.message || err) });
      }
    }
  }

  for (const item of harvested) {
    const account = accountsById.get(item.sourceId);
    if (!account) continue;
    if (!item.url || !(item.title || item.text)) continue;

    const card = itemToCard(item, account);
    if (seenPrimary.has(card._primary)) continue;
    seenPrimary.add(card._primary);

    if (!card.title_ar || !card.sources[0]?.post_url) {
      card.type = "إعلان";
    }

    if (seenSecondary.has(card.id)) {
      const { merged } = mergeOrAppend(cards, card);
      if (merged) stats.merged++;
      continue;
    }
    seenSecondary.add(card.id);
    cards.push(card);
    stats.published++;
  }

  for (const c of cards) delete c._primary;

  if (!dryRun) {
    publishFeed(cards, accountsById);
    appendHarvestReport(stats);
  }

  if (verbose) console.log(JSON.stringify(stats, null, 2));
  return { stats, items: cards };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  runHarvest(args)
    .then(({ stats }) => {
      console.log(
        `harvest: sources=${stats.sources} fetched=${stats.fetched} published=${stats.published} merged=${stats.merged} failed=${stats.failed.length}`,
      );
      if (stats.instagram?.message) {
        console.log(`harvest: ${stats.instagram.message}`);
      }
      if (stats.failed.length) {
        for (const f of stats.failed.slice(0, 5)) console.error(`  ✗ ${f.id}: ${f.reason}`);
      }
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
