/**
 * بوابة — FullQuranDownloader (Capacitor/IndexedDB) بدل react-native-fs.
 * Run: node --import tsx src/lib/__tests__/full-quran-downloader-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

const downloader = read("src/lib/full-quran-downloader.ts");
assert.match(downloader, /class FullQuranDownloader/);
assert.match(downloader, /downloadReciter/);
assert.match(downloader, /pauseReciterDownload/);
assert.match(downloader, /deleteReciterDownloads/);
assert.doesNotMatch(downloader, /from ['"]react-native-fs|import RNFS|@notifee/i);

const core = read("src/lib/quran-audio-downloads.ts");
assert.match(core, /pauseReciterDownload/);
assert.match(core, /cancelReciterDownload/);
assert.match(core, /fetchSurahBlob/);
assert.match(core, /status: QuranDownloadStatus/);
assert.match(core, /downloadedMB/);
assert.doesNotMatch(core, /from ['"]react-native-fs|import RNFS|@notifee/i);

const ui = read("src/components/quran/ReciterDownloadManager.tsx");
assert.match(ui, /BulkDownloadCard/);
assert.match(ui, /FullQuranDownloader/);
assert.match(ui, /handlePause/);
assert.doesNotMatch(ui, /from ['"]react-native-fs|import RNFS|@notifee/i);

const card = read("src/components/quran/BulkDownloadCard.tsx");
assert.match(card, /bdm-card/);
assert.match(card, /تنزيل المصحف كاملاً/);
assert.match(card, /إيقاف مؤقت/);
assert.match(card, /Pause/);
assert.match(card, /Play/);
assert.match(card, /استئناف/);
assert.doesNotMatch(card, /react-native|TouchableOpacity|StyleSheet|ProgressBarAndroid/i);

console.log("full-quran-downloader-gate: ok");
