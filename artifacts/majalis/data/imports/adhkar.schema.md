# Adhkar CSV / JSON import schema

استيراد الأذكار عبر **Content Import Engine** (`--type=adhkar`).

## Required columns

| Column | Arabic label | Notes |
|--------|--------------|-------|
| `text` | نص الذكر | Full dhikr text (required, non-empty) |
| `category` | التصنيف | Human-readable category name or slug (see aliases below) |
| `source` | المصدر | Hadith/source attribution (e.g. «رواه مسلم») |
| `count` **or** `repeat_count` | عدد التكرار | Positive integer — how many times to repeat |

At least one of `count` or `repeat_count` must be present. Both names are accepted for backward compatibility with spreadsheets exported from the database column `verified_adhkar_items.repeat_count`.

## Optional columns

| Column | Aliases | Notes |
|--------|---------|-------|
| `id` | — | Stable item id; auto-generated from text+category if omitted |
| `narrator` | — | Narrator name |
| `grade` | — | Hadith grade (e.g. صحيح، حسن) |
| `reference` | — | Book/chapter reference |
| `keywords` | — | JSON array in JSON files; pipe-separated in CSV if needed |

## Category aliases

The importer maps common Arabic/English labels to internal ids:

- `أذكار الصباح`, `صباح`, `morning` → `adh-morning`
- `أذكار المساء`, `مساء`, `evening` → `adh-evening`
- `أذكار النوم`, `نوم`, `sleep` → `adh-sleep`
- `بعد الصلاة`, `after-salah` → `adh-after-salah`
- Values starting with `adh-` are used as-is (e.g. `adh-morning`)

You may also supply `categoryId` or `category_id` instead of `category`.

## Source aliases

- `source_name` is accepted as an alias for `source`.

## Sample files

| File | Purpose |
|------|---------|
| `adhkar.sample.json` | Canonical JSON example (`count`) |
| `adhkar.sample.csv` | Canonical CSV example (`count`) |
| `adhkar.repeat-count.sample.csv` | Legacy CSV using `repeat_count` + `source_name` |

## CLI dry-run

```bash
cd artifacts/majalis
node scripts/import-content.mjs --type=adhkar --file=data/imports/adhkar.sample.csv --dry-run
node scripts/import-content.mjs --type=adhkar --file=data/imports/adhkar.repeat-count.sample.csv --dry-run
```

## Validation rules

1. All required fields must be non-empty after alias normalization.
2. `count` / `repeat_count` must be a positive number (≥ 1).
3. Invalid rows are rejected before any database write; fix the file and re-import.
