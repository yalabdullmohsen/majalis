#!/usr/bin/env node
/**
 * Static iOS/Capacitor gates — runnable on Linux CI without Xcode.
 * Does NOT archive or publish to TestFlight.
 */
import { readFileSync, existsSync } from "node:fs";
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

const speechSwift = readFileSync(join(iosApp, "App", "MajlisSpeechRecognitionPlugin.swift"), "utf8");
ok(speechSwift.includes("CAPBridgedPlugin"), "speech plugin conforms to CAPBridgedPlugin");
ok(speechSwift.includes('jsName = "MajlisSpeechRecognition"'), "speech plugin jsName");
ok(!/try\?/.test(speechSwift), "speech plugin does not swallow errors with try?");
ok(
  !/call\.resolve\(\[\s*"matches"\s*:\s*\[\s*\]\s*\]\)/.test(speechSwift),
  "speech plugin does not silently resolve empty matches",
);
ok(speechSwift.includes('call.reject'), "speech plugin uses call.reject for failures");
for (const code of [
  "RECOGNIZER_UNAVAILABLE",
  "SPEECH_DENIED",
  "MICROPHONE_DENIED",
  "AUDIO_SESSION_FAILED",
  "NO_SPEECH_DETECTED",
  "MEDIA_SERVICES_RESET",
  "RECOGNITION_FAILED",
]) {
  ok(speechSwift.includes(`"${code}"`), `speech plugin classifies ${code}`);
}
ok(speechSwift.includes("mediaServicesWereResetNotification"), "speech observes media services reset");
ok(speechSwift.includes("deinit"), "speech plugin cleans up in deinit");
ok(speechSwift.includes('name: "prepare"'), "speech plugin exposes prepare for prewarm");
ok(speechSwift.includes('name: "teardown"'), "speech plugin exposes teardown");
ok(speechSwift.includes("NO_AUDIO_BUFFER"), "speech classifies no first buffer");
ok(speechSwift.includes("shouldReportPartialResults"), "speech enables partial results");
ok(speechSwift.includes("playAndRecord"), "speech uses playAndRecord to avoid category thrash");
ok(speechSwift.includes("notifyListeners(\"latency\""), "speech emits latency metrics");
ok(speechSwift.includes("notifyListeners(\"audioLevel\""), "speech emits audio level");
ok(speechSwift.includes("sessionPrepared"), "speech keeps warm session state");

ok(plist.includes("NSMicrophoneUsageDescription"), "Info.plist NSMicrophoneUsageDescription");
ok(plist.includes("NSSpeechRecognitionUsageDescription"), "Info.plist NSSpeechRecognitionUsageDescription");

const speechJs = readFileSync(join(root, "src", "lib", "plugins", "speech-recognition.ts"), "utf8");
ok(speechJs.includes("prepare("), "JS speech bridge exposes prepare");
ok(speechJs.includes("teardown("), "JS speech bridge exposes teardown");
ok(speechJs.includes("stopQuranPlaybackForRecitation"), "JS stops Quran before recitation");
ok(speechJs.includes("NO_AUDIO_BUFFER"), "JS classifies NO_AUDIO_BUFFER");

const captureSwift = readFileSync(join(iosApp, "App", "RecitationAudioCapturePlugin.swift"), "utf8");
ok(!/try\?/.test(captureSwift), "capture plugin does not swallow errors with try?");
ok(captureSwift.includes("AUDIO_SESSION_FAILED"), "capture rejects deactivate with AUDIO_SESSION_FAILED");
ok(captureSwift.includes("mediaServicesWereResetNotification"), "capture observes media services reset");

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
ok(live.includes("https://majlisilm.com/prayer-times"), "Live Activity widgetURL uses https universal link");

const entitlements = readFileSync(join(iosApp, "App", "App.entitlements"), "utf8");
ok(entitlements.includes("applinks:majlisilm.com"), "associated domains applinks");

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

if (failed) {
  console.error(`\n${failed} gate(s) failed`);
  process.exit(1);
}
console.log("\nAll iOS static gates passed.");
