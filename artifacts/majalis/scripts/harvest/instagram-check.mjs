#!/usr/bin/env node
/**
 * تشخيص Instagram: جدول الحساب | آخر منشور محفوظ | آخر منشور عند المزود | الحالة
 * pnpm run harvest:instagram-check
 * pnpm run harvest:instagram-check -- --handle nebraas_kw
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

function parseHandleArg(argv) {
  const i = argv.indexOf("--handle");
  if (i >= 0 && argv[i + 1]) return String(argv[i + 1]).replace(/^@/, "").trim();
  const eq = argv.find((a) => a.startsWith("--handle="));
  if (eq) return eq.slice("--handle=".length).replace(/^@/, "").trim();
  return null;
}

async function main() {
  const handleFilter = parseHandleArg(process.argv.slice(2));
  const mode = getInstagramIngestMode();
  const status = getInstagramProviderStatus();
  console.log(`instagram mode=${mode} configured=${status.configured} ${status.message || ""}`.trim());
  if (handleFilter) console.log(`filter handle=${handleFilter}`);

  let accounts = loadAccounts().filter((a) => a.platform === "instagram" && a.enabled !== false);
  if (handleFilter) {
    accounts = accounts.filter((a) => String(a.handle || "").replace(/^@/, "") === handleFilter);
    if (!accounts.length) {
      console.error(`لا حساب إنستغرام مطابق للـhandle=${handleFilter}`);
      process.exit(1);
    }
  }

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
      if (result.message && (state === "missing_secret" || state === "skipped_provider_404")) {
        state = result.status;
      }
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
