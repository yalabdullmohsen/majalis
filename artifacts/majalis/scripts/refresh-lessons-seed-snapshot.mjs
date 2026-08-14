/**
 * يعيد بناء scripts/lessons-seed.snapshot.json من lesson-ads + catalog
 * (speaker من تسمية الجلسة، organizer منفصل — بلا تخمين أدوار).
 */
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");

const { buildLessonsSeed } = await import(
  new URL("../src/lib/lessons-seed.ts", import.meta.url).href
);

const rows = await buildLessonsSeed();
const out = resolve(appRoot, "scripts/lessons-seed.snapshot.json");
await writeFile(out, `${JSON.stringify(rows, null, 2)}\n`, "utf8");

const sample = rows.find((r) => String(r.id).includes("ajraa-murtaqa-course-3-0"));
console.log(
  JSON.stringify(
    {
      total: rows.length,
      sampleId: sample?.id,
      sampleTitle: sample?.title,
      sampleSpeaker: sample?.speaker_name,
      sampleOrganizer: sample?.organizer_name,
    },
    null,
    2,
  ),
);
