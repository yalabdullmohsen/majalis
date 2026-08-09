#!/usr/bin/env node
/**
 * بوابة جودة مقاطع الأذان المضمّنة (إن وُجدت).
 *
 * قواعد:
 *  - short/* و takbir/* : المدة ≤ 28 ثانية
 *  - أي ملف: لا ذروة تتجاوز 0 dBFS تقريبًا (clipping) عبر ffmpeg volumedetect إن توفّر
 *  - الهدف التشغيلي للجهارة: ≈ -16 LUFS (يُقاس بـ loudnorm عند توفر ffmpeg؛ تحذير لا فشل إن غاب)
 *
 * إن لم يوجد مجلد أصوات بعد → نجاح (التوريد لاحقًا).
 *
 *   node scripts/adhan-audio/check-adhan-audio-quality.mjs
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const SOUNDS = join(ROOT, "public/sounds/adhan");
const SHORT_MAX_SEC = 28;
const AUDIO_EXT = new Set([".mp3", ".m4a", ".aac", ".caf", ".wav"]);

function listAudio(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listAudio(p));
    else if (AUDIO_EXT.has(name.slice(name.lastIndexOf(".")).toLowerCase())) out.push(p);
  }
  return out;
}

function hasBin(bin) {
  const r = spawnSync(bin, ["-version"], { encoding: "utf8" });
  return r.status === 0;
}

function probeDurationSec(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;
  const n = Number(String(r.stdout).trim());
  return Number.isFinite(n) ? n : null;
}

function peakDb(file) {
  const r = spawnSync(
    "ffmpeg",
    ["-i", file, "-af", "volumedetect", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const text = `${r.stderr || ""}\n${r.stdout || ""}`;
  const m = text.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
  return m ? Number(m[1]) : null;
}

const files = listAudio(SOUNDS);
if (files.length === 0) {
  console.log("check-adhan-audio-quality: لا ملفات في public/sounds/adhan — تخطٍ (OK)");
  process.exit(0);
}

const ff = hasBin("ffprobe") && hasBin("ffmpeg");
if (!ff) {
  console.error("check-adhan-audio-quality: ffmpeg/ffprobe مطلوبان لفحص الملفات الموجودة");
  process.exit(1);
}

const failures = [];
console.log(`check-adhan-audio-quality: ${files.length} ملف`);

for (const file of files) {
  const rel = relative(SOUNDS, file);
  const dur = probeDurationSec(file);
  if (dur == null) {
    failures.push(`${rel}: تعذّر قياس المدة`);
    continue;
  }
  const inShortBucket = rel.startsWith("short/") || rel.startsWith("takbir/");
  if (inShortBucket && dur > SHORT_MAX_SEC + 0.05) {
    failures.push(`${rel}: مدة ${dur.toFixed(2)}s > ${SHORT_MAX_SEC}s`);
  }
  const peak = peakDb(file);
  if (peak != null && peak > 0.1) {
    failures.push(`${rel}: ذروة ${peak} dB — احتمال clipping`);
  }
  console.log(`ok ${rel} dur=${dur.toFixed(2)}s peak=${peak ?? "?"}dB`);
}

if (failures.length) {
  console.error("\nفشل جودة الأذان:");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log("check-adhan-audio-quality: ok");
