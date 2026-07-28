/**
 * Quran Engine core — functional backend architecture (no UI).
 *
 * Communication:
 *   QuranEngineContext  →  owns page/verse/audio state; notifies subscribers
 *         │                      and asks DatabaseManager for knowledge touches
 *         ├── DatabaseManager → Dexie async CRUD (Khatmah / Reflections / Assets)
 *         │         └── IndexingService (Web Workers) for mutashabihat flatten
 *         └── ResourceManager → LRU budget + memory pressure; can suspend
 *                   IndexingService / prefetch via lifecycle flags
 */
export { getQuranEngineContext, type QuranEngineContextApi, type ActiveVerse, type AudioSnapshot } from "@/core/quran/QuranEngineContext";
export { DatabaseManager, getDatabaseManager } from "@/core/quran/DatabaseManager";
export { ResourceManager, getResourceManager } from "@/core/quran/ResourceManager";
export { IndexingService, getIndexingService } from "@/core/quran/IndexingService";
export { startQuranCore } from "@/core/quran/bootstrap";
