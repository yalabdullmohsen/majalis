/**
 * بوابة — UnifiedAppEngine (Capacitor) بدل react-native-fs / Notifee.
 * Run: node --import tsx src/lib/__tests__/unified-app-engine-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

const engine = read("src/lib/unified-app-engine.ts");
assert.match(engine, /class UnifiedAppEngine/);
assert.match(engine, /deployAllServices/);
assert.match(engine, /syncUserProgressOfflineFirst/);
assert.match(engine, /startUnifiedAppEngine/);
assert.match(engine, /flushOutbox/);
assert.match(engine, /enqueueOutbox/);
assert.match(engine, /majalis:download-resume-hint/);
assert.doesNotMatch(engine, /from ['"]react-native-fs|import RNFS|@notifee/i);

const bootstrap = read("src/lib/platform-logic-bootstrap.ts");
assert.match(bootstrap, /startUnifiedAppEngine/);

const downloads = read("src/lib/quran-audio-downloads.ts");
assert.match(downloads, /setDownloadResumeHint/);
assert.match(downloads, /resolveDownloadResumeHint/);
assert.match(downloads, /clearDownloadResumeHint/);

const hybrid = read("src/lib/hybrid-sync-handlers.ts");
assert.match(hybrid, /quran_surah/);
assert.match(hybrid, /offline-player/);

const ui = read("src/components/quran/ReciterDownloadManager.tsx");
assert.match(ui, /resolveDownloadResumeHint/);
assert.match(ui, /majalis:download-resume-hint/);

console.log("unified-app-engine-gate: ok");
