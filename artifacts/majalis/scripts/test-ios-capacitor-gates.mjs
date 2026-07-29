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
ok(plist.includes("<string>majlisilm</string>"), "CFBundleURLSchemes includes majlisilm");
ok(plist.includes("UIBackgroundModes"), "UIBackgroundModes declared");
ok(plist.includes("<string>audio</string>"), "background audio mode");
ok(plist.includes("NSAllowsArbitraryLoads") && /NSAllowsArbitraryLoads<\/key>\s*<false\/>/s.test(plist), "ATS NSAllowsArbitraryLoads=false");

const pbx = readFileSync(join(iosApp, "App.xcodeproj", "project.pbxproj"), "utf8");
ok(pbx.includes("PrivacyInfo.xcprivacy in Resources"), "PrivacyInfo.xcprivacy in Resources build phase");
ok(pbx.includes("MajlisPlaybackAudioPlugin.swift in Sources"), "MajlisPlaybackAudioPlugin in Sources");
ok(/IPHONEOS_DEPLOYMENT_TARGET = 16\.2;/.test(pbx), "deployment target aligned to 16.2");
ok(!/IPHONEOS_DEPLOYMENT_TARGET = 15\.0;/.test(pbx), "no leftover 15.0 deployment target on App project");

ok(existsSync(join(iosApp, "App", "PrivacyInfo.xcprivacy")), "PrivacyInfo.xcprivacy file exists");
ok(existsSync(join(iosApp, "App", "MajlisPlaybackAudioPlugin.swift")), "MajlisPlaybackAudioPlugin.swift exists");

const live = readFileSync(
  join(iosApp, "PrayerLiveActivity", "PrayerLiveActivityLiveActivity.swift"),
  "utf8",
);
ok(live.includes("https://majlisilm.com/prayer-times"), "Live Activity widgetURL uses https universal link");

const entitlements = readFileSync(join(iosApp, "App", "App.entitlements"), "utf8");
ok(entitlements.includes("applinks:majlisilm.com"), "associated domains applinks");

const deepLink = readFileSync(join(root, "src", "lib", "native-deep-link.ts"), "utf8");
ok(deepLink.includes("majlisilm"), "native-deep-link handles custom scheme");

const mainTsx = readFileSync(join(root, "src", "main.tsx"), "utf8");
ok(mainTsx.includes("resolveNativeDeepLinkPath"), "main.tsx wires deep-link resolver");

// Secret scan — iOS Swift + plist (no service role / private keys)
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

if (failed) {
  console.error(`\n${failed} gate(s) failed`);
  process.exit(1);
}
console.log("\nAll iOS static gates passed.");
