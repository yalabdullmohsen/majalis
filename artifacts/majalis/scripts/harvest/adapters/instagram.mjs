import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchViaOembed } from "./instagram-oembed.mjs";
import {
  fetchViaProvider,
  getInstagramIngestMode,
  getInstagramProviderStatus,
  probeAndMaybeFetch,
  samePost,
  normalizeLatestProbe,
} from "./instagram-provider.mjs";
import {
  loadInstagramQuota,
  saveInstagramQuota,
  canConsumeQuota,
  consumeQuota,
  maxLatestPostsPerAccount,
} from "./instagram-quota.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INBOX_PATH = resolve(__dirname, "../../../public/data/sources/inbox.jsonl");

function readInboxUrls(handle) {
  if (!existsSync(INBOX_PATH)) return [];
  const lines = readFileSync(INBOX_PATH, "utf8").split("\n").filter(Boolean);
  const out = [];
  for (const line of lines) {
    try {
      const row = JSON.parse(line);
      if (row.handle === handle || row.account === handle) out.push(String(row.url));
    } catch {
      /* skip */
    }
  }
  return out;
}

/**
 * oembed: probe من inbox فقط — لا سحب كامل إلا عند رابط جديد.
 * @param {import('../types.mjs').SourceAccount} account
 * @param {{ persistQuota?: boolean }} [opts]
 */
async function probeAndMaybeFetchOembed(account, opts = {}) {
  const persistQuota = opts.persistQuota !== false;
  const handle = String(account.handle || "").replace(/^@/, "");
  const out = {
    status: "unchanged",
    items: [],
    probeUsed: 0,
    fetchUsed: 0,
    latest: null,
    message: undefined,
  };

  let quota = loadInstagramQuota();
  const probeGate = canConsumeQuota(quota, "probe");
  if (!probeGate.ok) {
    out.status = "rate_limited";
    out.message = probeGate.detail || "rate_limited";
    return out;
  }

  consumeQuota(quota, "probe");
  out.probeUsed = 1;

  const urls = readInboxUrls(handle);
  if (persistQuota) saveInstagramQuota(quota);

  if (!urls.length) {
    out.status = "private_or_unavailable";
    out.message = "instagram skipped: empty inbox";
    return out;
  }

  // أحدث رابط في الصندوق (آخر سطر مطابق)
  const latestUrl = urls[urls.length - 1];
  const latestId = latestUrl.split("/").filter(Boolean).pop() || latestUrl;
  const latest = normalizeLatestProbe({ id: latestId, url: latestUrl });
  out.latest = latest;

  if (!latest?.id) {
    out.status = "provider_missing_latest_post_id";
    out.message = "provider_missing_latest_post_id";
    return out;
  }

  if (samePost(account, latest)) {
    out.status = "unchanged";
    return out;
  }

  const fetchGate = canConsumeQuota(quota, "fetch");
  if (!fetchGate.ok) {
    out.status = "rate_limited";
    out.message = fetchGate.detail || "rate_limited";
    return out;
  }

  consumeQuota(quota, "fetch");
  out.fetchUsed = 1;
  if (persistQuota) saveInstagramQuota(quota);

  // سحب oembed لهذا الرابط فقط عبر تمرير حساب بنسخة inbox مؤقتة — نعيد استخدام fetchViaOembed
  // عبر حساب مستنسخ لا يغيّر الملف: نمرّر عبر استدعاء مباشر محدود
  const items = await fetchViaOembed({ ...account, _inboxOverrideUrls: [latestUrl] });
  const limit = maxLatestPostsPerAccount();
  out.items = (items || []).slice(0, limit);
  out.status = out.items.length ? "new_post" : "provider_error";
  if (!out.items.length) out.message = "oembed_empty";
  return out;
}

/**
 * نقطة الدخول الموحّدة: probe ثم fetch مشروط.
 */
export async function harvestInstagramAccount(account, opts = {}) {
  const mode = getInstagramIngestMode();
  if (mode === "off") {
    return {
      status: "provider_error",
      items: [],
      probeUsed: 0,
      fetchUsed: 0,
      latest: null,
      message: "instagram skipped: mode=off",
    };
  }
  if (mode === "provider") return probeAndMaybeFetch(account, opts);
  return probeAndMaybeFetchOembed(account, opts);
}

/** @type {import('../types.mjs')} */
export const instagramAdapter = {
  id: "instagram",
  async fetch(account, since) {
    const mode = getInstagramIngestMode();
    if (mode === "off") return [];
    // المسار القديم عبر harvestInstagramAccount من run.mjs
    // يُبقى fetch للتوافق مع الاختبارات القديمة
    if (mode === "provider") return fetchViaProvider(account, since);
    const result = await harvestInstagramAccount(account, { persistQuota: true });
    return result.items;
  },
};

export {
  getInstagramIngestMode,
  getInstagramProviderStatus,
  probeAndMaybeFetch,
  samePost,
};
