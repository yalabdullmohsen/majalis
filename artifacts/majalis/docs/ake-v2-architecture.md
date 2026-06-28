# AKE v2.0 — Multi-Source Auto Knowledge Engine

## Architecture

AKE v2 extends the existing v13–v15 pipeline with plugin-based connectors, unified cross-source deduplication, entity linking, and content lifecycle management.

### Pipeline

```
Source → Fetch → Normalize → Duplicate Detection → AI Extraction →
Entity Linking → Quality Validation → Publishing → Search Index →
Cache Refresh → Analytics
```

### Connector plugins

| Type | Class | Strategy |
|------|-------|----------|
| `rss` | RssConnector | Conditional GET + incremental cursor |
| `website` | WebsiteConnector | RSS → sitemap.xml → HTML fallback |
| `html` | HtmlConnector | OG/metadata page scrape |
| `sitemap` | SitemapConnector | sitemap.xml URL discovery |
| `instagram` | InstagramConnector | Graph API → OG tags (Phase 7) |
| `youtube` | YoutubeConnector | OG metadata only (no fabricated transcripts) |
| `telegram` | TelegramConnector | Bot API or t.me OG preview |
| `x`, `facebook`, `whatsapp` | SocialWebConnector | OG metadata |

Add a new source: insert row in `ake_connectors` with `plugin_id` — no code change required when plugin exists.

### Unified dedup

`ake_unified_fingerprints` deduplicates the same lesson announced on 10 Instagram accounts + 5 websites into **one record** with multiple source attributions in `ake_content_sources`.

Source priority (lower = higher trust):

1. Official website
2. Scholar account
3. Mosque account
4. Course account
5. Ministry
6. Association
7. Aggregator/repost

### Lifecycle

`ake_content_changes` tracks created/updated/cancelled/expired. Cancelled lessons set `lifecycle_status = cancelled` without deletion.

### Cron

Default: `*/15 * * * *` — configurable via `ake_v2_settings.cron_interval_minutes` and admin dashboard.

### Migration

```bash
GET /api/cron/apply-migrations?scope=ake-v2
```

### Verification

```bash
pnpm --filter @workspace/majalis run verify:ake-v2
```

## Key paths

- `lib/auto-knowledge-engine/v2/` — v2 modules
- `lib/auto-knowledge-engine/connectors/` — connector plugins
- `supabase/auto_knowledge_engine_v16_v2.sql` — schema + Instagram seed
- Admin: `/admin?section=knowledge-engine`
