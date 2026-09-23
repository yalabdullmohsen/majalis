/**
 * بوابة Startup PR-1: AppStartupController مصدر حقيقة واحد.
 * تشغيل: node --import tsx src/lib/__tests__/startup-pr1-controller-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const controllerPath = resolve(majalisRoot, "src/lib/app-startup-controller.ts");
assert.ok(existsSync(controllerPath), "app-startup-controller.ts مطلوب");

const controller = readPkg("src/lib/app-startup-controller.ts");
for (const s of [
  "NATIVE_LAUNCH",
  "BOOTSTRAPPING",
  "MINIMUM_READY",
  "INTERACTIVE",
  "BACKGROUND_REFRESH",
  "RECOVERABLE_ERROR",
  "FATAL_ERROR",
]) {
  assert.match(controller, new RegExp(`"${s}"`));
}
assert.match(controller, /transitionAppStartup/);
assert.match(controller, /notifyMinimumReady/);
assert.match(controller, /notifyInteractive/);
assert.match(controller, /dataset\[APP_STARTUP_DATASET_KEY\]|dataset\.appStartupState|APP_STARTUP_DATASET_KEY/);
assert.doesNotMatch(controller, /setTimeout\s*\(\s*[^)]*transitionAppStartup/);
assert.doesNotMatch(controller, /location\.reload|safeLocationReload/);

const main = readPkg("src/main.tsx");
assert.match(main, /notifyBootstrapping/);
assert.match(main, /reportFatalError/);
assert.match(main, /from ["'].*app-startup-controller["']/);

const boot = readPkg("src/lib/boot-readiness.ts");
assert.match(boot, /notifyMinimumReady/);

const shell = readPkg("src/lib/app-shell-stability.ts");
assert.match(shell, /notifyInteractive/);

const splash = readPkg("src/lib/splash-screen.ts");
assert.match(splash, /notifyNativeLaunchEnded/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:startup-pr1"/);

const index = readRepo("docs/REPO_INDEX.md");
assert.match(index, /app-startup-controller|Startup PR-1|AppStartupController/);

const report = readRepo("docs/performance/STARTUP_ROOT_CAUSE_REPORT.md");
assert.match(report, /PR-1|AppStartupController/);

console.log("startup-pr1-controller-gate.test.ts: ok");
