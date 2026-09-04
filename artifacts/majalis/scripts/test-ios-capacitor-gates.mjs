#!/usr/bin/env node
/**
 * Static iOS/Capacitor gates — runnable on Linux CI without Xcode.
 * Does NOT archive or publish to TestFlight.
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iosApp = join(root, "ios", "App");

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

console.log("=== iOS Capacitor static gates ===\n");

const plist = readFileSync(join(iosApp, "App", "Info.plist"), "utf8");
ok(plist.includes("<key>CFBundleURLTypes</key>"), "CFBundleURLTypes present");
ok(plist.includes("<string>majlisilm</string>"), "CFBundleURLSchemes includes majlisilm");
ok(plist.includes("UIBackgroundModes"), "UIBackgroundModes declared");
ok(plist.includes("<string>audio</string>"), "background audio mode");
ok(
  plist.includes("NSAllowsArbitraryLoads") && /NSAllowsArbitraryLoads<\/key>\s*<false\/>/s.test(plist),
  "ATS NSAllowsArbitraryLoads=false",
);

const pbx = readFileSync(join(iosApp, "App.xcodeproj", "project.pbxproj"), "utf8");
const privacyBuildFiles = (pbx.match(/\/\* PrivacyInfo\.xcprivacy in Resources \*\/ = \{isa = PBXBuildFile/g) || []).length;
ok(privacyBuildFiles === 1, `PrivacyInfo.xcprivacy PBXBuildFile exactly once (got ${privacyBuildFiles})`);
const playbackBuildFiles = (pbx.match(/\/\* MajlisPlaybackAudioPlugin\.swift in Sources \*\/ = \{isa = PBXBuildFile/g) || []).length;
ok(playbackBuildFiles === 1, `MajlisPlaybackAudioPlugin.swift PBXBuildFile exactly once (got ${playbackBuildFiles})`);
ok(
  /504EC3001FED79650016851F \/\* Sources \*\/ = \{[\s\S]*MajlisPlaybackAudioPlugin\.swift in Sources[\s\S]*?\};/.test(pbx),
  "MajlisPlaybackAudioPlugin listed under App target Sources",
);
ok(
  /504EC3021FED79650016851F \/\* Resources \*\/ = \{[\s\S]*PrivacyInfo\.xcprivacy in Resources[\s\S]*?\};/.test(pbx),
  "PrivacyInfo listed under App target Resources",
);

const deployTargets = [...pbx.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([0-9.]+);/g)].map((m) => m[1]);
ok(deployTargets.length > 0, "deployment targets present");
ok(
  deployTargets.every((t) => t === "16.2"),
  `all deployment targets are 16.2 (got ${[...new Set(deployTargets)].join(",")})`,
);

ok(existsSync(join(iosApp, "App", "PrivacyInfo.xcprivacy")), "PrivacyInfo.xcprivacy file exists");
ok(existsSync(join(iosApp, "App", "MajlisPlaybackAudioPlugin.swift")), "MajlisPlaybackAudioPlugin.swift exists");

const pluginSwift = readFileSync(join(iosApp, "App", "MajlisPlaybackAudioPlugin.swift"), "utf8");
ok(pluginSwift.includes("CAPBridgedPlugin"), "plugin conforms to CAPBridgedPlugin");
ok(pluginSwift.includes('jsName = "MajlisPlaybackAudio"'), "plugin jsName MajlisPlaybackAudio");
ok(pluginSwift.includes("enablePlayback"), "enablePlayback method");
ok(pluginSwift.includes("enableRecording"), "enableRecording method");
ok(pluginSwift.includes("deactivate"), "deactivate method");
ok(pluginSwift.includes("interruptionNotification"), "handles audio interruptions");
ok(pluginSwift.includes("routeChangeNotification"), "handles route changes");
ok(!/try\?/.test(pluginSwift), "plugin does not swallow errors with try?");
ok(!/call\.resolve\(\[\]\)/.test(pluginSwift), "plugin does not resolve empty on failure");
ok(pluginSwift.includes("AUDIO_SESSION_FAILED"), "playback rejects with AUDIO_SESSION_FAILED code");
ok(pluginSwift.includes("mediaServicesWereResetNotification"), "playback observes media services reset");

// حذف تام لميزة التسميع بالذكاء الاصطناعي — افحص الإزالة، لا تقرأ ملفات محذوفة
ok(!existsSync(join(iosApp, "App", "MajlisSpeechRecognitionPlugin.swift")), "speech recognition plugin removed");
ok(!existsSync(join(iosApp, "App", "RecitationAudioCapturePlugin.swift")), "recitation capture plugin removed");
ok(
  !existsSync(join(root, "src", "lib", "plugins", "speech-recognition.ts")),
  "JS speech-recognition bridge removed",
);
ok(
  !existsSync(
    join(root, "android", "app", "src", "main", "java", "com", "majlisilm", "app", "MajlisSpeechRecognitionPlugin.kt"),
  ),
  "Android speech recognition plugin removed",
);
ok(!plist.includes("NSSpeechRecognitionUsageDescription"), "Info.plist has no speech recognition usage");
ok(!plist.includes("NSMicrophoneUsageDescription"), "Info.plist has no microphone usage (AI recitation removed)");
ok(!pbx.includes("MajlisSpeechRecognitionPlugin.swift"), "pbxproj has no speech plugin");
ok(!pbx.includes("RecitationAudioCapturePlugin.swift"), "pbxproj has no capture plugin");
ok(!pbx.includes("MajlisSpeechRecognition"), "pbxproj has no MajlisSpeechRecognition symbol");

// منع تكرار خلل f9995028: حذف التعريف مع بقاء استخدام المتغير
{
  const gateSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
  // ابْنِ النمط دون كتابة المعرّف متبوعًا بـ .includes في المصدر (حتى لا يطابق الفحص نفسه)
  const usesVarMethod = (name) => new RegExp(String.raw`\b${name}\s*\.\s*includes\b`).test(gateSrc);
  ok(!/\bconst\s+speechSwift\b/.test(gateSrc), "gate must not declare speechSwift");
  ok(!usesVarMethod("speechSwift"), "gate must not call methods on speechSwift");
  ok(!/\bconst\s+captureSwift\b/.test(gateSrc), "gate must not declare captureSwift");
  ok(!usesVarMethod("captureSwift"), "gate must not call methods on captureSwift");
  ok(!/\bconst\s+speechJs\b/.test(gateSrc), "gate must not declare speechJs");
  ok(
    !/readFileSync\([^\n]*MajlisSpeechRecognitionPlugin\.swift/.test(gateSrc),
    "gate must not readFileSync deleted speech plugin",
  );
  ok(
    !/readFileSync\([^\n]*RecitationAudioCapturePlugin\.swift/.test(gateSrc),
    "gate must not readFileSync deleted capture plugin",
  );
  ok(
    !/readFileSync\([^\n]*speech-recognition\.ts/.test(gateSrc),
    "gate must not readFileSync deleted JS speech bridge",
  );
}

const privacy = readFileSync(join(iosApp, "App", "PrivacyInfo.xcprivacy"), "utf8");
ok(privacy.includes("NSPrivacyTracking"), "PrivacyInfo declares tracking key");
ok(/NSPrivacyTracking<\/key>\s*<false\/>/s.test(privacy), "PrivacyInfo tracking=false");
ok(privacy.includes("NSPrivacyAccessedAPICategoryUserDefaults"), "PrivacyInfo declares UserDefaults API reason");
ok(
  !privacy.includes("NSPrivacyAccessedAPICategoryDiskSpace") &&
    !privacy.includes("NSPrivacyAccessedAPICategorySystemBootTime"),
  "PrivacyInfo does not invent unused Required Reason APIs",
);

const live = readFileSync(
  join(iosApp, "PrayerLiveActivity", "PrayerLiveActivityLiveActivity.swift"),
  "utf8",
);
ok(
  live.includes("https://www.ssunnah.com/prayer-times"),
  "Live Activity widgetURL uses https universal link on www.ssunnah.com",
);

const entitlements = readFileSync(join(iosApp, "App", "App.entitlements"), "utf8");
ok(entitlements.includes("applinks:majlisilm.com"), "associated domains applinks");
ok(entitlements.includes("applinks:www.ssunnah.com"), "associated domains include production host");
ok(entitlements.includes("applinks:ssunnah.com"), "associated domains include ssunnah apex");

const deepLink = readFileSync(join(root, "src", "lib", "native-deep-link.ts"), "utf8");
ok(deepLink.includes("majlisilm"), "native-deep-link handles custom scheme");
ok(deepLink.includes("TRUSTED_HTTPS_HOSTS"), "native-deep-link trusts only majlisilm hosts");

const mainTsx = readFileSync(join(root, "src", "main.tsx"), "utf8");
ok(mainTsx.includes("resolveNativeDeepLinkPath"), "main.tsx wires deep-link resolver");
ok(
  !/ensureNativePlaybackAudioSession\(\)/.test(mainTsx),
  "main.tsx does not activate AVAudioSession at launch",
);

const playbackTs = readFileSync(join(root, "src", "lib", "native-playback-audio.ts"), "utf8");
ok(playbackTs.includes("ensureNativeRecordingAudioSession"), "JS bridge exposes recording mode");
ok(playbackTs.includes("deactivateNativeAudioSession"), "JS bridge exposes deactivate");

const audioEngine = readFileSync(join(root, "src", "core", "audio", "AudioEngine.ts"), "utf8");
ok(audioEngine.includes("activatePlaybackSession"), "AudioEngine activates session before play");
ok(audioEngine.includes("releasePlaybackSession"), "AudioEngine releases session on stop");

const ayahPlayer = readFileSync(join(root, "src", "hooks", "useAyahPlayer.ts"), "utf8");
ok(ayahPlayer.includes("ensureNativePlaybackAudioSession"), "useAyahPlayer activates native playback session");
ok(ayahPlayer.includes("deactivateNativeAudioSession"), "useAyahPlayer deactivates native session on stop");

// UUID sanity: PBX ids are 24 hex chars
const idRe = /\b([0-9A-Fa-f]{24})\b/g;
const ids = [...pbx.matchAll(idRe)].map((m) => m[1]);
ok(ids.length > 20, "pbxproj contains 24-char hex IDs");

// Stronger check: BuildFile IDs must be unique among BuildFile entries
const buildFileIds = [...pbx.matchAll(/^\s+([0-9A-Fa-f]{24}) \/\*.* in (Sources|Resources) \*\/ = \{isa = PBXBuildFile/gm)].map(
  (m) => m[1],
);
const bfSet = new Set(buildFileIds);
ok(bfSet.size === buildFileIds.length, "no duplicate PBXBuildFile IDs");

// كل مرجع «X in Resources» داخل مرحلة Resources يجب أن يملك PBXBuildFile معرّفًا
const resourcePhaseRefs = [
  ...pbx.matchAll(
    /504EC3021FED79650016851F \/\* Resources \*\/ = \{[\s\S]*?files = \(([\s\S]*?)\);/g,
  ),
];
ok(resourcePhaseRefs.length === 1, "App Resources build phase found once");
const resourceIds = [...resourcePhaseRefs[0][1].matchAll(/^\s+([0-9A-Fa-f]{24}) \/\*/gm)].map((m) => m[1]);
const missingBf = resourceIds.filter(
  (id) => !new RegExp(`${id} \\/\\*[^*]+\\*\\/ = \\{isa = PBXBuildFile`).test(pbx),
);
ok(
  missingBf.length === 0,
  `every Resources entry has PBXBuildFile (missing=${missingBf.join(",") || "none"})`,
);
ok(
  pbx.includes(
    "AD11BF09A1B2C3D4E5F6071890 /* adhan-seq-makkah-04.caf in Resources */ = {isa = PBXBuildFile",
  ),
  "adhan-seq-makkah-04.caf has PBXBuildFile (not dangling Resources ref)",
);

ok(
  /CFBundleVersion<\/key>\s*<string>\$\(CURRENT_PROJECT_VERSION\)<\/string>/s.test(plist),
  "App Info.plist CFBundleVersion uses $(CURRENT_PROJECT_VERSION)",
);
const livePlist = readFileSync(join(iosApp, "PrayerLiveActivity", "Info.plist"), "utf8");
ok(
  /CFBundleVersion<\/key>\s*<string>\$\(CURRENT_PROJECT_VERSION\)<\/string>/s.test(livePlist),
  "PrayerLiveActivity CFBundleVersion uses $(CURRENT_PROJECT_VERSION)",
);
ok(
  /ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/s.test(plist),
  "Info.plist declares ITSAppUsesNonExemptEncryption=false (export compliance)",
);

const secretPatterns = [
  /service_role/i,
  /BEGIN (RSA |EC )?PRIVATE KEY/,
  /sk_live_[A-Za-z0-9]+/,
  /SUPABASE_SERVICE_ROLE/,
];
function scanTree(relPaths) {
  for (const rel of relPaths) {
    const full = join(root, rel);
    if (!existsSync(full)) continue;
    const body = readFileSync(full, "utf8");
    for (const re of secretPatterns) {
      ok(!re.test(body), `no secret pattern ${re} in ${rel}`);
    }
  }
}
scanTree([
  "ios/App/App/AppDelegate.swift",
  "ios/App/App/Info.plist",
  "ios/App/App/MajlisPlaybackAudioPlugin.swift",
  "ios/App/App/PrayerLiveActivityPlugin.swift",
  "capacitor.config.ts",
]);

const bundleIdMatches = [...pbx.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((m) => m[1]);
ok(
  bundleIdMatches.every((id) => id === "com.yousef.majlisilm" || id.includes("PrayerLiveActivity")),
  "bundle identifiers unchanged (App + extension only)",
);
ok(
  /DEVELOPMENT_TEAM = 5D8TX37HTS;/.test(pbx),
  "DEVELOPMENT_TEAM unchanged",
);

// Capacitor auto-discovers CAPBridgedPlugin — AppDelegate must not manually register a conflicting name
const appDelegate = readFileSync(join(iosApp, "App", "AppDelegate.swift"), "utf8");
ok(!appDelegate.includes("MajlisPlaybackAudio"), "AppDelegate does not manually register playback plugin (CAPBridgedPlugin auto-discovery)");
ok(!appDelegate.includes("MajlisSpeechRecognition"), "AppDelegate has no speech recognition plugin");
ok(!appDelegate.includes("RecitationAudioCapture"), "AppDelegate has no recitation capture plugin");
ok(appDelegate.includes("import WebKit"), "AppDelegate imports WebKit for cache purge");
ok(
  appDelegate.includes("WKWebsiteDataStore.default().removeData")
    || /WKWebsiteDataStore\.default\(\)\s*\.removeData/.test(appDelegate),
  "AppDelegate clears WKWebsiteDataStore on launch (live URL freshness)",
);
ok(appDelegate.includes("WKWebsiteDataTypeDiskCache"), "AppDelegate purges disk cache");
ok(appDelegate.includes("WKWebsiteDataTypeMemoryCache"), "AppDelegate purges memory cache");
ok(appDelegate.includes("WKWebsiteDataTypeServiceWorkerRegistrations"), "AppDelegate unregisters service workers");
ok(!appDelegate.includes("allWebsiteDataTypes"), "AppDelegate does not wipe localStorage/cookies");

const capJsonPath = join(iosApp, "App", "capacitor.config.json");
ok(existsSync(capJsonPath), "ios capacitor.config.json exists");
const capJson = JSON.parse(readFileSync(capJsonPath, "utf8"));
const capTs = readFileSync(join(root, "capacitor.config.ts"), "utf8");

// Production يحمّل الـ canonical الحي مباشرة (بلا 308 عبر majlisilm/apex).
ok(
  capJson?.server?.url === "https://www.ssunnah.com",
  "capacitor.config.json server.url = https://www.ssunnah.com",
);
ok(
  /\burl:\s*"https:\/\/www\.ssunnah\.com"/.test(capTs),
  "capacitor.config.ts server.url = https://www.ssunnah.com",
);
ok(
  !/\burl:\s*"https:\/\/(www\.)?majlisilm\.com"/.test(capTs),
  "capacitor.config.ts must not use majlisilm.com as server.url",
);
ok(
  !/\burl:\s*"https:\/\/ssunnah\.com"/.test(capTs),
  "capacitor.config.ts must not use apex ssunnah.com (308) as server.url",
);
ok(
  /errorPath:\s*["']native-load-error\.html["']/.test(capTs),
  "capacitor.config.ts errorPath = native-load-error.html",
);
ok(
  /allowNavigation:\s*\[/.test(capTs) || Array.isArray(capJson?.server?.allowNavigation),
  "allowNavigation kept for first-party hosts",
);
// HTTPS-only: cleartext must stay false (http cleartext unused).
ok(capJson?.server?.cleartext === false, "capacitor.config.json cleartext false (https-only)");
ok(capJson?.webDir === "dist", "capacitor.config.json webDir is dist");

const aasaPath = join(root, "public", ".well-known", "apple-app-site-association");
ok(existsSync(aasaPath), "AASA file exists");
const aasa = JSON.parse(readFileSync(aasaPath, "utf8"));
const aasaComponents = aasa?.applinks?.details?.[0]?.components || [];
ok(
  aasaComponents.some((c) => c["/"] === "/" && c.exclude === true),
  "AASA excludes homepage so Safari browsing does not force-open the app",
);
ok(
  !aasaComponents.some((c) => c["/"] === "*" && !c.exclude),
  "AASA must not claim all paths with /* wildcard",
);
ok(
  entitlements.includes("applinks:www.ssunnah.com"),
  "associated domains include www.ssunnah.com",
);
ok(entitlements.includes("applinks:ssunnah.com"), "associated domains include ssunnah.com");
ok(entitlements.includes("applinks:majlisilm.com"), "associated domains applinks majlisilm");

// Build Number must match between App target and PrayerLiveActivity extension.
const projectVersions = [...pbx.matchAll(/CURRENT_PROJECT_VERSION = ([0-9]+);/g)].map((m) => m[1]);
const uniqueProjectVersions = [...new Set(projectVersions)];
ok(projectVersions.length >= 2, "CURRENT_PROJECT_VERSION present for App and extension");
ok(
  uniqueProjectVersions.length === 1,
  `App and PrayerLiveActivityExtension share CURRENT_PROJECT_VERSION (got ${uniqueProjectVersions.join(",")})`,
);
const marketingVersions = [...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1].trim());
const uniqueMarketing = [...new Set(marketingVersions)];
ok(
  uniqueMarketing.length === 1,
  `App and PrayerLiveActivityExtension share MARKETING_VERSION (got ${uniqueMarketing.join(",")})`,
);

// Live-update freshness: JS purge + prepare-ios main guard
const freshnessPath = join(root, "src", "lib", "native-cache-freshness.ts");
ok(existsSync(freshnessPath), "native-cache-freshness.ts exists");
const freshnessSrc = readFileSync(freshnessPath, "utf8");
ok(/\bisNative\b/.test(freshnessSrc), "native-cache-freshness.ts uses isNative");
ok(
  freshnessSrc.includes("navigator.serviceWorker.getRegistrations"),
  "native-cache-freshness.ts uses navigator.serviceWorker.getRegistrations",
);
ok(freshnessSrc.includes("caches.keys"), "native-cache-freshness.ts uses caches.keys");
ok(
  /export\s+async\s+function\s+purgeNativeWebRuntimeCaches/.test(freshnessSrc),
  "native-cache-freshness.ts exports purgeNativeWebRuntimeCaches",
);

ok(
  mainTsx.includes("purgeNativeWebRuntimeCaches"),
  "main.tsx imports/calls purgeNativeWebRuntimeCaches",
);
// لا await قبل createRoot — الانتظار كان يعلّق شاشة بيضاء على Capacitor.
ok(
  /void\s+purgeNativeWebRuntimeCaches\s*\(/.test(mainTsx) ||
    /purgeNativeWebRuntimeCaches\s*\([^)]*\)\s*\.catch\s*\(/.test(mainTsx),
  "main.tsx runs purgeNativeWebRuntimeCaches non-blocking (no await before mount)",
);
ok(
  !/await\s+purgeNativeWebRuntimeCaches\s*\(/.test(mainTsx),
  "main.tsx must not await purgeNativeWebRuntimeCaches before mount",
);

const prepareIos = readFileSync(join(root, "scripts", "prepare-ios.sh"), "utf8");
ok(
  prepareIos.includes("origin/main") && prepareIos.includes("rev-parse"),
  "prepare-ios.sh verifies origin/main",
);
ok(
  prepareIos.includes("ALLOW_IOS_NON_MAIN_BUILD"),
  "prepare-ios.sh contains ALLOW_IOS_NON_MAIN_BUILD override",
);
ok(
  prepareIos.includes("هذا المجلد ليس على آخر origin/main"),
  "prepare-ios.sh fails with clear stale-tree Arabic message",
);

// Auth tokens must live in Keychain — never UserDefaults
const networkServicePath = join(iosApp, "App", "Services", "NetworkService.swift");
const keychainPath = join(iosApp, "App", "Services", "KeychainStore.swift");
ok(existsSync(keychainPath), "KeychainStore.swift exists");
ok(existsSync(networkServicePath), "NetworkService.swift exists");
if (existsSync(networkServicePath)) {
  const networkService = readFileSync(networkServicePath, "utf8");
  ok(networkService.includes("KeychainStore"), "NetworkService uses KeychainStore");
  ok(
    !/UserDefaults\.standard\.(set|data|string|object)\s*\([^)]*(accessToken|refreshToken|auth\.session|sessionTokens)/i.test(
      networkService,
    ),
    "NetworkService does not persist access/refresh tokens via UserDefaults setters",
  );
  ok(
    !/UserDefaults\.standard\.set\s*\(\s*data\s*,/.test(networkService),
    "NetworkService does not UserDefaults.set(data) for session blobs",
  );
  const persistBlock = networkService.match(/private func persistSession[\s\S]*?\n    \}/);
  ok(Boolean(persistBlock), "persistSession function present");
  if (persistBlock) {
    ok(!persistBlock[0].includes("UserDefaults"), "persistSession does not touch UserDefaults");
    ok(persistBlock[0].includes("KeychainStore"), "persistSession writes via KeychainStore");
  }
}
ok(
  /KeychainStore\.swift in Sources/.test(pbx),
  "KeychainStore.swift listed under App target Sources",
);

// package.json / prepare-ios: لا تستخدم npx cap — من جذر الـ monorepo يحلّ npm حزمة
// cap@0.2.1 (بلا bin) → "could not determine executable to run". استخدم ثنائي .bin المحلي.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const mobileScripts = ["mobile:sync", "mobile:android", "mobile:ios"];
for (const name of mobileScripts) {
  const cmd = pkg.scripts?.[name] || "";
  ok(Boolean(cmd), `package.json has script ${name}`);
  ok(!/\bnpx\b/.test(cmd), `${name}: must not use npx (resolves wrong npm package "cap")`);
  ok(!/\bnpm\s+exec\b/.test(cmd), `${name}: must not use npm exec`);
  ok(!/(?:^|[;&|]|&&|\|\|)\s*pnpm\s+exec\s*(?:$|[;&|])/.test(cmd), `${name}: no empty pnpm exec`);
  ok(!/\bcap\s+sync\s*(?:$|[;&|])/.test(cmd), `${name}: cap sync must include ios|android`);
}
ok(
  /\bcap\s+sync\s+ios\b/.test(pkg.scripts?.["mobile:sync"] || ""),
  "mobile:sync runs cap sync ios explicitly",
);
ok(
  /\bcap\s+sync\s+android\b/.test(pkg.scripts?.["mobile:android"] || ""),
  "mobile:android runs cap sync android explicitly",
);
ok(
  /\bcap\s+open\s+ios\b/.test(pkg.scripts?.["mobile:ios"] || ""),
  "mobile:ios runs cap open ios explicitly",
);

// تجاهل التعليقات — افحص أوامر التنفيذ فقط
const prepareIosCode = prepareIos
  .split("\n")
  .filter((line) => !/^\s*#/.test(line))
  .join("\n");
ok(!/\bnpx\b/.test(prepareIosCode), "prepare-ios.sh must not invoke npx");
ok(!/\bnpm\s+exec\b/.test(prepareIosCode), "prepare-ios.sh must not invoke npm exec");
ok(
  /node_modules\/\.bin\/cap/.test(prepareIosCode) && /"\$CAP_BIN"\s+sync\s+ios/.test(prepareIosCode),
  "prepare-ios.sh invokes local node_modules/.bin/cap sync ios",
);

const iosGitignore = readFileSync(join(root, "ios", ".gitignore"), "utf8");
ok(
  /App\/App\/public\/\*\*/.test(iosGitignore) && /!App\/App\/public\/\.gitkeep/.test(iosGitignore),
  "ios/.gitignore ignores App/App/public/** except .gitkeep",
);
ok(existsSync(join(iosApp, "App", "public", ".gitkeep")), "App/App/public/.gitkeep present");

try {
  const repoRoot = join(root, "../..");
  const tracked = execSync("git ls-files -- artifacts/majalis/ios/App/App/public", {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);
  const unexpected = tracked.filter((f) => !f.endsWith("/.gitkeep") && !f.endsWith(".gitkeep"));
  ok(
    unexpected.length === 0,
    `ios App/App/public not tracked in git except .gitkeep (extra=${unexpected.length})`,
  );
  ok(
    tracked.some((f) => f.endsWith(".gitkeep")),
    "public/.gitkeep is tracked so the directory survives clean clones",
  );
} catch (err) {
  ok(false, `git ls-files public mirror check: ${err instanceof Error ? err.message : err}`);
}

if (failed) {
  console.error(`\n${failed} gate(s) failed`);
  process.exit(1);
}
console.log("\nAll iOS static gates passed.");
