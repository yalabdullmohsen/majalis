# Quran Engine Offline Storage Schema

Dexie.js IndexedDB layer for Ayah/Tarteel-grade offline interactions.
**No UI / layout changes** — data access only.

## Database

| | |
|--|--|
| Name | `majalis-quran-engine-db` |
| Version | `2` (v1→v2 additive lifecycle fields; upgrades never wipe) |
| Engine | Dexie `^4.4.4` |

## Stores & indexes

### 1. `khatmah_store`
Multiple concurrent reading / memorization profiles.

| Field | Notes |
|-------|--------|
| `id` | PK |
| `title`, `type` (`reading` \| `memorization`) | |
| `current_surah`, `current_ayah`, `current_page` | |
| `daily_wird_target`, `streak_days` | |
| `last_read_timestamp`, `is_completed` | |
| `revision`, `updated_at` | LWW merge |

**Indexes:** `type`, `last_read_timestamp`, `is_completed`, `[type+is_completed]`, `updated_at`

### 2. `user_reflections_store`
Ayah / word notes, voice memos, colored bookmarks.

| Field | Notes |
|-------|--------|
| `id` | PK (`s:a` or `s:a:wN`) |
| `surah_id`, `ayah_id`, `word_index?` | |
| `note_text`, `audio_memo_blob?`, `bookmark_color?` | |
| `tags[]`, `created_at`, `sync_status` | `pending` \| `synced` |

**Indexes:** `[surah_id+ayah_id]` (page-render lookup), `sync_status`, `*tags`, `created_at`

### 3. `quran_knowledge_store`
Flattened mutashabihat + thematic graph.

| Field | Notes |
|-------|--------|
| `ayah_key` | PK (`s:a`) |
| `similar_ayah_keys[]` | |
| `theme_ids[]` | |

**Indexes:** `*theme_ids`, `*similar_ayah_keys` — O(1) get by PK; no JSON parse on render.

### 4. `offline_assets_store`
Lifecycle for audio / tafseer / fonts.

| Field | Notes |
|-------|--------|
| `asset_id` | PK |
| `type` | `audio_surah` \| `tafseer_db` \| `font_cache` \| … |
| `reciter_id?`, `surah_id?` | |
| `download_status` | `pending` \| `downloading` \| `completed` \| `failed` |
| `file_reference` | Blob \| OPFS path \| legacy IDB pointer |
| `size_bytes` | |

**Indexes:** `[type+reciter_id]`, `[type+surah_id]`, `download_status`

### 5. `outbox_sync_store`
Durable mutation log (outbox pattern).

| Field | Notes |
|-------|--------|
| `id` | Auto-increment PK |
| `client_mutation_id` | Idempotency key |
| `entity_type`, `entity_id`, `operation` | |
| `payload`, `created_at`, `status`, `attempts` | |

**Indexes:** `[status+created_at]` — chronological drain of `pending` rows → `POST /api/reading-sync` `{ kind: "quran-outbox-batch" }`.

## Performance benefits

| Operation | Strategy | Benefit |
|-----------|----------|---------|
| Page ayah badges | `[surah_id+ayah_id]` | Sub-ms lookups per ayah on a page |
| Mutashabihat / themes | PK `ayah_key` | Zero JSON parse after warm |
| Multi-profile khatmah | `[type+is_completed]` | Fast active-profile lists |
| Offline audio inventory | `[type+reciter_id]` | Instant download status UI feed |
| Multi-device sync | Outbox chronological + mutation ids | No silent overwrites; reconnect-safe |

## Migrations

`migrateLegacyQuranOfflineData()` (idle-boot):

- LS khatmah / notes / bookmarks → stores
- `majalis-tadabbur` → reflections (if present)
- Mutashabihat index + `QURAN_TOPICS` → knowledge
- `majalis-quran-audio` keys → asset meta (pointer, not blob copy)

Legacy sources are **never deleted**. Flag: `mj-quran-offline-schema-migrated-v1`.

`idb-self-heal` deliberately **does not** purge `majalis-quran-engine-db`.

## Boot

`startQuranOfflineStorage()` from `platform-logic-bootstrap` + outbox drain on `online` in `offline-sync-bootstrap`.

## API

```ts
import {
  upsertKhatmahProfile,
  upsertReflection,
  getReflectionsForAyah,
  getSimilarAyahKeysCached,
  registerSurahAudioAsset,
  drainQuranOutbox,
} from "@/lib/quran-offline";
```
