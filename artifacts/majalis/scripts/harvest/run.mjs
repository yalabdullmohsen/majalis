import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { adapterFor } from "./adapters/index.mjs";
import {
  getInstagramIngestMode,
  getInstagramProviderStatus,
  harvestInstagramAccount,
} from "./adapters/instagram.mjs";
import { stripEmojiFromTitle, summaryFromText } from "./normalize.mjs";
import { classifyType, extractFields, confidenceFor, isLessonRelevant } from "./classify.mjs";
import { fingerprintPrimary, fingerprintSecondary, mergeOrAppend } from "./dedupe.mjs";
import { loadAccounts, loadFeed, publishFeed } from "./publish.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures/harvest-items.json");
const REPORT_JSON = resolve(__dirname, "../../public/data/sources/harvest-report.json");
const INBOX_PATH = resolve(__dirname, "../../public/data/sources/inbox.jsonl");

const MS_DAY = 24 * 60 * 60 * 1000;

function lookbackDays() {
  const n = Number(process.env.HARVEST_LOOKBACK_DAYS || 7);
  return Number.isFinite(n) && n > 0 ? Math.min(30, Math.floor(n)) : 7;
}

function parseArgs(argv) {
  const daysFlag = argv.find((a) => a.startsWith("--days="));
  if (daysFlag) {
    const n = Number(daysFlag.slice("--days=".length));
    if (Number.isFinite(n) && n > 0) process.env.HARVEST_LOOKBACK_DAYS = String(Math.floor(n));
  }
  if (argv.includes("--backfill")) {
    process.env.INSTAGRAM_BACKFILL_ENABLED = "true";
  }
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
    return status;
  }
  if (mode === "oembed" && inboxIsEmpty()) {
    return { mode, configured: null, message: "instagram skipped: empty inbox" };
  }
  return status;
}

function emptyInstagramStats(total = 0) {
  return {
    accounts_total: total,
    checked: 0,
    unchanged: 0,
    new_posts_found: 0,
    published: 0,
    skipped_private: 0,
    failed: 0,
    probe_records_used: 0,
    fetch_records_used: 0,
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
    schedule_kind: fields.schedule_kind ?? null,
    women_attendance: fields.womenAttendance ?? null,
    women_attendance_note: fields.womenAttendanceNote ?? null,
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
    _igPostId: item.externalId || null,
    _igPostUrl: item.url || null,
    _lessonRelevant: isLessonRelevant(text),
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
    instagram_accounts_total: stats.instagramStats.accounts_total,
    instagram_checked: stats.instagramStats.checked,
    instagram_unchanged: stats.instagramStats.unchanged,
    instagram_new_posts_found: stats.instagramStats.new_posts_found,
    instagram_published: stats.instagramStats.published,
    instagram_skipped_private: stats.instagramStats.skipped_private,
    instagram_failed: stats.instagramStats.failed,
    instagram_probe_records_used: stats.instagramStats.probe_records_used,
    instagram_fetch_records_used: stats.instagramStats.fetch_records_used,
    sources: stats.sources,
    fetched: stats.fetched,
    published: stats.published,
    merged: stats.merged,
    failed: stats.failed,
    skipped: stats.skippedList,
    last_seen_updates: stats.lastSeenUpdates,
    lookback_days: stats.lookback_days ?? lookbackDays(),
    lookback_since: stats.lookback_since ?? null,
    lesson_relevant_published: stats.lessonRelevantPublished ?? 0,
    content_changed: stats.contentChanged === true,
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

function touchInstagramChecked(accountsById, accountId, checkedAt) {
  const acc = accountsById.get(accountId);
  if (!acc) return;
  acc.last_checked_at = checkedAt;
  acc._accountsMetaChanged = true;
}

function touchInstagramPublished(accountsById, accountId, { postId, postUrl, publishedAt }) {
  const acc = accountsById.get(accountId);
  if (!acc) return;
  const iso = publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString();
  if (postId) acc.last_seen_post_id = postId;
  if (postUrl) acc.last_seen_post_url = postUrl;
  acc.last_published_at = iso;
  acc.last_checked_at = iso;
  acc._maxPublished = iso;
  acc._accountsMetaChanged = true;
  acc._feedContentChanged = true;
}

export async function runHarvest({ dryRun = false, fixture = false, verbose = false } = {}) {
  const allAccounts = loadAccounts();
  const igTotal = allAccounts.filter((a) => a.platform === "instagram").length;

  const stats = {
    sources: 0,
    fetched: 0,
    published: 0,
    merged: 0,
    failed: [],
    skipped: 0,
    skippedList: /** @type {Array<{id?:string,reason:string}>} */ ([]),
    lastSeenUpdates: /** @type {Array<{id:string,last_seen_at:string}>} */ ([]),
    lookback_days: lookbackDays(),
    lookback_since: null,
    lessonRelevantPublished: 0,
    instagram: resolveInstagramNote(),
    instagramStats: emptyInstagramStats(igTotal),
    contentChanged: false,
  };

  const pushSkip = (id, reason) => {
    stats.skipped += 1;
    stats.skippedList.push({ id, reason });
  };

  const accountsById = new Map(allAccounts.map((a) => [a.id, { ...a }]));
  const harvestAccounts = allAccounts.filter((a) => canAutoPublish(a));
  stats.sources = harvestAccounts.length;

  for (const a of allAccounts) {
    const reason = skipReasonForAccount(a);
    if (reason && a.enabled) {
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
  const lookbackMs = lookbackDays() * MS_DAY;
  // نافذة ثابتة (افتراضي 7 أيام) — لا تعتمد على last_seen حتى لا نفقد دروسًا قادمة/متكررة
  const defaultSince = new Date(now - lookbackMs);
  const nowIso = new Date().toISOString();
  stats.lookback_days = lookbackDays();
  stats.lookback_since = defaultSince.toISOString();

  const igMode = getInstagramIngestMode();
  const igStatus = getInstagramProviderStatus();
  const skipAllInstagram =
    (igMode === "provider" && igStatus.configured === false) ||
    (igMode === "oembed" && inboxIsEmpty()) ||
    igMode === "off";

  if (skipAllInstagram && stats.instagram?.message) {
    if (!stats.skippedList.some((s) => s.id === "instagram")) {
      pushSkip("instagram", stats.instagram.message);
    }
  }

  const adapterFailed = new Set();
  let harvested = [];

  if (fixture || dryRun) {
    harvested = loadFixtureItems();
    stats.fetched = harvested.length;
  } else {
    for (const account of harvestAccounts) {
      if (account.platform === "instagram") {
        if (skipAllInstagram) continue;
        try {
          const result = await harvestInstagramAccount(account, {
            persistQuota: !dryRun,
            since: defaultSince,
          });
          stats.instagramStats.checked += 1;
          stats.instagramStats.probe_records_used += result.probeUsed || 0;
          stats.instagramStats.fetch_records_used += result.fetchUsed || 0;

          if (result.status === "unchanged") {
            stats.instagramStats.unchanged += 1;
            touchInstagramChecked(accountsById, account.id, nowIso);
            continue;
          }
          if (result.status === "private_or_unavailable") {
            stats.instagramStats.skipped_private += 1;
            pushSkip(account.id, result.message || result.status);
            touchInstagramChecked(accountsById, account.id, nowIso);
            continue;
          }
          if (result.status === "missing_secret" || result.status === "rate_limited") {
            pushSkip(account.id, result.message || result.status);
            if (result.status === "rate_limited") {
              // تخطّي بقية إنستغرام عند استنفاد الحصة دون إسقاط التشغيلة
              pushSkip("instagram", result.message || "rate_limited");
              break;
            }
            continue;
          }
          if (result.status === "provider_missing_latest_post_id") {
            pushSkip(account.id, "provider_missing_latest_post_id");
            stats.instagramStats.failed += 1;
            continue;
          }
          if (result.status === "provider_error") {
            stats.failed.push({ id: account.id, reason: result.message || result.status });
            stats.instagramStats.failed += 1;
            adapterFailed.add(account.id);
            continue;
          }
          if (result.status === "new_post" && result.items?.length) {
            const windowed = result.items.filter((it) => {
              if (!it?.publishedAt) return true;
              return new Date(it.publishedAt).getTime() >= defaultSince.getTime();
            });
            stats.instagramStats.new_posts_found += windowed.length;
            stats.fetched += windowed.length;
            harvested.push(...windowed);
            continue;
          }
          pushSkip(account.id, result.status || "instagram_skipped");
        } catch (err) {
          const msg = String(err?.message || err);
          stats.failed.push({ id: account.id, reason: msg });
          stats.instagramStats.failed += 1;
          adapterFailed.add(account.id);
        }
        continue;
      }

      const adapter = adapterFor(account.platform);
      if (!adapter) {
        pushSkip(account.id, `no_adapter:${account.platform}`);
        continue;
      }
      const since = defaultSince;
      try {
        const items = await adapter.fetch(account, since);
        const windowed = items.filter((it) => {
          if (!it?.publishedAt) return true;
          return new Date(it.publishedAt).getTime() >= defaultSince.getTime();
        });
        stats.fetched += windowed.length;
        harvested.push(...windowed);
      } catch (err) {
        const msg = String(err?.message || err);
        stats.failed.push({ id: account.id, reason: msg });
        adapterFailed.add(account.id);
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
        stats.contentChanged = true;
        if (!adapterFailed.has(account.id)) {
          if (account.platform === "instagram") {
            touchInstagramPublished(accountsById, account.id, {
              postId: card._igPostId,
              postUrl: card._igPostUrl,
              publishedAt: card.published_at,
            });
            stats.instagramStats.published += 1;
          } else {
            touchLastSeen(accountsById, account.id, card.published_at);
          }
        }
      }
      continue;
    }
    seenSecondary.add(card.id);
    cards.push(card);
    stats.published++;
    if (card._lessonRelevant) stats.lessonRelevantPublished += 1;
    stats.contentChanged = true;
    if (!adapterFailed.has(account.id)) {
      if (account.platform === "instagram") {
        touchInstagramPublished(accountsById, account.id, {
          postId: card._igPostId,
          postUrl: card._igPostUrl,
          publishedAt: card.published_at,
        });
        stats.instagramStats.published += 1;
      } else {
        touchLastSeen(accountsById, account.id, card.published_at);
      }
    }
  }

  for (const c of cards) {
    delete c._primary;
    delete c._igPostId;
    delete c._igPostUrl;
    delete c._lessonRelevant;
  }

  for (const id of adapterFailed) {
    const acc = accountsById.get(id);
    if (acc) {
      delete acc._maxPublished;
      delete acc._feedContentChanged;
    }
  }

  for (const acc of accountsById.values()) {
    if (acc._maxPublished) {
      stats.lastSeenUpdates.push({ id: acc.id, last_seen_at: acc._maxPublished });
    }
  }

  const accountsMetaChanged = [...accountsById.values()].some((a) => a._accountsMetaChanged);
  for (const acc of accountsById.values()) {
    delete acc._accountsMetaChanged;
    delete acc._feedContentChanged;
  }

  // content_changed = منشورات جديدة في feed (ليس مجرد last_checked_at / report)
  stats.contentChanged = Boolean(stats.contentChanged);

  if (!dryRun) {
    publishFeed(cards, accountsById);
    writeHarvestReportJson(stats, { dryRun: false });
  }

  if (verbose) console.log(JSON.stringify(stats, null, 2));
  return { stats, items: cards, accountsMetaChanged };
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
      console.log(
        `harvest ig: checked=${stats.instagramStats.checked} unchanged=${stats.instagramStats.unchanged} new=${stats.instagramStats.new_posts_found} published=${stats.instagramStats.published} private=${stats.instagramStats.skipped_private} failed=${stats.instagramStats.failed} probe=${stats.instagramStats.probe_records_used} fetch=${stats.instagramStats.fetch_records_used}`,
      );
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
