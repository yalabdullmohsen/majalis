/** أداة اختبار فقط: تحميل ملف سورة محلي مباشرة من public/data/quran/ بلا شبكة. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { SurahDetail } from "@/lib/quran-api";

const __dir = dirname(fileURLToPath(import.meta.url));
const QURAN_DATA_DIR = join(__dir, "../../../../public/data/quran");

export function loadLocalSurah(surahNumber: number): SurahDetail {
  const padded = String(surahNumber).padStart(3, "0");
  const raw = readFileSync(join(QURAN_DATA_DIR, `surah-${padded}.json`), "utf8");
  return JSON.parse(raw) as SurahDetail;
}
