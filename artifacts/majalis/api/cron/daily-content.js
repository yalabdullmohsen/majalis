/**
 * Daily content refresh cron — validates content manifest and returns inventory stats.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

function countJsonArray(rel) {
  const data = readJson(rel);
  return Array.isArray(data) ? data.length : 0;
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || req.headers["x-cron-secret"] || "";
  const secret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET || "";
  if (secret && auth !== `Bearer ${secret}` && auth !== secret) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const manifest = readJson("public/content/manifest.json") || {};
  const hadithIndex = readJson("public/content/hadith/index.json") || {};

  const stats = {
    ok: true,
    refreshedAt: new Date().toISOString(),
    kuwaitDay: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date()),
    manifest,
    counts: {
      adhkar: countJsonArray("public/content/adhkar-full.json"),
      hadithDailyPool: countJsonArray("public/content/hadith/daily-pool.json"),
      hadithTotal: hadithIndex.totalHadiths || 0,
      ayah: countJsonArray("public/content/daily-ayah-pool.json"),
      wisdom: countJsonArray("public/content/daily-wisdom-pool.json"),
      library: countJsonArray("public/content/library-catalog.json"),
      sheikhs: countJsonArray("public/content/sheikhs-catalog.json"),
    },
    dailyTypes: [
      "hadith",
      "ayah",
      "dhikr",
      "dua",
      "faida",
      "question",
      "wisdom",
      "book-week",
      "scholar-week",
      "lesson-week",
    ],
  };

  res.status(200).json(stats);
}
