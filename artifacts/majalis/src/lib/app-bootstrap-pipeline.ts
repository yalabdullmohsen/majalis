/**
 * خط أنابيب إقلاع سُنّة — مراحل قابلة للعزل مع تسجيل زمني.
 * لا تمنع المراحل غير الحرجة ظهور أول شاشة مفيدة.
 */
export type BootstrapStageId =
  | "loadRuntimeConfiguration"
  | "loadLocalPreferences"
  | "applyTheme"
  | "initializeDatabase"
  | "runMigrations"
  | "openLocalContent"
  | "restoreAuthentication"
  | "loadFeatureFlags"
  | "initializeRouteRegistry"
  | "initializeContentResolver"
  | "initializeSearchIndex"
  | "scheduleBackgroundServices"
  | "initializeAudioServices"
  | "showFirstUsefulScreen"
  | "refreshRemoteDataInBackground";

export type BootstrapStageStatus = "pending" | "started" | "ok" | "failed" | "skipped";

export type BootstrapStageRecord = {
  id: BootstrapStageId;
  startedAt: number | null;
  completedAt: number | null;
  durationMs: number | null;
  status: BootstrapStageStatus;
  errorCode: string | null;
  blocking: boolean;
  fallbackUsed: boolean;
};

export const BLOCKING_BOOTSTRAP_STAGES: readonly BootstrapStageId[] = [
  "loadRuntimeConfiguration",
  "loadLocalPreferences",
  "applyTheme",
  "initializeRouteRegistry",
  "showFirstUsefulScreen",
] as const;

const stages = new Map<BootstrapStageId, BootstrapStageRecord>();

function now() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function ensure(id: BootstrapStageId, blocking: boolean): BootstrapStageRecord {
  let row = stages.get(id);
  if (!row) {
    row = {
      id,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      status: "pending",
      errorCode: null,
      blocking,
      fallbackUsed: false,
    };
    stages.set(id, row);
  }
  return row;
}

export function beginBootstrapStage(id: BootstrapStageId, blocking = BLOCKING_BOOTSTRAP_STAGES.includes(id)) {
  const row = ensure(id, blocking);
  row.startedAt = now();
  row.status = "started";
  row.errorCode = null;
  row.fallbackUsed = false;
  row.completedAt = null;
  row.durationMs = null;
  return row;
}

export function completeBootstrapStage(id: BootstrapStageId, fallbackUsed = false) {
  const row = ensure(id, BLOCKING_BOOTSTRAP_STAGES.includes(id));
  row.completedAt = now();
  row.durationMs = row.startedAt != null ? row.completedAt - row.startedAt : null;
  row.status = "ok";
  row.fallbackUsed = fallbackUsed;
  return row;
}

export function failBootstrapStage(id: BootstrapStageId, errorCode: string, fallbackUsed = false) {
  const row = ensure(id, BLOCKING_BOOTSTRAP_STAGES.includes(id));
  row.completedAt = now();
  row.durationMs = row.startedAt != null ? row.completedAt - row.startedAt : null;
  row.status = "failed";
  row.errorCode = errorCode;
  row.fallbackUsed = fallbackUsed;
  return row;
}

export function getBootstrapSnapshot() {
  return Array.from(stages.values());
}

export function getFailedBlockingStages() {
  return getBootstrapSnapshot().filter((s) => s.blocking && s.status === "failed");
}

declare global {
  interface Window {
    __SUNNAH_BOOTSTRAP__?: {
      stages: BootstrapStageRecord[];
      safeMode: boolean;
    };
  }
}

export function publishBootstrapDebug(safeMode: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.__SUNNAH_BOOTSTRAP__ = {
      stages: getBootstrapSnapshot(),
      safeMode,
    };
  } catch {
    /* ignore */
  }
}
