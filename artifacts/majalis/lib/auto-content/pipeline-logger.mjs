/**
 * Structured pipeline logger — console + DB audit trail
 */

export function createPipelineLogger(runId = null) {
  const logs = [];
  const started = Date.now();

  function log(step, message, meta = {}) {
    const entry = {
      step,
      message,
      at: new Date().toISOString(),
      elapsed_ms: Date.now() - started,
      ...meta,
    };
    logs.push(entry);
    console.info(`[auto-content:${step}] ${message}`, meta.detail ? JSON.stringify(meta.detail) : "");
    return entry;
  }

  function error(step, message, meta = {}) {
    return log(step, message, { ...meta, level: "error" });
  }

  function warn(step, message, meta = {}) {
    return log(step, message, { ...meta, level: "warn" });
  }

  return {
    runId,
    logs,
    log,
    error,
    warn,
    started,
    elapsed: () => Date.now() - started,
    summary() {
      return {
        runId,
        durationMs: Date.now() - started,
        logCount: logs.length,
        logs,
      };
    },
  };
}

export const SKIP_REASONS = {
  DUPLICATE: "Duplicate Content",
  NO_SOURCES: "No Sources",
  NO_RSS: "No RSS",
  NO_NEW_ARTICLES: "No New Articles",
  SOURCE_VERIFY_FAILED: "Source Verification Failed",
  INVALID_FEED: "Invalid Feed",
  TIMEOUT: "Timeout",
  BLOCKED: "Blocked By Robots",
  AUTH_FAILED: "Authentication Failed",
  LOW_QUALITY: "Quality Below Threshold",
  FETCH_FAILED: "Fetch Failed",
};
