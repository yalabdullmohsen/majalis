/**
 * audit-audio.mjs — تدقيق EveryAyah للقرّاء المُحقَّقين في audio-registry.json
 *
 * أوضاع التشغيل (AUDIT_AUDIO_MODE):
 *   stratified — 200 ملف/قارئ (سور/آيات طويلة وقصيرة) — بوابة قبل الكامل
 *   full       — 6236 HEAD لكل قارئ ناجح في stratified
 *   quick      — 50 ملف (legacy AUDIT_AUDIO_QUICK=1)
 *
 *   pnpm run audit:audio:stratified
 *   pnpm run audit:audio:full
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

/** قرّاء EveryAyah المرشّحون للفحص — verified يُحدَّث بعد PASS فقط */
const AUDIT_CANDIDATE_IDS = ["husary", "minshawi", "alafasy"];

const FOLDER_BY_RECITER_ID = {
  husary: "Husary_128kbps",
  minshawi: "Minshawy_Murattal_128kbps",
  alafasy: "Alafasy_128kbps",
};

/** سور قصيرة — كل الآيات */
const SHORT_SURAHS = [1, 108, 109, 110, 111, 112, 113, 114];
/** سور طويلة — عيّنة متباعدة */
const LONG_SURAHS = [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 18, 19, 36, 55, 56, 67, 78];
/** آيات طويلة/معروفة */
const LONG_AYAH_LANDMARKS = [
  [2, 255],
  [2, 282],
  [2, 1],
  [2, 286],
  [3, 1],
  [3, 200],
  [4, 1],
  [4, 176],
  [5, 1],
  [5, 120],
  [7, 1],
  [7, 206],
  [12, 1],
  [12, 111],
  [18, 1],
  [18, 110],
  [19, 1],
  [19, 98],
  [20, 1],
  [20, 135],
  [36, 1],
  [36, 83],
  [67, 1],
  [78, 1],
  [114, 1],
  [114, 6],
];

function hasBin(bin) {
  try {
    const r = spawnSync(bin, ["-version"], { stdio: "ignore" });
    return r.status === 0 || r.status === null;
  } catch {
    return false;
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveProjectPath(relative) {
  const p1 = path.resolve(process.cwd(), relative);
  if (await fileExists(p1)) return p1;
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

function ayahCount(surah) {
  return SURAH_AYAH_COUNTS[surah - 1];
}

/**
 * عيّنة طبقية ~200: سور قصيرة (كل الآيات) + سور طويلة (متباعدة) + آيات landmark.
 */
export function buildStratifiedPairs(targetCount = 200) {
  const seen = new Set();
  const out = [];
  const add = (surah, ayah) => {
    const max = ayahCount(surah);
    if (ayah < 1 || ayah > max) return;
    const k = `${surah}:${ayah}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ surah, ayah });
  };

  for (const surah of SHORT_SURAHS) {
    for (let ayah = 1; ayah <= ayahCount(surah); ayah++) add(surah, ayah);
  }

  for (const [surah, ayah] of LONG_AYAH_LANDMARKS) add(surah, ayah);

  for (const surah of LONG_SURAHS) {
    const cnt = ayahCount(surah);
    const steps = Math.max(6, Math.ceil((targetCount - out.length) / LONG_SURAHS.length));
    for (let i = 1; i <= steps; i++) {
      add(surah, Math.max(1, Math.min(cnt, Math.round((cnt * i) / (steps + 1)))));
    }
    add(surah, 1);
    add(surah, cnt);
    add(surah, Math.ceil(cnt / 2));
  }

  // أول/آخر آية لكل جزء (30)
  const juzStarts = [1, 142, 253, 92, 106, 128, 151, 177, 87, 109, 123, 111, 52, 99, 1, 1, 1, 74, 97, 1, 11, 1, 1, 21, 1, 20, 1, 1, 1, 1];
  const juzSurahs = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
  for (let j = 0; j < 30; j++) add(juzSurahs[j], juzStarts[j]);

  if (out.length < targetCount) {
    for (let surah = 1; surah <= 114 && out.length < targetCount; surah++) {
      const cnt = ayahCount(surah);
      for (let ayah = 1; ayah <= cnt && out.length < targetCount; ayah += Math.max(1, Math.floor(cnt / 12))) {
        add(surah, ayah);
      }
    }
  }

  return out.slice(0, targetCount);
}

function buildAllPairs() {
  const pairs = [];
  for (let surah = 1; surah <= 114; surah++) {
    for (let ayah = 1; ayah <= ayahCount(surah); ayah++) {
      pairs.push({ surah, ayah });
    }
  }
  return pairs;
}

async function headOk(url, timeoutMs = 9000, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
      if (res.ok) return true;
      // بعض CDNs ترفض HEAD عابراً — Range GET كاحتياط
      if (res.status === 405 || res.status === 403 || res.status === 429) {
        const getRes = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
          signal: ctrl.signal,
        });
        if (getRes.ok || getRes.status === 206) return true;
      }
    } catch {
      /* retry */
    } finally {
      clearTimeout(t);
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
  return false;
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

function runFfprobe(url) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=bit_rate,sample_rate", "-of", "json", url],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;
  try {
    const json = JSON.parse(r.stdout);
    const stream = json?.streams?.[0];
    if (!stream) return null;
    return {
      bitrateKbps: stream.bit_rate ? Number(stream.bit_rate) / 1000 : null,
      sampleRateHz: stream.sample_rate ? Number(stream.sample_rate) : null,
    };
  } catch {
    return null;
  }
}

function runClippingProbe(url) {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", url, "-af", "volumedetect", "-vn", "-sn", "-dn", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  if (r.status !== 0) return null;
  const text = `${r.stdout}\n${r.stderr}`;
  const m = text.match(/max_volume:\s*([+-]?\d+(?:\.\d+)?)\s*dB/i);
  return m ? { maxVolumeDb: Number(m[1]) } : null;
}

function runLufsProbe(url) {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", url, "-af", "ebur128=peak=true", "-f", "null", "-"],
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

async function readStratifiedGate() {
  const gatePath = await resolveProjectPath("docs/AUDIO_QA.stratified-gate.json");
  try {
    const raw = await fs.readFile(gatePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeStratifiedGate(payload) {
  const gatePath = await resolveProjectPath("docs/AUDIO_QA.stratified-gate.json");
  await fs.mkdir(path.dirname(gatePath), { recursive: true });
  await fs.writeFile(gatePath, JSON.stringify(payload, null, 2), "utf8");
}

async function writeFullAuditGate(payload) {
  const gatePath = await resolveProjectPath("docs/AUDIO_QA.full-audit-gate.json");
  await fs.mkdir(path.dirname(gatePath), { recursive: true });
  await fs.writeFile(gatePath, JSON.stringify(payload, null, 2), "utf8");
}

async function syncAudioRegistry(results, updatedAt, auditedIds) {
  const registryPath = await resolveProjectPath("public/data/audio/audio-registry.json");
  const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));
  const passedIds = new Set(
    results.filter((r) => r.okCompleteness && !r.skipped).map((r) => r.reciterId),
  );
  const audited = new Set(auditedIds ?? results.map((r) => r.reciterId));

  for (const rec of registry.reciters ?? []) {
    if (!audited.has(rec.id)) continue;
    const passed = passedIds.has(rec.id);
    rec.verified = passed;
    rec.filesPresent = passed ? EXPECTED_TOTAL_AYAHS : 0;
    if (passed) {
      rec.qaPassedAt = updatedAt;
      rec.folder = FOLDER_BY_RECITER_ID[rec.id] ?? rec.folder;
    } else {
      delete rec.qaPassedAt;
    }
  }
  registry.updatedAt = updatedAt.slice(0, 10);
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), "utf8");
  const allVerified = (registry.reciters ?? []).filter((r) => r.verified).map((r) => r.id);
  console.log(`[audit-audio] registry synced — verified: ${allVerified.join(", ") || "(none)"}`);
}

async function writeAudioSourcesMd(results, updatedAt) {
  const mdPath = await resolveProjectPath("docs/AUDIO_SOURCES.md");
  const reciterMeta = {
    husary: { name: "محمود خليل الحصري", folder: "Husary_128kbps" },
    minshawi: { name: "محمد صديق المنشاوي", folder: "Minshawy_Murattal_128kbps" },
    alafasy: { name: "مشاري راشد العفاسي", folder: "Alafasy_128kbps" },
  };
  const qaById = new Map(results.map((r) => [r.reciterId, r]));

  const rows = Object.entries(reciterMeta)
    .map(([id, meta]) => {
      const qa = qaById.get(id);
      const passed = qa?.okCompleteness && !qa?.skipped;
      const status = passed ? "✅ PASS" : qa ? "❌ FAIL" : "—";
      const checked = qa?.completenessChecked ?? 0;
      const missing = qa?.missingCount ?? "—";
      return `| \`${id}\` | ${meta.name} | 128 | \`${meta.folder}\` | ${status} | ${checked} | ${missing} | ${updatedAt.slice(0, 10)} |`;
    })
    .join("\n");

  const passedList = results
    .filter((r) => r.okCompleteness && !r.skipped)
    .map((r) => r.reciterId);

  const md = `# مصادر الصوت (تلاوة / أذان / تفسير صوتي)

## تلاوة القرآن (Ayah-level) — EveryAyah

| reciterId | القارئ | kbps | reciter_folder | QA | checked | missing | آخر فحص |
|---|---|---:|---|---|---:|---:|---|
${rows}

- **النمط:** \`https://everyayah.com/data/{folder}/{SSS}{AAA}.mp3\`
- **السماح:** بث آية بآية — لا ملفات صوتية في حزمة التطبيق
- **القرّاء المعروضون في التطبيق:** ${passedList.length ? passedList.map((id) => `\`${id}\``).join("، ") : "*(لا أحد — لم يجتز الفحص الكامل)*"}
- **QA:** \`pnpm run audit:audio:stratified\` ثم \`pnpm run audit:audio:full\`
- **بوابة:** \`docs/AUDIO_QA.full-audit-gate.json\`

### احتياط Islamic Network CDN
- \`https://cdn.islamic.network/quran/audio/128/{edition}/{ayahNumber}.mp3\`

## تلاوة (Surah-level)
- \`mp3quran.net\` — تنزيل دون اتصال عبر \`quran-audio-downloads.ts\`

---

## الأذان — مصدر CDN والنسبة

### المستودع
- **GitHub/CDN:** [mohsalvi/adhan-audio](https://github.com/mohsalvi/adhan-audio)
- **CDN base:** \`https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main\`

### الملفات المُنزَّلة (عبر \`pnpm run generate:adhan-bundle\`)

| ملف محلي | مصدر CDN | الاستخدام |
|---|---|---|
| \`adhan-makkah-full.m4a\` | \`general/makkah-haram-02.mp3\` | تشغيل داخل التطبيق (~28ث) |
| \`adhan-madinah-full.m4a\` | \`general/madinah-02.mp3\` | تشغيل داخل التطبيق (~28ث) |
| \`adhan-egypt-full.m4a\` | \`general/egypt-traditional-02.mp3\` | تشغيل داخل التطبيق (~28ث) |
| \`adhan-haram-full.m4a\` | \`general/al-haram-01.mp3\` | تشغيل داخل التطبيق (~28ث) |
| \`adhan-aqsa-full.mp3\` | \`general/al-aqsa-jerusalem-02.mp3\` | تشغيل داخل التطبيق (~28ث) |
| \`adhan-makkah-fajr.mp3\` | \`fajr/makkah-fajr-01.mp3\` | فجر — تثويب |
| \`adhan-takbeerat-short.mp3\` | \`general/madinah-02.mp3\` (مقطع قصير) | تكبيرات |
| \`ios/.../adhan-short-*.caf\` | مقاطع ≤~12ث من المصادر أعلاه | **نغمة إشعار iOS ≤30ث** |
| \`ios/.../adhan-seq-makkah-0N.caf\` | \`makkah-haram-02.mp3\` (4×~28ث) | سلسلة إشعارات تجريبية |
| \`android/res/raw/adhan_*.mp3\` | mirrors للـ CAF | Android notifications |

### الترخيص والنسبة
- **الترخيص:** تسجيلات أذان عامة منشورة في مستودع \`mohsalvi/adhan-audio\` — **يجب مراجعة README/TR LICENSE في ذلك المستودع قبل الإصدار التجاري.**
- **نص النسبة في التطبيق:** «أذان — تسجيلات عامة منشورة عبر mohsalvi/adhan-audio (jsDelivr CDN).»
- **CREDITS:** يُحدَّث في \`CREDITS.md\` عند اعتماد نسخة نهائية.
- **توليد الحزمة:** \`node scripts/adhan-audio/generate-adhan-bundle.mjs\` — يتحقق أن كل \`.caf\` إشعار **≤30 ثانية** (\`afinfo\`).

### فجر منفصل
- إشعار iOS: \`adhan-short-makkah-fajr.caf\` (من \`fajr/makkah-fajr-01.mp3\`)
- تشغيل كامل داخل التطبيق: \`adhan-makkah-fajr.mp3\`

---

## التفسير الصوتي

- الكتالوج: \`public/data/tafsir-audio-catalog.json\` — **فارغ حتى توثيق الترخيص**
- **واجهة المستخدم مخفية** (لا معطّلة) حتى توثيق \`attributionVerified\` في الكتالوج
- خريطة seek: \`public/data/tafsir-audio-map.json\`
`;
  await fs.writeFile(mdPath, md, "utf8");
}

async function auditReciter(rec, opts) {
  const folder = FOLDER_BY_RECITER_ID[rec.id];
  if (!folder) {
    return { reciterId: rec.id, ok: false, skipped: true, reason: "missing folder mapping" };
  }

  console.log(`[audit-audio] Reciter ${rec.id} (${rec.name ?? "?"}) mode=${opts.mode} n=${opts.pairs.length}`);

  const missing = [];
  await poolMap(opts.pairs, opts.headConcurrency, async ({ surah, ayah }) => {
    const url = everyAyahUrl(folder, surah, ayah);
    const ok = await headOk(url);
    if (!ok) missing.push({ surah, ayah });
    return ok;
  });

  // جولة ثانية للملفات الناقصة — transient/rate-limit
  if (missing.length > 0 && missing.length <= 64) {
    console.log(`[audit-audio] ${rec.id}: retrying ${missing.length} missing…`);
    const stillMissing = [];
    for (const { surah, ayah } of missing) {
      const url = everyAyahUrl(folder, surah, ayah);
      await new Promise((r) => setTimeout(r, 250));
      const ok = await headOk(url, 12000, 5);
      if (!ok) stillMissing.push({ surah, ayah });
    }
    missing.length = 0;
    missing.push(...stillMissing);
  }

  const okCompleteness = missing.length === 0;
  const qualitySample = opts.pairs.slice(0, Math.min(opts.sampleLimit, opts.pairs.length));
  let sampleReport = [];
  if (opts.ffprobeOk && opts.ffmpegOk && qualitySample.length > 0) {
    sampleReport = await poolMap(qualitySample, 4, async ({ surah, ayah }) => {
      const url = everyAyahUrl(folder, surah, ayah);
      return {
        surah,
        ayah,
        url,
        probe: runFfprobe(url),
        clip: runClippingProbe(url),
        lufs: runLufsProbe(url),
      };
    });
  }

  const lufsValues = sampleReport
    .map((s) => s.lufs?.integratedLufs)
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  const avgLufs =
    lufsValues.length > 0 ? lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length : null;

  return {
    reciterId: rec.id,
    okCompleteness,
    completenessChecked: opts.pairs.length,
    missingCount: missing.length,
    missingSample: missing.slice(0, 20),
    avgIntegratedLufs: avgLufs,
    mode: opts.mode,
    sampleReport,
  };
}

async function writeReports(payload, results, auditedIds) {
  const outPath = await resolveProjectPath("docs/AUDIO_QA.last-audit.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  let mergedResults = results;
  const audited = new Set(auditedIds ?? results.map((r) => r.reciterId));
  if (audited.size < results.length || audited.size > 0) {
    try {
      const prev = JSON.parse(await fs.readFile(outPath, "utf8"));
      const kept = (prev.results ?? []).filter((r) => !audited.has(r.reciterId));
      mergedResults = [...kept, ...results];
    } catch {
      mergedResults = results;
    }
  }

  await fs.writeFile(outPath, JSON.stringify({ ...payload, results: mergedResults }, null, 2), "utf8");

  const mdPath = await resolveProjectPath("docs/AUDIO_QA.md");
  const mdRows = mergedResults
    .map((r) => {
      const status = r.skipped ? "skip" : r.okCompleteness ? "pass" : "fail";
      const lufs =
        r.avgIntegratedLufs != null ? `${r.avgIntegratedLufs.toFixed(1)} LUFS` : "n/a";
      return `| \`${r.reciterId}\` | EveryAyah 128 | ${r.completenessChecked ?? 0} | ${status} | ${lufs} | ${r.mode ?? "?"} |`;
    })
    .join("\n");
  const md = `# جودة الصوت (Audio QA)

## مصدر الفحص
- \`pnpm run audit:audio:stratified\` — 200 ملف/قارئ (بوابة)
- \`pnpm run audit:audio:full\` — 6236 ملف (ليلاً)
- النتيجة: \`docs/AUDIO_QA.last-audit.json\`

## جدول QA

| reciterId | المصدر | checked | status | LUFS | mode |
|---|---|---:|---|---|---|
${mdRows}

> آخر تحديث: ${payload.updatedAt} — mode=${payload.mode}
`;
  await fs.writeFile(mdPath, md, "utf8");
  return mergedResults;
}

async function main() {
  const mode =
    process.env.AUDIT_AUDIO_MODE ??
    (process.env.AUDIT_AUDIO_QUICK === "1" ? "quick" : "stratified");

  const registryPath = await resolveProjectPath("public/data/audio/audio-registry.json");
  const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));
  let recitersToAudit = (registry?.reciters ?? []).filter(
    (r) => AUDIT_CANDIDATE_IDS.includes(r.id) && typeof r.id === "string",
  );
  if (recitersToAudit.length === 0) {
    recitersToAudit = AUDIT_CANDIDATE_IDS.map((id) => ({ id, name: id }));
  }

  const reciterFilter = process.env.AUDIT_AUDIO_RECITER_IDS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (reciterFilter?.length) {
    const allowed = new Set(reciterFilter);
    recitersToAudit = recitersToAudit.filter((r) => allowed.has(r.id));
    console.log(`[audit-audio] limited to: ${reciterFilter.join(", ")}`);
  }

  const ffprobeOk = hasBin("ffprobe");
  const ffmpegOk = hasBin("ffmpeg");
  const headConcurrency = Number(
    process.env.AUDIT_AUDIO_HEAD_CONCURRENCY ?? (mode === "full" ? 6 : 12),
  );
  const sampleLimit = Number(process.env.AUDIT_AUDIO_SAMPLE_LIMIT ?? 30);
  const stratifiedCount = Number(process.env.AUDIT_AUDIO_STRATIFIED_COUNT ?? 200);

  console.log(`[audit-audio] mode=${mode} ffprobe=${ffprobeOk} ffmpeg=${ffmpegOk}`);

  if (mode === "full") {
    const gate = await readStratifiedGate();
    if (gate?.passedReciterIds?.length) {
      const allowed = new Set(gate.passedReciterIds);
      recitersToAudit = recitersToAudit.filter((r) => allowed.has(r.id));
      console.log(`[audit-audio] full run limited to stratified-pass: ${[...allowed].join(", ")}`);
    } else {
      console.warn("[audit-audio] WARNING: no stratified gate — running full for all candidates");
    }
  }

  const results = [];
  for (const rec of recitersToAudit) {
    let pairs;
    if (mode === "full") pairs = buildAllPairs();
    else if (mode === "quick") {
      pairs = buildAllPairs().slice(0, Number(process.env.AUDIT_AUDIO_COMPLETENESS_LIMIT ?? 50));
    } else {
      pairs = buildStratifiedPairs(stratifiedCount);
    }

    const result = await auditReciter(rec, {
      mode,
      pairs,
      headConcurrency,
      sampleLimit,
      ffprobeOk,
      ffmpegOk,
    });
    results.push(result);

    console.log(
      `[audit-audio] ${rec.id}: ${result.okCompleteness ? "PASS" : "FAIL"} missing=${result.missingCount}/${result.completenessChecked}`,
    );
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    mode,
    ffprobeOk,
    ffmpegOk,
    stratifiedCount: mode === "stratified" ? stratifiedCount : undefined,
  };

  const mergedResults = await writeReports(payload, results, recitersToAudit.map((r) => r.id));
  await writeAudioSourcesMd(mergedResults, payload.updatedAt);

  if (mode === "full") {
    const passedReciterIds = results.filter((r) => r.okCompleteness && !r.skipped).map((r) => r.reciterId);
    const failedReciterIds = results.filter((r) => !r.okCompleteness && !r.skipped).map((r) => r.reciterId);
    const prevGate = JSON.parse(
      await fs.readFile(await resolveProjectPath("docs/AUDIO_QA.full-audit-gate.json"), "utf8").catch(() => "{}"),
    );
    const auditedSet = new Set(recitersToAudit.map((r) => r.id));
    const mergedPassed = [
      ...(prevGate.passedReciterIds ?? []).filter((id) => !auditedSet.has(id)),
      ...passedReciterIds,
    ];
    const mergedFailed = [
      ...(prevGate.failedReciterIds ?? []).filter((id) => !auditedSet.has(id)),
      ...failedReciterIds,
    ].filter((id) => !mergedPassed.includes(id));
    await writeFullAuditGate({
      updatedAt: payload.updatedAt,
      passedReciterIds: mergedPassed,
      failedReciterIds: mergedFailed,
      passed: mergedFailed.length === 0 && mergedPassed.length > 0,
    });
    await syncAudioRegistry(
      results,
      payload.updatedAt,
      recitersToAudit.map((r) => r.id),
    );
  }

  if (mode === "stratified") {
    const passedReciterIds = results.filter((r) => r.okCompleteness && !r.skipped).map((r) => r.reciterId);
    const failedReciterIds = results.filter((r) => !r.okCompleteness && !r.skipped).map((r) => r.reciterId);
    await writeStratifiedGate({
      updatedAt: payload.updatedAt,
      passedReciterIds,
      failedReciterIds,
      passed: failedReciterIds.length === 0,
    });
    if (failedReciterIds.length > 0) {
      console.error(`[audit-audio] STRATIFIED FAILED for: ${failedReciterIds.join(", ")}`);
      console.error("[audit-audio] Do NOT run full audit for failed reciters.");
      process.exit(2);
    }
    console.log(`[audit-audio] STRATIFIED OK — safe to run: pnpm run audit:audio:full`);
  } else {
    const anyFail = mergedResults.some((r) => !r.okCompleteness && !r.skipped);
    if (anyFail) {
      console.error("[audit-audio] FAILED");
      process.exit(2);
    }
  }
}

await main();
