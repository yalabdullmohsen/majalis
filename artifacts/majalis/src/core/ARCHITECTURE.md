# Quran Engine — architecture scaffold

App root: `artifacts/majalis/src/`

## DatabaseManager (implemented)

Dexie DB `majalis-quran-app-db` v1:

| Table | Purpose |
|-------|---------|
| `settings` | preferences (`isTajweedEnabled`, …) |
| `progress` | `lastSurah` / `lastAyah` / `lastPage` |
| `bookmarks` | ayah bookmarks + note |
| `tafseer_cache` | offline tafsir by `ayahId` + `source` |

Singleton: `import { databaseManager } from "@/core/quran"`

```bash
npx tsx src/tests/core-engine.sample.test.ts
npx tsx src/tests/database-manager.test.ts   # needs fake-indexeddb
```
