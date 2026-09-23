/**
 * وحدة AppStartupController — انتقالات الحالة.
 * تشغيل: node --import tsx src/lib/__tests__/app-startup-controller.test.ts
 */
import assert from "node:assert/strict";
import {
  APP_STARTUP_STATES,
  __resetAppStartupControllerForTests,
  enterBackgroundRefresh,
  exitBackgroundRefresh,
  getAppStartupState,
  isInteractive,
  isMinimumReady,
  notifyBootstrapping,
  notifyInteractive,
  notifyMinimumReady,
  notifyNativeLaunchEnded,
  reportFatalError,
  reportRecoverableError,
  retryAfterFatal,
  transitionAppStartup,
} from "../app-startup-controller";

__resetAppStartupControllerForTests();
assert.equal(getAppStartupState(), "NATIVE_LAUNCH");
assert.equal(APP_STARTUP_STATES.length, 7);

assert.equal(notifyNativeLaunchEnded("t"), true);
assert.equal(getAppStartupState(), "BOOTSTRAPPING");

assert.equal(notifyBootstrapping("again"), true);
assert.equal(getAppStartupState(), "BOOTSTRAPPING");

assert.equal(notifyMinimumReady("boot"), true);
assert.equal(getAppStartupState(), "MINIMUM_READY");
assert.equal(isMinimumReady(), true);
assert.equal(isInteractive(), false);

assert.equal(notifyInteractive("shell"), true);
assert.equal(getAppStartupState(), "INTERACTIVE");
assert.equal(isInteractive(), true);

assert.equal(enterBackgroundRefresh("sw"), true);
assert.equal(getAppStartupState(), "BACKGROUND_REFRESH");
assert.equal(exitBackgroundRefresh("done"), true);
assert.equal(getAppStartupState(), "INTERACTIVE");

assert.equal(reportRecoverableError("toast"), true);
assert.equal(getAppStartupState(), "RECOVERABLE_ERROR");
assert.equal(isMinimumReady(), true);

assert.equal(notifyInteractive("recover"), true);
assert.equal(getAppStartupState(), "INTERACTIVE");

assert.equal(reportFatalError("boom"), true);
assert.equal(getAppStartupState(), "FATAL_ERROR");
assert.equal(retryAfterFatal(), true);
assert.equal(getAppStartupState(), "BOOTSTRAPPING");

// رفض انتقال غير مسموح
assert.equal(transitionAppStartup("INTERACTIVE", "skip"), false);
assert.equal(getAppStartupState(), "BOOTSTRAPPING");

console.log("app-startup-controller.test.ts: ok");
