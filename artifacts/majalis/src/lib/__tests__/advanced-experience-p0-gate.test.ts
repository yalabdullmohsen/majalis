/**
 * بوابة سلامة P0 — محرّك مزامنة موحّد + عزل حسابات + روابط عميقة + استعادة.
 * node --import tsx src/lib/__tests__/advanced-experience-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SYNC_ENTITY_KINDS,
  __resetSyncLocalStoreForTests,
  applyRemoteRecord,
  bootstrapSyncEngine,
  enqueueSyncRecord,
  getSyncEngineStatus,
  isBlockedShareHost,
  isSuspiciousMushafJump,
  mapShareOrDeepLink,
  planRecovery,
  resolveSyncConflict,
  runSyncMigrations,
  stopSyncAndClearScope,
  activeSyncScope,
  GUEST_SCOPE,
} from "@/lib/sync-engine";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "src/lib/sync-engine/engine.ts")));
assert.ok(existsSync(resolve(root, "src/lib/sync-engine/conflict-policy.ts")));
assert.ok(SYNC_ENTITY_KINDS.includes("mushaf_position"));
assert.ok(SYNC_ENTITY_KINDS.includes("note"));

__resetSyncLocalStoreForTests();
const mig = runSyncMigrations();
assert.equal(mig.to, 1);

bootstrapSyncEngine(null);
assert.equal(getSyncEngineStatus().scopeId, GUEST_SCOPE);

const a = enqueueSyncRecord({
  kind: "mushaf_position",
  entityId: "last",
  payload: { page: 10 },
  updatedAt: "2026-01-01T00:00:00.000Z",
});
assert.equal(a.payload.page, 10);

// قفز مريب خلال نافذة قصيرة — لا يستبدل
const kept = enqueueSyncRecord({
  kind: "mushaf_position",
  entityId: "last",
  payload: { page: 200 },
  updatedAt: "2026-01-01T00:00:03.000Z",
});
assert.equal(kept.payload.page, 10);
assert.ok(isSuspiciousMushafJump(10, 200, 3000));

// ملاحظة متعارضة → keep_both
const n1 = enqueueSyncRecord({
  kind: "note",
  entityId: "n1",
  payload: { text: "نسخة أ" },
  updatedAt: "2026-01-02T00:00:00.000Z",
  scopeId: "user:u1",
});
const remoteNote = {
  ...n1,
  payload: { text: "نسخة ب" },
  updatedAt: "2026-01-02T00:00:01.000Z",
  version: n1.version + 1,
  opId: "remote_note",
};
const decision = resolveSyncConflict(n1, remoteNote);
assert.equal(decision.action, "keep_both");
const applied = applyRemoteRecord(remoteNote);
assert.ok(applied.entityId.includes("__remote_") || applied.payload.text === "نسخة ب");

// لا يستبدل الأحدث بالأقدم
const newer = enqueueSyncRecord({
  kind: "favorite",
  entityId: "h1",
  payload: { on: true },
  updatedAt: "2026-02-01T00:00:00.000Z",
  scopeId: "user:u1",
});
const olderRemote = {
  ...newer,
  payload: { on: false },
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
  opId: "old",
};
const d2 = resolveSyncConflict(newer, olderRemote);
assert.equal(d2.action, "keep_local");

stopSyncAndClearScope(activeSyncScope("u1"));
assert.ok(planRecovery("sync", 1).retry);
assert.ok(planRecovery("assistant", 1).userMessageAr.includes("بحث"));

assert.equal(isBlockedShareHost("https://staging.example.com/x"), true);
assert.equal(mapShareOrDeepLink("https://evil.example/mushaf").ok, false);
assert.equal(mapShareOrDeepLink("/mushaf?page=50").ok, true);
assert.equal(mapShareOrDeepLink("content://quran_page/50").path, "/mushaf?page=50");

const auth = read("src/components/AuthProvider.tsx");
assert.match(auth, /isolateAccountOnLogout/);
assert.match(auth, /bootstrapSyncEngine/);

const clear = read("src/lib/clear-user-local-data.ts");
assert.match(clear, /majalis-sync-schema-v|majalis-kp-activity-v1/);

console.log("advanced-experience-p0-gate.test.ts: ok");
