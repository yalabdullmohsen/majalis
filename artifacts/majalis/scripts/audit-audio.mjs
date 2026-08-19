/**
 * audit-audio.mjs
 *
 * تدقيق جودة ملفات صوت التلاوة (EveryAyah) المعرّفة في:
 *   public/data/audio/audio-registry.json
 *
 * ملاحظة واقعية:
 * - هذا السكربت “قابل للتشغيل” حتى في بيئات لا تتوفر فيها ffmpeg/ffprobe،
 *   لكنه عند غياب الأدوات سيُصدر نتيجة جزئية (completeness only).
 * - القياسات التفصيلية (noise/SNR/LUFS/duration-expected) تحتاج عينات طويلة
 *   وخوارزميات أكثر تعقيدًا؛ هنا نغطي الجزء الأكثر ثباتًا: bitrate/sample_rate
 *   + clipping عبر volumedetect + completeness عبر HEAD.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
  59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const EXPECTED_TOTAL_AYAHS = 6236;
const EVERYAYAH_URL_PREFIX = "https://everyayah.com/data/";

function hasBin(bin) {
  try {
    const r = spawnSync(bin, ["-version"], { stdio: "ignore" });
    return r.status === 0 || r.status === null;
  } catch {
    return false;
  }
}

function fileExists(p) {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false);
}

async function resolveProjectPath(relative) {
  // run from artifacts/majalis (recommended)
  const p1 = path.resolve(process.cwd(), relative);
  if (await fileExists(p1)) return p1;

  // run from repo root
  const p2 = path.resolve(process.cwd(), "artifacts/majalis", relative);
  if (await fileExists(p2)) return p2;

  return p1;
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function everyAyahUrl(folder, surah, ayah) {
  return `${EVERYAYAH_URL_PREFIX}${folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

const FOLDER_BY_RECITER_ID = {
  husary: "Husary_128kbps",
  minshawi: "Minshawy_Murattal_128kbps",
  alafasy: "Alafasy_128kbps",
};

async function headOk(url, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function poolMap(items, concurrency, worker) {
  const results = new Array(items.length);
  let idx = 0;
  const workers = new Array(concurrency).fill(0).map(async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

function parseFfprobeJson(out) {
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function runFfprobe(url) {
  const r = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=bit_rate,sample_rate",
      "-of",
      "json",
      url,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;
  const json = parseFfprobeJson(r.stdout);
  const stream = json?.streams?.[0];
  if (!stream) return null;
  const bitrate = stream.bit_rate ? Number(stream.bit_rate) / 1000 : null;
  const sampleRate = stream.sample_rate ? Number(stream.sample_rate) : null;
  return { bitrateKbps: bitrate, sampleRateHz: sampleRate };
}

function runClippingProbe(url) {
  // volumedetect prints something like: "max_volume: -0.1 dB"
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", url, "-af", "volumedetect", "-vn", "-sn", "-dn", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  if (r.status !== 0) return null;
  const text = `${r.stdout}\n${r.stderr}`;
  const m = text.match(/max_volume:\s*([+-]?\d+(?:\.\d+)?)\s*dB/i);
  if (!m) return null;
  const maxVolumeDb = Number(m[1]);
  return { maxVolumeDb };
}

function runLufsProbe(url) {
  const r = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-nostats",
      "-i",
      url,
      "-af",
      "ebur128=peak=true",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  if (r.status !== 0) return null;
  const text = `${r.stdout}\n${r.stderr}`;
  const integrated = text.match(/I:\s*([+-]?\d+(?:\.\d+)?)\s*LUFS/i);
  const truePeak = text.match(/Peak:\s*([+-]?\d+(?:\.\d+)?)\s*dBFS/i);
  return {
    integratedLufs: integrated ? Number(integrated[1]) : null,
    truePeakDbfs: truePeak ? Number(truePeak[1]) : null,
  };
}

function expectedTotalAyahsFromCounts() {
  return SURAH_AYAH_COUNTS.reduce((a, b) => a + b, 0);
}

async function main() {
  const registryPath = await resolveProjectPath("public/data/audio/audio-registry.json");
  const registryRaw = await fs.readFile(registryPath, "utf8");
  const registry = JSON.parse(registryRaw);
  const verifiedReciters = (registry?.reciters ?? []).filter((r) => r?.verified && typeof r.id === "string");

  const expected = expectedTotalAyahsFromCounts();
  if (expected !== EXPECTED_TOTAL_AYAHS) {
    console.warn(`[audit-audio] WARNING: SURAH_AYAH_COUNTS sum=${expected} (expected ${EXPECTED_TOTAL_AYAHS})`);
  }

  const ffprobeOk = hasBin("ffprobe");
  const ffmpegOk = hasBin("ffmpeg");
  const quick = process.env.AUDIT_AUDIO_QUICK === "1";
  console.log(`[audit-audio] ffprobe=${ffprobeOk} ffmpeg=${ffmpegOk} quick=${quick}`);

  // Concurrency tuned for CI: adjust via env
  const headConcurrency = Number(process.env.AUDIT_AUDIO_HEAD_CONCURRENCY ?? 12);
  const sampleLimit = Number(process.env.AUDIT_AUDIO_SAMPLE_LIMIT ?? 30);
  const completenessLimit = quick
    ? Number(process.env.AUDIT_AUDIO_COMPLETENESS_LIMIT ?? 50)
    : EXPECTED_TOTAL_AYAHS;

  const results = [];
  for (const rec of verifiedReciters) {
    const folder = FOLDER_BY_RECITER_ID[rec.id];
    if (!folder) {
      results.push({ reciterId: rec.id, ok: false, reason: "missing folder mapping", folder });
      continue;
    }

    console.log(`[audit-audio] Reciter ${rec.id} (${rec.name ?? "?"})`);

    const pairs = [];
    for (let surah = 1; surah <= 114; surah++) {
      const cnt = SURAH_AYAH_COUNTS[surah - 1];
      for (let ayah = 1; ayah <= cnt; ayah++) {
        pairs.push({ surah, ayah });
        if (pairs.length >= completenessLimit) break;
      }
      if (pairs.length >= completenessLimit) break;
    }

    // 1) completeness via HEAD
    const missing = [];
    await poolMap(
      pairs,
      headConcurrency,
      async ({ surah, ayah }) => {
        const url = everyAyahUrl(folder, surah, ayah);
        const ok = await headOk(url);
        if (!ok) missing.push({ surah, ayah });
        return ok;
      },
    );
    const okCompleteness = missing.length === 0;

    // 2) quality sampling
    const sample = pairs.slice(0, sampleLimit);
    let sampleReport = [];
    if (ffprobeOk && ffmpegOk) {
      sampleReport = await poolMap(sample, 4, async ({ surah, ayah }) => {
        const url = everyAyahUrl(folder, surah, ayah);
        const probe = runFfprobe(url);
        const clip = runClippingProbe(url);
        const lufs = runLufsProbe(url);
        return { surah, ayah, url, probe, clip, lufs };
      });
    }

    const lufsValues = sampleReport
      .map((s) => s.lufs?.integratedLufs)
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    const avgLufs =
      lufsValues.length > 0 ? lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length : null;

    results.push({
      reciterId: rec.id,
      okCompleteness,
      completenessChecked: pairs.length,
      missingCount: missing.length,
      missingSample: missing.slice(0, 10),
      sampleLimit,
      avgIntegratedLufs: avgLufs,
      ffprobeOk,
      ffmpegOk,
      quick,
      sampleReport,
    });

    console.log(
      `[audit-audio] ${rec.id}: completeness=${okCompleteness} missing=${missing.length}/${pairs.length}` +
        (avgLufs != null ? ` avgLufs=${avgLufs.toFixed(1)}` : ""),
    );
  }

  const outPath = await resolveProjectPath("docs/AUDIO_QA.last-audit.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const payload = {
    updatedAt: new Date().toISOString(),
    quick,
    ffprobeOk,
    ffmpegOk,
    results,
  };
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");

  // Update markdown summary
  const mdPath = await resolveProjectPath("docs/AUDIO_QA.md");
  const mdRows = results
    .map((r) => {
      const status = r.okCompleteness ? "pass" : "fail";
      const lufs =
        r.avgIntegratedLufs != null ? `${r.avgIntegratedLufs.toFixed(1)} LUFS (sample)` : "n/a";
      return `| \`${r.reciterId}\` | EveryAyah (128kbps) | ${r.completenessChecked} checked | ${status} | avg ${lufs} |`;
    })
    .join("\n");
  const md = `# جودة الصوت (Audio QA)

هذا المستند يلخّص نتيجة فحص الجودة لملفات صوت التلاوة المعروضة للمستخدم.

## مصدر الفحص
- السكربت: \`scripts/audit-audio.mjs\` (\`pnpm run audit:audio\`)
- يقرأ \`public/data/audio/audio-registry.json\`
- يخرج نتيجة آخر تشغيل في: \`docs/AUDIO_QA.last-audit.json\`

## جدول QA

| reciterId | المصدر | expected files | status | ملاحظات |
|---|---|---:|---|---|
${mdRows}

> آخر تحديث: ${payload.updatedAt}${quick ? " (وضع quick — فحص جزئي)" : ""}
`;
  await fs.writeFile(mdPath, md, "utf8");

  const allOk = results.every((r) => r.okCompleteness);
  if (!allOk) {
    console.error("[audit-audio] FAILED: completeness missing files detected");
    process.exit(2);
  }
}

await main();

