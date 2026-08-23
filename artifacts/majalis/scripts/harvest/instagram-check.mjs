#!/usr/bin/env node
/**
 * تشخيص Instagram: جدول الحساب | آخر منشور محفوظ | آخر منشور عند المزود | الحالة
 * pnpm run harvest:instagram-check
 */
import { loadAccounts } from "./publish.mjs";
import {
  getInstagramIngestMode,
  getInstagramProviderStatus,
  harvestInstagramAccount,
} from "./adapters/instagram.mjs";

function pad(s, n) {
  const t = String(s ?? "");
  return t.length >= n ? t.slice(0, n) : t + " ".repeat(n - t.length);
}

async function main() {
  const mode = getInstagramIngestMode();
  const status = getInstagramProviderStatus();
  console.log(`instagram mode=${mode} configured=${status.configured} ${status.message || ""}`.trim());

  const accounts = loadAccounts().filter((a) => a.platform === "instagram" && a.enabled !== false);
  console.log(
    `${pad("الحساب", 28)} | ${pad("آخر محفوظ", 22)} | ${pad("آخر عند المزود", 22)} | الحالة`,
  );
  console.log("-".repeat(100));

  for (const account of accounts) {
    const saved = account.last_seen_post_id || account.last_seen_post_url || "—";
    let providerLatest = "—";
    let state = "provider_error";
    try {
      const result = await harvestInstagramAccount(account, { persistQuota: false });
      providerLatest = result.latest?.id || result.latest?.url || "—";
      state = result.status || "provider_error";
      if (result.message && state === "missing_secret") state = "missing_secret";
    } catch (err) {
      state = "provider_error";
      providerLatest = String(err?.message || err).slice(0, 22);
    }
    console.log(
      `${pad(account.handle || account.id, 28)} | ${pad(saved, 22)} | ${pad(providerLatest, 22)} | ${state}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
