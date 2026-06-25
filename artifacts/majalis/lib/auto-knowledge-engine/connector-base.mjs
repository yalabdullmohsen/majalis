/**
 * Base Connector — timeout, retry, rate limit, health check
 */

import { withRetry } from "./queue.mjs";
import { akeLog } from "./monitoring.mjs";

const rateLimitBuckets = new Map();

export class BaseConnector {
  constructor(config) {
    this.slug = config.slug;
    this.name = config.name;
    this.connectorType = config.connector_type || config.connectorType || "rss";
    this.officialUrl = config.official_url || config.officialUrl;
    this.feedUrl = config.feed_url || config.feedUrl;
    this.trustLevel = config.trust_level || config.trustLevel || 3;
    this.allowedKinds = config.allowed_kinds || config.allowedKinds || ["article"];
    this.timeoutMs = config.timeout_ms || config.timeoutMs || 15000;
    this.maxRetries = config.max_retries || config.maxRetries || 3;
    this.rateLimitPerMin = config.rate_limit_per_min || config.rateLimitPerMin || 10;
    this.autoPublish = config.auto_publish !== false;
    this.minQualityScore = config.min_quality_score || config.minQualityScore || 65;
    this.isActive = config.is_active !== false;
    this.id = config.id;
    this.apiConfig = config.api_config || config.apiConfig || {};
  }

  async rateLimitWait() {
    const now = Date.now();
    const bucket = rateLimitBuckets.get(this.slug) || [];
    const windowStart = now - 60_000;
    const recent = bucket.filter((t) => t > windowStart);
    if (recent.length >= this.rateLimitPerMin) {
      const wait = recent[0] + 60_000 - now;
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
    recent.push(now);
    rateLimitBuckets.set(this.slug, recent);
  }

  async fetchWithTimeout(url, options = {}) {
    await this.rateLimitWait();
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "MajlisIlmBot/2.0 (+https://majlisilm.com)",
        Accept: "application/json, application/xml, text/xml, */*",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    return response;
  }

  async healthCheck() {
    try {
      const url = this.feedUrl || this.officialUrl;
      if (!url) return { healthy: false, error: "no_url" };

      const response = await this.fetchWithTimeout(url, { method: "HEAD" }).catch(async () => {
        return this.fetchWithTimeout(url, { method: "GET" });
      });

      const healthy = response.ok || response.status === 405;
      return {
        healthy,
        statusCode: response.status,
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      return { healthy: false, error: err.message, checkedAt: new Date().toISOString() };
    }
  }

  async fetchItems() {
    throw new Error(`fetchItems not implemented for ${this.slug}`);
  }

  async run() {
    if (!this.isActive) {
      return { ok: true, skipped: true, reason: "inactive", items: [] };
    }

    return withRetry(
      async () => {
        akeLog("connector", { slug: this.slug, action: "fetch_start" });
        const items = await this.fetchItems();
        akeLog("connector", { slug: this.slug, action: "fetch_done", count: items.length });
        return { ok: true, items, connector: this.slug };
      },
      { maxAttempts: this.maxRetries, label: `connector:${this.slug}` },
    );
  }
}

export function trustScoreFromLevel(level) {
  return Math.min(100, Math.max(0, (level || 3) * 20));
}
