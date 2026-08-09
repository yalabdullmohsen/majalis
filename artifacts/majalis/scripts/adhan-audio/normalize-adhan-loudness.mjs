#!/usr/bin/env node
/**
 * توحيد جهارة مقطع أذان إلى ≈ -16 LUFS (ffmpeg loudnorm) + قصّ صمت الطرفين.
 *
 * الاستخدام:
 *   node scripts/adhan-audio/normalize-adhan-loudness.mjs in.mp3 out.mp3
 *   ADHAN_TARGET_LUFS=-16 ADHAN_TRUE_PEAK=-1.5 node ...
 *
 * لا يُشغَّل في CI تلقائيًا — أداة توريد يدوية قبل الاعتماد.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const input = process.argv[2];
const output = process.argv[3];
const TARGET = process.env.ADHAN_TARGET_LUFS || "-16";
const TP = process.env.ADHAN_TRUE_PEAK || "-1.5";
const LRA = process.env.ADHAN_LRA || "11";

if (!input || !output) {
  console.error("Usage: normalize-adhan-loudness.mjs <in> <out>");
  process.exit(2);
}
if (!existsSync(input)) {
  console.error("missing input:", input);
  process.exit(1);
}

const filter = [
  "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB",
  "areverse",
  "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB",
  "areverse",
  `loudnorm=I=${TARGET}:TP=${TP}:LRA=${LRA}`,
  "afade=t=in:st=0:d=0.05",
  "afade=t=out:d=0.12",
].join(",");

const args = [
  "-y",
  "-i",
  input,
  "-af",
  filter,
  "-ac",
  "1",
  "-b:a",
  "160k",
  "-ar",
  "44100",
  output,
];

console.log(`ffmpeg → LUFS≈${TARGET} mono 160k: ${input} → ${output}`);
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
process.exit(r.status ?? 1);
