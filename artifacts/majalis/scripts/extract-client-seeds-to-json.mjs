#!/usr/bin/env node
/**
 * يستخرج مصفوفات الـseed الثقيلة من وحدات TypeScript إلى JSON تحت public/data
 * حتى لا تُضمَّن في حزمة JavaScript للعميل.
 *
 * الاستخدام: node scripts/extract-client-seeds-to-json.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tmpDir = path.join(root, ".tmp-seed-extract");
const require = createRequire(import.meta.url);

function loadEsbuild() {
  const candidates = [
    path.resolve(root, "../../node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild"),
    path.resolve(root, "node_modules/esbuild"),
    "esbuild",
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* next */
    }
  }
  throw new Error("esbuild not found — run pnpm install from monorepo root");
}

const esbuild = loadEsbuild();

function writeChunks(outDir, items, { chunkSize = 400, groupBy } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of fs.readdirSync(outDir)) {
    if (name.endsWith(".json")) fs.unlinkSync(path.join(outDir, name));
  }

  /** @type {{ file: string; count: number; key?: string }[]} */
  const chunks = [];

  if (groupBy) {
    /** @type {Map<string, any[]>} */
    const groups = new Map();
    for (const item of items) {
      const key = String(groupBy(item) || "other");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    for (const [key, groupItems] of groups) {
      for (let i = 0; i < groupItems.length; i += chunkSize) {
        const slice = groupItems.slice(i, i + chunkSize);
        const file = `${key}-${String(chunks.length).padStart(3, "0")}.json`;
        fs.writeFileSync(path.join(outDir, file), JSON.stringify(slice));
        chunks.push({ file, count: slice.length, key });
      }
    }
  } else {
    for (let i = 0; i < items.length; i += chunkSize) {
      const slice = items.slice(i, i + chunkSize);
      const file = `chunk-${String(chunks.length).padStart(3, "0")}.json`;
      fs.writeFileSync(path.join(outDir, file), JSON.stringify(slice));
      chunks.push({ file, count: slice.length });
    }
  }

  const manifest = {
    version: 1,
    total: items.length,
    generatedAt: new Date().toISOString(),
    chunks,
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

async function bundleImport(entryRel) {
  fs.mkdirSync(tmpDir, { recursive: true });
  const outfile = path.join(tmpDir, `${path.basename(entryRel, path.extname(entryRel))}.mjs`);
  await esbuild.build({
    entryPoints: [path.join(root, entryRel)],
    bundle: true,
    format: "esm",
    platform: "neutral",
    outfile,
    logLevel: "error",
    packages: "bundle",
    mainFields: ["module", "main"],
    conditions: ["import", "module", "default"],
    alias: {
      "@": path.join(root, "src"),
    },
  });
  return import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
}

async function main() {
  console.log("→ bundling seed modules…");

  const [quiz, qa, stories, hadith, lessons] = await Promise.all([
    bundleImport("src/lib/quiz-seed.ts"),
    bundleImport("src/lib/qa-seed.ts"),
    bundleImport("src/lib/islamic-stories-seed.ts"),
    bundleImport("src/lib/verified-hadith-local-seed.ts"),
    bundleImport("src/lib/lessons-seed.ts"),
  ]);

  const quizItems = quiz.DEMO_QUIZ_QUESTIONS;
  const qaItems = qa.SEED_QA;
  const storyItems = stories.ISLAMIC_STORIES_SEED;
  const hadithItems = hadith.getLocalVerifiedHadith();
  const lessonItems = lessons.LESSONS_SEED;

  console.log("counts:", {
    quiz: quizItems.length,
    qa: qaItems.length,
    stories: storyItems.length,
    hadith: hadithItems.length,
    lessons: lessonItems.length,
  });

  const quizManifest = writeChunks(path.join(root, "public/data/quiz"), quizItems, {
    chunkSize: 250,
    groupBy: (q) => String(q.section || "general").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "general",
  });
  const qaManifest = writeChunks(path.join(root, "public/data/qa"), qaItems, {
    chunkSize: 200,
    groupBy: (q) => String(q.category_id || "uncategorized"),
  });
  const storiesManifest = writeChunks(path.join(root, "public/data/stories"), storyItems, {
    chunkSize: 40,
    groupBy: (s) => String(s.category || "other"),
  });
  const hadithManifest = writeChunks(path.join(root, "public/data/hadith-verified"), hadithItems, {
    chunkSize: 200,
    groupBy: (h) => String(h.authenticity_class || "other"),
  });
  const lessonsManifest = writeChunks(path.join(root, "public/data/lessons"), lessonItems, {
    chunkSize: 100,
  });

  // فئات QA صغيرة — تبقى في JSON منفصل للتحميل السريع
  fs.writeFileSync(
    path.join(root, "public/data/qa/categories.json"),
    JSON.stringify(qa.QA_CATEGORIES, null, 2),
  );

  console.log("✓ wrote manifests:", {
    quiz: quizManifest.total,
    qa: qaManifest.total,
    stories: storiesManifest.total,
    hadith: hadithManifest.total,
    lessons: lessonsManifest.total,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
