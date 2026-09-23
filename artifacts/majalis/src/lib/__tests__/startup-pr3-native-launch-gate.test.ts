/**
 * بوابة Startup PR-3: Native Launch + دخولية واحدة.
 * تشغيل: node --import tsx src/lib/__tests__/startup-pr3-native-launch-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const contract = readPkg("src/lib/majlis-splash.ts");
assert.match(contract, /SPLASH_PIPELINE/);
assert.match(contract, /native-launch-color/);
assert.match(contract, /html-branded-once/);
assert.match(contract, /SPLASH_BG_LIGHT\s*=\s*"#F7F3EB"/);
assert.match(contract, /SPLASH_BG_DARK\s*=\s*"#101614"/);
assert.match(contract, /SPLASH_MIN_VISIBLE_MS\s*=\s*0/);

const splash = readPkg("src/lib/splash-screen.ts");
assert.match(splash, /hideCapacitorSplash\(true\)/);
assert.doesNotMatch(splash, /SplashScreen\.show\s*\(/);
assert.match(splash, /mj:shell-stable/);

const launch = readPkg("ios/App/App/Base.lproj/LaunchScreen.storyboard");
assert.match(launch, /name="LaunchBackground"/);
assert.doesNotMatch(launch, /<imageView\b/i);
assert.doesNotMatch(launch, /<label\b/i);
assert.doesNotMatch(launch, /سُنّة/);
assert.doesNotMatch(launch, /<progressView\b|UIProgressView|UIActivityIndicator/i);

assert.ok(
  existsSync(resolve(majalisRoot, "ios/App/App/Assets.xcassets/LaunchBackground.colorset/Contents.json")),
  "LaunchBackground.colorset",
);
const colorset = readPkg("ios/App/App/Assets.xcassets/LaunchBackground.colorset/Contents.json");
assert.match(colorset, /"value"\s*:\s*"dark"/);

const cap = readPkg("capacitor.config.ts");
assert.match(cap, /showSpinner:\s*false/);
assert.match(cap, /launchShowDuration:\s*0/);
assert.match(cap, /backgroundColor:\s*"#F7F3EB"/);

const androidNight = readPkg("android/app/src/main/res/values-night/colors.xml");
assert.match(androidNight, /splash_background">#101614</);

const info = readPkg("ios/App/App/Info.plist");
assert.match(info, /UILaunchStoryboardName/);
assert.match(info, /LaunchScreen/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:startup-pr3"/);

assert.match(readRepo("docs/REPO_INDEX.md"), /Startup PR-3|LaunchBackground|startup-pr3/);

console.log("startup-pr3-native-launch-gate.test.ts: ok");
