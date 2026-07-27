import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirnameFromMeta = (metaUrl) => path.dirname(fileURLToPath(metaUrl));

export function createSeerahRoundRunner({
  metaUrl,
  round,
  roundAr,
  quizStart,
  quizEnd,
  qaStart,
  qaEnd,
  storyStart,
  storyEnd,
  quizItems,
  qaItems,
  fawaidItems,
  storyItems,
  pmItems,
}) {
  const __dirname = __dirnameFromMeta(metaUrl);
  const root = path.join(__dirname, "..");
  const lib = path.join(root, "src/lib");
  const storySlugs = storyItems.map((s) => s.slug);
  const pmIds = pmItems.map((x) => x.id);
  const js = (value) => JSON.stringify(value);

  function insertBeforeAny(content, markers, block) {
    for (const marker of markers) {
      const idx = content.lastIndexOf(marker);
      if (idx !== -1) return content.slice(0, idx) + block + content.slice(idx);
    }
    throw new Error(`Cannot find closing marker: ${markers.join(" | ")}`);
  }

  function renderObject(item) {
    return JSON.stringify(item, null, 2)
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
  }

  function renderQuizItem(q) {
    return `  {
    "id": "demo-quiz-${q.id}",
    "section": ${js(q.section)},
    "category": ${js(q.category)},
    "level": ${js(q.level)},
    "question": ${js(q.question)},
    "answer": ${js(q.answer)},
    "explanation": ${js(q.explanation)},
    "reference": ${js(q.reference)},
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;
  }

  function renderQaItem(q) {
    return `  {
    "id": "seed-qa-${q.id}",
    "question": ${js(q.question)},
    "answer": ${js(q.answer)},
    "category_id": ${js(q.category_id)},
    "ruling_type": ${js(q.ruling_type)},
    "evidence": "",
    "reference": ${js(q.reference)},
    "status": "published",
    "review_status": "approved",
    "created_at": "2024-05-12T15:00:00.000Z",
    "qa_categories": { "name": ${js(q.cat_name)}, "slug": ${js(q.cat_slug)} },
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;
  }

  function renderFawaidItem(f) {
    return `  { text: ${js(f.text)}, category: ${js(f.category)}, source: ${js(f.source)}, author_name: ${js(f.author_name)}, status: "approved", verification_status: "verified" }`;
  }

  function readTsExport(file, exportName) {
    const src = fs.readFileSync(path.join(lib, file), "utf8");
    const anchor = `export const ${exportName}`;
    const startIdx = src.indexOf(anchor);
    if (startIdx === -1) throw new Error(`Cannot find ${exportName}`);
    const arrStart = src.indexOf("[", src.indexOf("=", startIdx));
    let depth = 0;
    let inStr = null;
    let escape = false;
    for (let i = arrStart; i < src.length; i++) {
      const c = src[i];
      if (inStr) {
        if (escape) {
          escape = false;
          continue;
        }
        if (c === "\\") {
          escape = true;
          continue;
        }
        if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        inStr = c;
        continue;
      }
      if (c === "[") depth++;
      if (c === "]") {
        depth--;
        if (depth === 0) return Function(`"use strict"; return (${src.slice(arrStart, i + 1)});`)();
      }
    }
    throw new Error(`Cannot parse ${exportName}`);
  }

  function assertSourceData() {
    const problems = [];
    if (quizItems.length !== 50) problems.push(`QUIZ_ITEMS length ${quizItems.length}`);
    if (qaItems.length !== 40) problems.push(`QA_ITEMS length ${qaItems.length}`);
    if (fawaidItems.length !== 25) problems.push(`FAWAID_ITEMS length ${fawaidItems.length}`);
    if (storyItems.length !== 5) problems.push(`STORY_ITEMS length ${storyItems.length}`);
    if (pmItems.length !== 5) problems.push(`PM_ITEMS length ${pmItems.length}`);
    if (new Set(storySlugs).size !== storySlugs.length) problems.push("duplicate story slugs");
    for (const q of quizItems) {
      if ((q.answer || "").length < 60) problems.push(`short quiz answer ${q.id}`);
      if ((q.explanation || "").length < 80) problems.push(`short quiz explanation ${q.id}`);
    }
    for (const q of qaItems) {
      if ((q.answer || "").length < 90) problems.push(`short QA answer ${q.id}`);
    }
    for (const f of fawaidItems) {
      if ((f.text || "").length < 145) problems.push(`short fawaid ${f.source}`);
    }
    for (const s of storyItems) {
      if ((s.full_content || "").length < 500) problems.push(`short story ${s.slug}`);
    }
    const texts = [
      ...quizItems.flatMap((q) => [q.section, q.category, q.level, q.question, q.answer, q.explanation, q.reference]),
      ...qaItems.flatMap((q) => [q.question, q.answer, q.ruling_type, q.reference, q.cat_name]),
      ...fawaidItems.flatMap((f) => [f.text, f.category, f.source, f.author_name]),
      ...storyItems.flatMap((s) => [s.title, s.category, s.era, s.summary, s.full_content, ...s.key_lessons, ...s.related_figures, ...s.sources, ...s.tags]),
      ...pmItems.flatMap((p) => [p.name, p.arabicName, p.category, p.hadith, p.hadithSource, ...p.benefits, p.body, p.disclaimer]),
    ].filter(Boolean);
    if (texts.some((text) => /[A-Za-z]{3,}/.test(text))) problems.push("latin text leak in Arabic content");
    if (problems.length) throw new Error(`Invalid r${round} source data: ${problems.join(", ")}`);
  }

  function addSeeds(apply) {
    assertSourceData();
    const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0, pm: 0 };

    const quizPath = path.join(lib, "quiz-seed.ts");
    let quizContent = fs.readFileSync(quizPath, "utf8");
    if (!quizContent.includes(`demo-quiz-${quizStart}`)) {
      const block = `  /* ───────── جولة ${roundAr}: السيرة والشمائل (${quizStart}-${quizEnd}) ───────── */\n` + quizItems.map(renderQuizItem).join(",\n");
      if (apply) fs.writeFileSync(quizPath, insertBeforeAny(quizContent, ["\n];"], ",\n" + block + "\n"), "utf8");
      stats.quiz = quizItems.length;
    }

    const qaPath = path.join(lib, "qa-seed.ts");
    let qaContent = fs.readFileSync(qaPath, "utf8");
    if (!qaContent.includes(`seed-qa-${qaStart}`)) {
      const block = qaItems.map(renderQaItem).join(",\n");
      if (apply) fs.writeFileSync(qaPath, insertBeforeAny(qaContent, ["\n];"], ",\n" + block + "\n"), "utf8");
      stats.qa = qaItems.length;
    }

    const fawaidPath = path.join(lib, "fawaid-curated-seed.ts");
    let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
    if (!fawaidContent.includes(`إضافات جولة ${roundAr}`)) {
      const block = `  /* ── إضافات جولة ${roundAr} ── */\n` + fawaidItems.map(renderFawaidItem).join(",\n");
      if (apply) fs.writeFileSync(fawaidPath, insertBeforeAny(fawaidContent, ["\n];"], ",\n" + block + "\n"), "utf8");
      stats.fawaid = fawaidItems.length;
    }

    const storiesPath = path.join(lib, "islamic-stories-seed.ts");
    let storiesContent = fs.readFileSync(storiesPath, "utf8");
    if (!storiesContent.includes(`story-r${round}-1`)) {
      const block = `  /* ────────── جولة ${roundAr}: قصص السيرة (${storyStart}-${storyEnd}) ────────── */\n` + storyItems.map(renderObject).join(",\n");
      if (apply) fs.writeFileSync(storiesPath, insertBeforeAny(storiesContent, ["\n] as IslamicStorySeed[];", "\n];"], ",\n" + block + "\n"), "utf8");
      stats.stories = storyItems.length;
    }

    const pmPath = path.join(lib, "prophetic-medicine-seed.ts");
    let pmContent = fs.readFileSync(pmPath, "utf8");
    if (!pmContent.includes(pmIds[0])) {
      const block = `/* ── إضافات جولة ${roundAr}: طب نبوي بمنهجية التثبت ── */\n` + pmItems.map(renderObject).join(",\n");
      if (apply) fs.writeFileSync(pmPath, insertBeforeAny(pmContent, ["\n];"], ",\n" + block + "\n"), "utf8");
      stats.pm = pmItems.length;
    }

    return stats;
  }

  function countRoundFawaid() {
    const src = fs.readFileSync(path.join(lib, "fawaid-curated-seed.ts"), "utf8");
    const marker = `إضافات جولة ${roundAr}`;
    const start = src.indexOf(marker);
    if (start === -1) return { count: 0, short: 0 };
    const rest = src.slice(start + marker.length);
    const next = rest.search(/إضافات جولة [٠-٩]+/);
    const block = next === -1 ? rest : rest.slice(0, next);
    const texts = [...block.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
    return { count: texts.length, short: texts.filter((t) => t.length < 145).length };
  }

  function maxNumericId(items, prefix) {
    return Math.max(...items.map((x) => parseInt((x.id || "").replace(prefix, ""), 10)).filter(Number.isFinite));
  }

  async function verifyCounts() {
    const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
    const qa = readTsExport("qa-seed.ts", "SEED_QA");
    const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
    const pm = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
    const fawaid = countRoundFawaid();
    const quizRound = quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= quizStart && n <= quizEnd;
    });
    const qaRound = qa.filter((q) => {
      const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
      return n >= qaStart && n <= qaEnd;
    });
    const storiesRound = stories.filter((s) => storySlugs.includes(s.slug));
    const pmRound = pm.filter((x) => pmIds.includes(x.id));
    return {
      [`quizRound${round}`]: quizRound.length,
      [`quizRound${round}ShortAnswers`]: quizRound.filter((q) => (q.answer || "").length < 60).length,
      [`quizRound${round}ShortExpl`]: quizRound.filter((q) => (q.explanation || "").length < 80).length,
      [`qaRound${round}`]: qaRound.length,
      [`qaRound${round}ShortAnswers`]: qaRound.filter((q) => (q.answer || "").length < 90).length,
      [`fawaidRound${round}Block`]: fawaid.count,
      [`fawaidRound${round}Short145`]: fawaid.short,
      [`storiesRound${round}`]: storiesRound.length,
      [`storiesRound${round}ShortContent`]: storiesRound.filter((s) => (s.full_content || "").length < 500).length,
      [`pmRound${round}`]: pmRound.length,
      quizTotal: quiz.length,
      qaTotal: qa.length,
      fawaidCuratedRoundCount: fawaid.count,
      storiesTotal: stories.length,
      pmTotal: pm.length,
      roundLastQuizId: quizRound.length ? `demo-quiz-${maxNumericId(quizRound, "demo-quiz-")}` : null,
      roundLastQaId: qaRound.length ? `seed-qa-${maxNumericId(qaRound, "seed-qa-")}` : null,
      roundLastStorySlug: storiesRound.at(-1)?.slug,
      lastQuizId: `demo-quiz-${maxNumericId(quiz, "demo-quiz-")}`,
      lastQaId: `seed-qa-${maxNumericId(qa, "seed-qa-")}`,
      lastStorySlug: stories.at(-1)?.slug,
      [`pmRound${round}Ids`]: pmRound.map((x) => x.id),
    };
  }

  async function run() {
    const apply = process.argv.includes("--apply");
    const verify = process.argv.includes("--verify");
    const results = { seeds: addSeeds(apply) };
    if (apply || verify) results.after = await verifyCounts();
    console.log(JSON.stringify(results, null, 2));
    if (verify) {
      const a = results.after || {};
      const fail =
        a[`quizRound${round}`] !== 50 ||
        a[`quizRound${round}ShortAnswers`] > 0 ||
        a[`quizRound${round}ShortExpl`] > 0 ||
        a[`qaRound${round}`] !== 40 ||
        a[`qaRound${round}ShortAnswers`] > 0 ||
        a[`fawaidRound${round}Block`] !== 25 ||
        a[`fawaidRound${round}Short145`] > 0 ||
        a[`storiesRound${round}`] !== 5 ||
        a[`storiesRound${round}ShortContent`] > 0 ||
        a[`pmRound${round}`] !== 5 ||
        a.roundLastQuizId !== `demo-quiz-${quizEnd}` ||
        a.roundLastQaId !== `seed-qa-${qaEnd}` ||
        a.roundLastStorySlug !== `story-r${round}-5`;
      process.exit(fail ? 1 : 0);
    }
  }

  return { run };
}
