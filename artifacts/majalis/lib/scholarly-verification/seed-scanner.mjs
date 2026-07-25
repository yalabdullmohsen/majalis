import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAdhkarFromSeedFile, parseArbaeenFromSeedFile } from '../verified-knowledge/seed-parsers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAJALIS_ROOT = path.resolve(__dirname, '../..');

function readJson(relativePath) {
  const full = path.join(MAJALIS_ROOT, relativePath);
  if (!fs.existsSync(full)) return [];
  const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.items ?? [];
}

function loadFromImportFiles() {
  const corpus = [];
  const imports = [
    { type: 'sheikh', file: 'data/import/01-sheikhs.json' },
    { type: 'lesson', file: 'data/import/02-kuwait-lessons.json' },
    { type: 'fawaid', file: 'data/import/03-fawaid.json' },
    { type: 'qa_question', file: 'data/import/04-qa.json' },
  ];
  for (const { type, file } of imports) {
    for (const item of readJson(file)) {
      corpus.push({
        content_type: type,
        content_id: String(item.id ?? item.external_key ?? item.title),
        item: normalizeSeedItem(item, type),
      });
    }
  }
  return corpus;
}

function loadFromSnapshots() {
  const corpus = [];
  const snapshotPath = path.join(MAJALIS_ROOT, 'scripts/platform-seed.snapshot.json');
  if (!fs.existsSync(snapshotPath)) return corpus;
  const snap = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const maps = [
    ['fiqh_council_item', snap.fiqh_decisions],
    ['fatwa', snap.fatwas],
    ['sharia_ruling', snap.rulings],
    ['annual_course', snap.courses],
  ];
  for (const [type, items] of maps) {
    for (const item of items ?? []) {
      corpus.push({
        content_type: type,
        content_id: String(item.id ?? item.slug),
        item: normalizeSeedItem(item, type),
      });
    }
  }
  return corpus;
}

function loadLessonsFromAds() {
  try {
    const adsPath = path.join(MAJALIS_ROOT, 'src/lib/lesson-ads.ts');
    const text = fs.readFileSync(adsPath, 'utf8');
    const blocks = text.match(/title:\s*"([^"]+)"/g) ?? [];
    return blocks.map((t, i) => ({
      id: `lesson-ad-${i}`,
      title: t.replace(/title:\s*"/, '').replace('"', ''),
      source_url: 'https://majlisilm.com/lessons',
      source_name: 'المجلس العلمي',
      category: 'درس',
    }));
  } catch {
    return [];
  }
}

function loadFawaidFromSeed() {
  try {
    const seedPath = path.join(MAJALIS_ROOT, 'src/lib/fawaid-seed.ts');
    const text = fs.readFileSync(seedPath, 'utf8');
    const items = [];
    const regex = /text:\s*"((?:\\.|[^"\\])*)"/g;
    let match;
    let i = 0;
    while ((match = regex.exec(text)) !== null) {
      items.push({
        id: `fawaid-${i++}`,
        text: match[1].replace(/\\"/g, '"'),
        author_name: 'المجلس العلمي',
        category: 'عام',
        source_url: 'https://majlisilm.com',
        source_name: 'المجلس العلمي',
      });
    }
    return items;
  } catch {
    return [];
  }
}

function loadQaFromSeed() {
  try {
    const seedPath = path.join(MAJALIS_ROOT, 'src/lib/qa-seed.ts');
    const text = fs.readFileSync(seedPath, 'utf8');
    const items = [];
    const blockRegex = /"id":\s*"(seed-qa-[^"]+)"[\s\S]*?"question":\s*"((?:\\.|[^"\\])*)"/g;
    let m;
    while ((m = blockRegex.exec(text)) !== null) {
      items.push({
        id: m[1],
        question: m[2].replace(/\\"/g, '"'),
        answer: 'جواب',
        category: 'فقه',
        source_url: 'https://majlisilm.com',
        source_name: 'المجلس العلمي',
      });
    }
    return items;
  } catch {
    return [];
  }
}

function loadArbaeen() {
  return parseArbaeenFromSeedFile().map((item) => ({
    id: item.id,
    title: item.title,
    text: item.text,
    source_url: item.source_url,
    source_name: item.source_name,
    category: 'حديث',
    trust_level: 95,
  }));
}

function loadAdhkar() {
  const { items } = parseAdhkarFromSeedFile();
  return items.map((item) => ({
    id: item.id,
    text: item.text,
    category: item.category_id,
    source_url: item.source_url,
    source_name: item.source_name ?? 'حصn المسلم',
    trust_level: 95,
  }));
}

function loadLibrary() {
  try {
    const p = path.join(MAJALIS_ROOT, 'src/lib/library-seed.ts');
    const text = fs.readFileSync(p, 'utf8');
    const titles = text.match(/title:\s*"([^"]+)"/g) ?? [];
    return titles.map((t, i) => ({
      id: `lib-${i}`,
      title: t.replace(/title:\s*"/, '').replace('"', ''),
      description: 'مرجع علمي',
      source_url: 'https://majlisilm.com/library',
      source_name: 'المكتبة العلمية',
      category: 'كتب',
    }));
  } catch {
    return [];
  }
}

export function loadSeedCorpus() {
  const corpus = [];
  const push = (type, items) => {
    for (const item of items) {
      const id = item.id ?? item.external_key ?? item.number ?? item.slug ?? item.title;
      if (!id) continue;
      corpus.push({ content_type: type, content_id: String(id), item: normalizeSeedItem(item, type) });
    }
  };

  push('lesson', loadLessonsFromAds());
  push('fawaid', loadFawaidFromSeed());
  push('qa_question', loadQaFromSeed());
  push('hadith', loadArbaeen());
  push('adhkar', loadAdhkar());
  push('library_item', loadLibrary());

  corpus.push(...loadFromImportFiles());
  corpus.push(...loadFromSnapshots());

  const seen = new Set();
  return corpus.filter((row) => {
    const key = `${row.content_type}:${row.content_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSeedItem(item, type) {
  return {
    ...item,
    title: item.title ?? item.text?.slice?.(0, 80) ?? item.question ?? item.name,
    content: item.content ?? item.text ?? item.answer ?? item.description ?? item.body ?? item.ruling_text,
    source_url: item.source_url ?? item.websiteUrl ?? item.book_url ?? item.external_url ?? defaultSourceUrl(type),
    source_name: item.source_name ?? item.sourceName ?? item.organizer ?? item.author_name ?? item.mufti_name ?? 'المجلس العلمي',
    category: item.category ?? 'عام',
    trust_level: item.trust_level ?? (item.verification_status === 'verified' ? 85 : 55),
  };
}

function defaultSourceUrl(type) {
  const map = {
    hadith: 'https://sunnah.com',
    adhkar: 'https://hisn.alim.net',
    lesson: 'https://majlisilm.com/lessons',
  };
  return map[type] ?? 'https://majlisilm.com';
}

export function countSeedItemsByType() {
  const corpus = loadSeedCorpus();
  const counts = {};
  for (const row of corpus) {
    counts[row.content_type] = (counts[row.content_type] ?? 0) + 1;
  }
  return { total: corpus.length, by_type: counts, corpus };
}
