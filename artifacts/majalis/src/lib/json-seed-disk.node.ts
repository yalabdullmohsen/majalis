/**
 * Node-only disk reader for JSON seeds under /public/data.
 * Must never be statically imported from browser entry graphs.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function readSeedJsonFromDisk(urlPath: string): Promise<unknown | null> {
  const candidates = [
    resolve(process.cwd(), "public" + urlPath),
    resolve(process.cwd(), "artifacts/majalis/public" + urlPath),
  ];
  for (const file of candidates) {
    try {
      const raw = await readFile(file, "utf8");
      return JSON.parse(raw) as unknown;
    } catch {
      /* try next */
    }
  }
  return null;
}
