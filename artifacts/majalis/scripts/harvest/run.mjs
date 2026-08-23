import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { adapterFor } from "./adapters/index.mjs";
import { getInstagramIngestMode, getInstagramProviderStatus } from "./adapters/instagram.mjs";
import { stripEmojiFromTitle, summaryFromText } from "./normalize.mjs";
import { classifyType, extractFields, confidenceFor } from "./classify.mjs";
import { fingerprintPrimary, fingerprintSecondary, mergeOrAppend } from "./dedupe.mjs";
import { loadAccounts, loadFeed, publishFeed } from "./publish.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures/harvest-items.json");
const REPORT_JSON = resolve(__dirname, "../../public/data/sources/harvest-report.json");
const INBOX_PATH = resolve(__dirname, "../../public/data/sources/inbox.jsonl");

const HOURS_48 = 48 * 60 * 60 * 1000;

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    fixture: argv.includes("--fixture"),
    verbose: argv.includes("--verbose"),
  };
}

function canAutoPublish(account) {
  return Boolean(
    account &&
      account.enabled === true &&
      account.trusted === true &&
      account.autoPublish === true,
  );
}

function skipReasonForAccount(account) {
  if (!account) return "account_missing";
  if (account.enabled !== true) return "disabled";
  if (account.trusted !== true) return "not_trusted";
  if (account.autoPublish !== true) return "auto_publish_off";
  return null;
}

function inboxIsEmpty() {
  if (!existsSync(INBOX_PATH)) return true;
  const lines = readFileSync(INBOX_PATH, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length === 0;
}

function resolveInstagramNote() {
  const mode = getInstagramIngestMode();
  const status = getInstagramProviderStatus();
  if (mode === "off") {
    return { ...status, message: status.message || "instagram skipped: mode=off" };
  }
  if (mode === "provider" && status.configured === false) {
    return status; // message: "Instagram provider is not configured."
  }
  if (mode === "oembed" && inboxIsEmpty()) {
    return { mode, configured: null, message: "instagram skipped: empty inbox" };
  }
  return status;
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

function writeHarvestReportJson(stats, { dryRun }) {
  const payload = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    instagram_mode: getInstagramIngestMode(),
    instagram: stats.instagram,
    sources: stats.sources,
    fetched: stats.fetched,
    published: stats.published,
    merged: stats.merged,
    failed: stats.failed,
    skipped: stats.skippedList,
    last_seen_updates: stats.lastSeenUpdates,
  };
  mkdirSync(dirname(REPORT_JSON), { recursive: true });
  writeFileSync(REPORT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
}

function touchLastSeen(accountsById, accountId, publishedAt) {
  const acc = accountsById.get(accountId);
  if (!acc || !publishedAt) return;
  const iso = new Date(publishedAt).toISOString();
  if (!acc._maxPublished || iso > acc._maxPublished) {
    acc._maxPublished = iso;
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
    skippedList: /** @type {Array<{id?:string,reason:string}>} */ ([]),
    lastSeenUpdates: /** @type {Array<{id:string,last_seen_at:string}>} */ ([]),
    instagram: resolveInstagramNote(),
  };

  const pushSkip = (id, reason) => {
    stats.skipped += 1;
    stats.skippedList.push({ id, reason });
  };

  // كل الحسابات تُحفظ كما هي — الحصاد فقط للمؤهّلين للنشر التلقائي
  const allAccounts = loadAccounts();
  const accountsById = new Map(allAccounts.map((a) => [a.id, { ...a }]));
  const harvestAccounts = allAccounts.filter((a) => canAutoPublish(a));
  stats.sources = harvestAccounts.length;

  for (const a of allAccounts) {
    const reason = skipReasonForAccount(a);
    if (reason && a.enabled) {
      // نسجّل غير الموثوق / بدون autoPublish مرة واحدة (ليس لكل عنصر)
      if (reason === "not_trusted" || reason === "auto_publish_off") {
        pushSkip(a.id, reason);
      }
    }
  }

  const existing = loadFeed().items ?? [];
  const cards = [...existing];
  const seenPrimary = new Set(
    cards.flatMap((c) => (c.sources || []).map((s) => `${s.id}:${c.id}`)),
  );
  const seenSecondary = new Set(cards.map((c) => c.id));

  const now = Date.now();
  const defaultSince = new Date(now - HOURS_48);

  const igMode = getInstagramIngestMode();
  const igStatus = getInstagramProviderStatus();
  const skipAllInstagram =
    (igMode === "provider" && igStatus.configured === false) ||
    (igMode === "oembed" && inboxIsEmpty()) ||
    igMode === "off";

  if (skipAllInstagram && stats.instagram?.message) {
    // رسالة عامة مرة واحدة — تفادي فشل التشغيلة
    if (!stats.skippedList.some((s) => s.id === "instagram")) {
      pushSkip("instagram", stats.instagram.message);
    }
  }

  /** حسابات فشل محوّلها بالكامل — لا last_seen_at */
  const adapterFailed = new Set();

  let harvested = [];
  if (fixture || dryRun) {
    harvested = loadFixtureItems();
    stats.fetched = harvested.length;
  } else {
    for (const account of harvestAccounts) {
      if (account.platform === "instagram" && skipAllInstagram) {
        continue;
      }
      const adapter = adapterFor(account.platform);
      if (!adapter) {
        pushSkip(account.id, `no_adapter:${account.platform}`);
        continue;
      }
      const since = account.last_seen_at ? new Date(account.last_seen_at) : defaultSince;
      try {
        const items = await adapter.fetch(account, since);
        stats.fetched += items.length;
        harvested.push(...items);
        // لا تُحدَّث last_seen هنا — فقط بعد نشر/دمج ناجح أدناه
      } catch (err) {
        const msg = String(err?.message || err);
        // فشل محوّل واحد لا يسقط التشغيلة
        if (/instagram/i.test(msg) && /not configured|empty|skip/i.test(msg)) {
          pushSkip(account.id, msg);
        } else {
          stats.failed.push({ id: account.id, reason: msg });
          adapterFailed.add(account.id);
        }
      }
    }
  }

  for (const item of harvested) {
    const account = accountsById.get(item.sourceId);
    if (!account) {
      pushSkip(item.sourceId, "unknown_account");
      continue;
    }
    const gate = skipReasonForAccount(account);
    if (gate) {
      pushSkip(account.id, gate);
      continue;
    }
    if (!item.url) {
      pushSkip(account.id, "missing_post_url");
      continue;
    }
    if (!(item.title || item.text)) {
      pushSkip(account.id, "missing_title");
      continue;
    }

    const card = itemToCard(item, account);
    if (seenPrimary.has(card._primary)) continue;
    seenPrimary.add(card._primary);

    if (!card.title_ar?.trim() || !card.sources[0]?.post_url) {
      pushSkip(account.id, !card.title_ar?.trim() ? "missing_title" : "missing_post_url");
      continue;
    }

    if (seenSecondary.has(card.id)) {
      const { merged } = mergeOrAppend(cards, card);
      if (merged) {
        stats.merged++;
        if (!adapterFailed.has(account.id)) {
          touchLastSeen(accountsById, account.id, card.published_at);
        }
      }
      continue;
    }
    seenSecondary.add(card.id);
    cards.push(card);
    stats.published++;
    if (!adapterFailed.has(account.id)) {
      touchLastSeen(accountsById, account.id, card.published_at);
    }
  }

  for (const c of cards) delete c._primary;

  // لا تكتب last_seen لحساب فشل محوّله بالكامل
  for (const id of adapterFailed) {
    const acc = accountsById.get(id);
    if (acc) delete acc._maxPublished;
  }

  for (const acc of accountsById.values()) {
    if (acc._maxPublished) {
      stats.lastSeenUpdates.push({ id: acc.id, last_seen_at: acc._maxPublished });
    }
  }

  if (!dryRun) {
    // تمرير كل الحسابات حتى لا يُحذف غير المحصود
    publishFeed(cards, accountsById);
    writeHarvestReportJson(stats, { dryRun: false });
  }

  if (verbose) console.log(JSON.stringify(stats, null, 2));
  return { stats, items: cards };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  runHarvest(args)
    .then(({ stats }) => {
      console.log(
        `harvest: sources=${stats.sources} fetched=${stats.fetched} published=${stats.published} merged=${stats.merged} skipped=${stats.skipped} failed=${stats.failed.length}`,
      );
      if (stats.instagram?.message) {
        console.log(`harvest: ${stats.instagram.message}`);
      }
      if (stats.failed.length) {
        for (const f of stats.failed.slice(0, 5)) console.error(`  ✗ ${f.id}: ${f.reason}`);
      }
      // فشل محوّل واحد لا يسقط العملية
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
