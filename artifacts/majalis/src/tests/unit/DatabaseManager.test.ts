/**
 * Unit — DatabaseManager persistence + schema migration safety.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Dexie, { type EntityTable } from "dexie";
import {
  CORE_QURAN_DB_NAME,
  CORE_QURAN_DB_VERSION,
  QuranCoreDatabase,
  DatabaseManager,
  getDatabaseManager,
  ACTIVE_READING_KHATMAH_ID,
  type KhatmahStore,
  type ReflectionsStore,
} from "@/core/quran";
import { deleteQuranEngineDb, freshDatabaseManager } from "../helpers/idb";

describe("DatabaseManager — persistence", () => {
  beforeEach(async () => {
    await deleteQuranEngineDb();
  });

  afterEach(async () => {
    await deleteQuranEngineDb();
  });

  it("initializes to the current schema version without throwing", async () => {
    const db = await freshDatabaseManager();
    const raw = db.getDb();
    expect(raw).toBeTruthy();
    expect(raw!.verno).toBe(CORE_QURAN_DB_VERSION);
    expect(raw!.tables.map((t) => t.name).sort()).toEqual(
      [
        "khatmah_store",
        "offline_assets_store",
        "outbox_sync_store",
        "quran_knowledge_store",
        "settings_store",
        "user_reflections_store",
      ].sort(),
    );
  });

  it("persists khatmah progress across reopen (no corruption)", async () => {
    const db = await freshDatabaseManager();
    const saved = await db.upsertKhatmah({
      id: ACTIVE_READING_KHATMAH_ID,
      title: "ختمة اختبار",
      type: "reading",
      current_surah: 2,
      current_ayah: 255,
      current_page: 42,
      daily_wird_target: 4,
      streak_days: 3,
    });
    expect(saved?.current_surah).toBe(2);
    expect(saved?.current_ayah).toBe(255);

    // Simulate app restart: close singleton, reopen same IDB name (do not delete).
    DatabaseManager.__resetInstanceForTests();
    const db2 = getDatabaseManager();
    expect(await db2.initialize()).toBe(true);
    const loaded = await db2.getKhatmah(ACTIVE_READING_KHATMAH_ID);
    expect(loaded).toMatchObject({
      id: ACTIVE_READING_KHATMAH_ID,
      current_surah: 2,
      current_ayah: 255,
      current_page: 42,
      daily_wird_target: 4,
      streak_days: 3,
      title: "ختمة اختبار",
      is_completed: false,
    });
  });

  it("upserts reflections and lists them by ayah index", async () => {
    const db = await freshDatabaseManager();
    const note = await db.upsertReflection({
      surah_id: 1,
      ayah_id: 1,
      note_text: "تأمّل افتتاحي",
      tags: ["test"],
      bookmark_color: "#B08D2E",
    });
    expect(note?.id).toBe("1:1");
    expect(note?.note_text).toBe("تأمّل افتتاحي");

    const listed = await db.getReflections(1, 1);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.tags).toContain("test");

    const recent = await db.listRecentReflections(3);
    expect(recent.some((r) => r.id === "1:1")).toBe(true);
  });

  it("aggregates dashboard stats from khatmah + daily counters", async () => {
    const db = await freshDatabaseManager();
    await db.upsertKhatmah({
      id: ACTIVE_READING_KHATMAH_ID,
      title: "ختمة",
      type: "reading",
      current_surah: 1,
      current_ayah: 1,
      current_page: 1,
      daily_wird_target: 5,
      streak_days: 7,
    });
    await db.recordDailyPageRead(1);
    await db.recordDailyPageRead(2);
    await db.recordDailyPageRead(2); // idempotent
    await db.addDailyReadingTimeMs(90_000);

    const stats = await db.getDashboardStats(ACTIVE_READING_KHATMAH_ID);
    expect(stats.streak_days).toBe(7);
    expect(stats.pages_read_today).toBe(2);
    expect(stats.total_time_ms).toBe(90_000);
    expect(stats.daily_wird_target).toBe(5);
    expect(stats.active_khatmah?.id).toBe(ACTIVE_READING_KHATMAH_ID);
  });

  it("updateKhatmahProgress bumps last_read_timestamp", async () => {
    const db = await freshDatabaseManager();
    await db.upsertKhatmah({
      id: "prog-1",
      title: "تقدّم",
      type: "reading",
      current_surah: 1,
      current_ayah: 1,
      current_page: 1,
      daily_wird_target: 1,
      streak_days: 0,
      last_read_timestamp: 1,
    });
    const updated = await db.updateKhatmahProgress("prog-1", {
      current_surah: 1,
      current_ayah: 7,
      current_page: 1,
    });
    expect(updated?.current_ayah).toBe(7);
    expect((updated?.last_read_timestamp ?? 0) > 1).toBe(true);
  });
});

describe("DatabaseManager — migrations", () => {
  const MIGRATE_DB = `${CORE_QURAN_DB_NAME}-migrate-test`;

  afterEach(async () => {
    try {
      await Dexie.delete(MIGRATE_DB);
    } catch {
      /* ignore */
    }
  });

  it("upgrades v1 → current without wiping khatmah/reflections", async () => {
    class V1Db extends Dexie {
      khatmah_store!: EntityTable<KhatmahStore, "id">;
      user_reflections_store!: EntityTable<ReflectionsStore, "id">;
      constructor() {
        super(MIGRATE_DB);
        this.version(1).stores({
          khatmah_store:
            "id, type, last_read_timestamp, is_completed, [type+is_completed], updated_at",
          user_reflections_store:
            "id, surah_id, ayah_id, [surah_id+ayah_id], sync_status, created_at, updated_at, *tags",
          offline_assets_store:
            "asset_id, type, download_status, reciter_id, surah_id, [type+reciter_id], [type+surah_id], updated_at",
          quran_knowledge_store: "ayah_key, *theme_ids, *similar_ayah_keys, updated_at",
          outbox_sync_store:
            "++id, client_mutation_id, status, created_at, entity_type, [status+created_at], entity_id",
        });
      }
    }

    const v1 = new V1Db();
    await v1.open();
    expect(v1.verno).toBe(1);
    await v1.khatmah_store.put({
      id: "migrate-khatmah",
      title: "قبل الترقية",
      type: "reading",
      current_surah: 18,
      current_ayah: 10,
      current_page: 294,
      daily_wird_target: 2,
      streak_days: 1,
      last_read_timestamp: Date.now(),
      is_completed: false,
    });
    await v1.user_reflections_store.put({
      id: "18:10",
      surah_id: 18,
      ayah_id: 10,
      note_text: "لا تُمس أثناء الترقية",
      tags: ["migrate"],
      created_at: Date.now(),
      sync_status: "pending",
    });
    v1.close();

    const upgraded = new QuranCoreDatabase(MIGRATE_DB);
    await upgraded.open();
    expect(upgraded.verno).toBe(CORE_QURAN_DB_VERSION);

    const khatmah = await upgraded.khatmah_store.get("migrate-khatmah");
    expect(khatmah?.title).toBe("قبل الترقية");
    expect(khatmah?.current_surah).toBe(18);
    expect(khatmah?.updated_at).toBeTypeOf("number");
    expect(khatmah?.revision).toBeTypeOf("number");

    const reflection = await upgraded.user_reflections_store.get("18:10");
    expect(reflection?.note_text).toBe("لا تُمس أثناء الترقية");
    expect(reflection?.tags).toContain("migrate");

    expect(upgraded.tables.some((t) => t.name === "settings_store")).toBe(true);
    upgraded.close();
  });
});
