#!/usr/bin/env node
/**
 * generate-adhan-bundle.mjs
 *
 * يُحمّل مقاطع الأذان من CDN (mohsalvi/adhan-audio) ويُولّد:
 *  - public/audio/adhan/* (m4a/mp3 للتشغيل داخل التطبيق)
 *  - ios/App/App/Sounds/*.caf (إشعارات iOS ≤28ث)
 *  - ios/App/App/*.caf (نسخ جذر Bundle — مطلوب لبوابة test-adhan-ios-bundle-sounds)
 *  - android/app/src/main/res/raw/*.mp3
 *
 * يتطلب: curl + afconvert (macOS). ffmpeg اختياري للتحقق.
 *
 *   node scripts/adhan-audio/generate-adhan-bundle.mjs
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const CDN = "https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main";
const CACHE = join(ROOT, ".cache/adhan-audio-src");
const PUBLIC = join(ROOT, "public/audio/adhan");
const IOS_SOUNDS = join(ROOT, "ios/App/App/Sounds");
const IOS_APP = join(ROOT, "ios/App/App");
const ANDROID_RAW = join(ROOT, "android/app/src/main/res/raw");

/** ≈10ث @128kbps — مقاطع إشعار قصيرة */
const SHORT_BYTES = 180_000;
/** ≈28ث @128kbps — مقاطع كاملة ضمن الحزمة / سلسلة iOS */
const CLIP_BYTES = 460_000;

const SOURCES = {
  makkah: `${CDN}/general/makkah-haram-02.mp3`,
  madinah: `${CDN}/general/madinah-02.mp3`,
  egypt: `${CDN}/general/egypt-traditional-02.mp3`,
  aqsa: `${CDN}/general/al-aqsa-jerusalem-02.mp3`,
  haram: `${CDN}/general/al-haram-01.mp3`,
  fajr: `${CDN}/fajr/makkah-fajr-01.mp3`,
  takbir: `${CDN}/general/madinah-02.mp3`,
};

function has(cmd) {
  return spawnSync("which", [cmd], { encoding: "utf8" }).status === 0;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (${r.status})`);
}

async function download(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest) && statSync(dest).size > 10_000) return dest;
  console.log(`↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return dest;
}

function sliceMp3(src, dest, startByte, lengthByte) {
  const buf = readFileSync(src);
  const start = Math.min(startByte, buf.length - 1);
  const end = Math.min(start + lengthByte, buf.length);
  writeFileSync(dest, buf.subarray(start, end));
}

function toCaf(mp3Path, cafPath) {
  mkdirSync(dirname(cafPath), { recursive: true });
  run("afconvert", ["-f", "caff", "-d", "ima4", "-c", "1", mp3Path, cafPath]);
}

function toM4a(mp3Path, m4aPath) {
  mkdirSync(dirname(m4aPath), { recursive: true });
  run("afconvert", ["-f", "m4af", "-d", "aac", "-c", "1", mp3Path, m4aPath]);
}

function copyMp3(mp3Path, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(mp3Path, dest);
}

function linkOrCopyCaf(name) {
  const src = join(IOS_SOUNDS, name);
  const dest = join(IOS_APP, name);
  if (!existsSync(src)) throw new Error(`missing ${src}`);
  if (existsSync(dest)) {
    try {
      rmSync(dest);
    } catch {
      /* ignore */
    }
  }
  try {
    symlinkSync(join("Sounds", name), dest);
  } catch {
    copyFileSync(src, dest);
  }
}

function probeDuration(file) {
  if (!has("afinfo")) return null;
  const r = spawnSync("afinfo", [file], { encoding: "utf8" });
  const m = String(r.stdout).match(/estimated duration:\s*([\d.]+)\s*sec/);
  return m ? Number(m[1]) : null;
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 16);
}

async function main() {
  if (!has("afconvert")) {
    console.error("afconvert مطلوب (macOS).");
    process.exit(1);
  }
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(PUBLIC, { recursive: true });
  mkdirSync(IOS_SOUNDS, { recursive: true });
  mkdirSync(ANDROID_RAW, { recursive: true });

  const src = {};
  for (const [key, url] of Object.entries(SOURCES)) {
    src[key] = await download(url, join(CACHE, `${key}.mp3`));
  }

  const tmp = join(CACHE, "tmp");
  mkdirSync(tmp, { recursive: true });

  // ── public/audio/adhan (in-app playback clips ~28s) ──
  const fullMap = [
    ["makkah", "adhan-makkah-full.m4a", 0],
    ["madinah", "adhan-madinah-full.m4a", 0],
    ["egypt", "adhan-egypt-full.m4a", 0],
    ["haram", "adhan-haram-full.m4a", 0],
    ["madinah", "adhan-soft-alert.m4a", SHORT_BYTES],
  ];
  for (const [key, name, offset] of fullMap) {
    const clip = join(tmp, name.replace(/\.\w+$/, ".mp3"));
    sliceMp3(src[key], clip, offset, CLIP_BYTES);
    toM4a(clip, join(PUBLIC, name));
  }

  sliceMp3(src.aqsa, join(tmp, "aqsa.mp3"), 0, CLIP_BYTES);
  copyMp3(join(tmp, "aqsa.mp3"), join(PUBLIC, "adhan-aqsa-full.mp3"));

  sliceMp3(src.fajr, join(tmp, "fajr.mp3"), 0, CLIP_BYTES * 2);
  copyMp3(join(tmp, "fajr.mp3"), join(PUBLIC, "adhan-makkah-fajr.mp3"));

  sliceMp3(src.takbir, join(tmp, "tak.mp3"), 0, SHORT_BYTES);
  copyMp3(join(tmp, "tak.mp3"), join(PUBLIC, "adhan-takbeerat-short.mp3"));

  // ── iOS notification CAF (≤28s) ──
  const shortCaf = [
    ["makkah", "adhan-short-makkah.caf", 0],
    ["madinah", "adhan-short-madinah.caf", 0],
    ["egypt", "adhan-short-egypt.caf", 0],
    ["aqsa", "adhan-short-aqsa.caf", 0],
    ["takbir", "adhan-short-takbeerat.caf", 0],
    ["fajr", "adhan-short-makkah-fajr.caf", 0],
  ];
  for (const [key, name, offset] of shortCaf) {
    const clip = join(tmp, `short-${key}.mp3`);
    sliceMp3(src[key], clip, offset, SHORT_BYTES);
    toCaf(clip, join(IOS_SOUNDS, name));
    linkOrCopyCaf(name);
  }

  // ── iOS sequential full adhan (4×28s) — makkah only ──
  for (let i = 0; i < 4; i++) {
    const name = `adhan-seq-makkah-0${i + 1}.caf`;
    const clip = join(tmp, name.replace(".caf", ".mp3"));
    sliceMp3(src.makkah, clip, i * (CLIP_BYTES - 40_000), CLIP_BYTES);
    toCaf(clip, join(IOS_SOUNDS, name));
    linkOrCopyCaf(name);
  }

  // ── Android raw (mp3 mirrors) ──
  const android = [
    ["adhan-short-makkah.caf", "adhan_short_makkah.mp3", "makkah", 0, SHORT_BYTES],
    ["adhan-short-madinah.caf", "adhan_short_madinah.mp3", "madinah", 0, SHORT_BYTES],
    ["adhan-short-egypt.caf", "adhan_short_egypt.mp3", "egypt", 0, SHORT_BYTES],
    ["adhan-short-aqsa.caf", "adhan_short_aqsa.mp3", "aqsa", 0, SHORT_BYTES],
    ["adhan-short-takbeerat.caf", "adhan_short_takbeerat.mp3", "takbir", 0, SHORT_BYTES],
  ];
  for (const [, androidName, key, offset, len] of android) {
    const clip = join(tmp, androidName);
    sliceMp3(src[key], clip, offset, len);
    copyMp3(clip, join(ANDROID_RAW, androidName));
  }
  for (let i = 0; i < 4; i++) {
    const clip = join(tmp, `seq-${i + 1}.mp3`);
    sliceMp3(src.makkah, clip, i * (CLIP_BYTES - 40_000), CLIP_BYTES);
    copyMp3(clip, join(ANDROID_RAW, `adhan_seq_makkah_0${i + 1}.mp3`));
  }

  // ── manifest for QA ──
  const manifest = { generatedAt: new Date().toISOString(), files: [] };
  for (const dir of [PUBLIC, IOS_SOUNDS, ANDROID_RAW]) {
    for (const name of readdirSync(dir)) {
      if (!/\.(caf|m4a|mp3)$/i.test(name)) continue;
      const p = join(dir, name);
      manifest.files.push({
        path: p.replace(ROOT + "/", ""),
        bytes: statSync(p).size,
        durationSec: probeDuration(p),
        sha256: sha256(p),
      });
    }
  }
  writeFileSync(join(PUBLIC, "bundle-manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\n✓ generate-adhan-bundle: ok");
  console.log(`  public: ${manifest.files.filter((f) => f.path.startsWith("public/")).length} files`);
  console.log(`  ios Sounds: ${readdirSync(IOS_SOUNDS).filter((n) => n.endsWith(".caf")).length} caf`);
  console.log(`  android raw: ${readdirSync(ANDROID_RAW).length} mp3`);
}

await main();
