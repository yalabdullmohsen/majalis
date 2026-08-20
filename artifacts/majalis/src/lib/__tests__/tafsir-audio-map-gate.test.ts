/**
 * بوابة: خريطة التفسير الصوتي — ملفات موجودة ونقاط بداية ضمن المدة.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const catalog = JSON.parse(
  await readFile(resolve(root, "public/data/tafsir-audio-catalog.json"), "utf8"),
) as { clips?: Array<{ id: string; streamUrl?: string; duration?: number; enabled?: boolean }> };

const mapPayload = JSON.parse(
  await readFile(resolve(root, "public/data/tafsir-audio-map.json"), "utf8"),
) as {
  maps?: Array<{
    clipId: string;
    surah: number;
    segments: Array<{ ayah: number; startSec: number }>;
  }>;
};

const clips = catalog.clips ?? [];
const maps = mapPayload.maps ?? [];

if (!clips.length) {
  console.log("tafsir-audio-map-gate: skip (empty catalog — UI hidden)");
  process.exit(0);
}

const clipById = new Map(clips.map((c) => [c.id, c]));

for (const m of maps) {
  const clip = clipById.get(m.clipId);
  assert.ok(clip, `map clipId ${m.clipId} missing in catalog`);
  assert.ok(clip.streamUrl, `${m.clipId} بلا streamUrl`);
  for (const seg of m.segments ?? []) {
    assert.ok(Number.isFinite(seg.startSec) && seg.startSec >= 0, `${m.clipId} ayah ${seg.ayah} startSec`);
    if (clip.duration != null) {
      assert.ok(seg.startSec < clip.duration, `${m.clipId} startSec ${seg.startSec} ≥ duration ${clip.duration}`);
    }
  }
}

console.log("tafsir-audio-map-gate.test.ts: ok");
