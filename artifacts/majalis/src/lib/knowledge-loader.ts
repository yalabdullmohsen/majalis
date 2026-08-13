/**
 * محمّل طبقة المعرفة الموحّدة (public/data/knowledge).
 * يعرض verified فقط كقطعي؛ needs_review يُمرَّر مع وسم ظاهر.
 */
export type KnowledgeEvidence = {
  type: "ayah" | "hadith" | "athar" | "quote";
  ref: string;
  text: string;
  grade?: string;
  graded_by?: string;
};

export type KnowledgeItem = {
  id: string;
  title: string;
  body: string;
  evidences: KnowledgeEvidence[];
  sources: { book: string; author: string; locator?: string }[];
  tags: string[];
  related: string[];
  review_status: "verified" | "needs_review";
  updated_at: string;
  section?: string;
  meta?: Record<string, unknown>;
};

const base = `${import.meta.env.BASE_PATH || "/"}data/knowledge`.replace(/\/{2,}/g, "/");

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function unwrap(raw: unknown): KnowledgeItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as KnowledgeItem[];
  const o = raw as { items?: KnowledgeItem[] };
  if (Array.isArray(o.items)) return o.items;
  if ((raw as KnowledgeItem).id) return [raw as KnowledgeItem];
  return [];
}

export async function loadKnowledgeManifest() {
  return fetchJson<{ version: number; totals: Record<string, number>; sections: string[] }>(
    `${base}/manifest.json`,
  );
}

export async function loadSectionItems(section: string): Promise<KnowledgeItem[]> {
  const map: Record<string, string[]> = {
    prophets: ["prophets"],
    nations: ["nations"],
    quiz: ["quiz"],
    "quran-people": ["quran-people/people.json"],
    tafsir: ["tafsir/surahs/all-surah-intros.json", "tafsir/ayahs/juz-amma-and-fatiha.json"],
    history: ["history/timeline.json"],
    "intro-islam": ["intro-islam/topics.json"],
    "discover-islam": ["discover-islam/path-and-faq.json"],
  };
  const paths = map[section];
  if (!paths) return [];
  const out: KnowledgeItem[] = [];
  if (section === "prophets" || section === "nations" || section === "quiz") {
    // قائمة ملفات عبر المانيفست المحلي: نجلب عبر محاولات معروفة
    const manifest = await loadKnowledgeManifest();
    void manifest;
  }
  for (const rel of paths) {
    if (rel.endsWith(".json") && rel.includes("/")) {
      const data = await fetchJson(`${base}/${rel}`);
      out.push(...unwrap(data));
    }
  }
  if (section === "prophets") {
    // جلب ملفات فردية عبر قائمة ثابتة من المانيفست المولَّد
    const slugs = [
      "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","is-haq","yaqub","yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman","ilyas","al-yasa","yunus","zakariyya","yahya","isa","muhammad",
    ];
    for (const slug of slugs) {
      const data = await fetchJson(`${base}/prophets/${slug}.json`);
      out.push(...unwrap(data));
    }
  }
  if (section === "nations") {
    const ids = [
      "nation-qawm-nuh","nation-aad","nation-thamud","nation-qawm-lut","nation-madyan","nation-firaun","nation-bani-israil","nation-ashab-sabt","nation-ashab-kahf","nation-ashab-ukhdud","nation-saba","nation-ashab-rass","nation-qawm-yunus","nation-ashab-janna","nation-tubba","nation-rum-furs",
    ];
    for (const id of ids) {
      const data = await fetchJson(`${base}/nations/${id}.json`);
      out.push(...unwrap(data));
    }
  }
  if (section === "quiz") {
    for (let i = 1; i <= 8; i++) {
      const data = await fetchJson(`${base}/quiz/batch-${String(i).padStart(3, "0")}.json`);
      out.push(...unwrap(data));
    }
  }
  return out;
}

export async function getKnowledgeItem(section: string, id: string): Promise<KnowledgeItem | null> {
  const items = await loadSectionItems(section);
  return items.find((x) => x.id === id) || null;
}

const PROGRESS_KEY = "majlis-knowledge-progress-v1";

export type KnowledgeProgress = {
  quizCorrect: string[];
  discoverStations: string[];
  lastQuizId?: string;
  lastDiscoverId?: string;
};

export function readKnowledgeProgress(): KnowledgeProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { quizCorrect: [], discoverStations: [] };
    return JSON.parse(raw) as KnowledgeProgress;
  } catch {
    return { quizCorrect: [], discoverStations: [] };
  }
}

export function writeKnowledgeProgress(p: KnowledgeProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function markDiscoverStation(id: string) {
  const p = readKnowledgeProgress();
  if (!p.discoverStations.includes(id)) p.discoverStations.push(id);
  p.lastDiscoverId = id;
  writeKnowledgeProgress(p);
}

export function markQuizCorrect(id: string) {
  const p = readKnowledgeProgress();
  if (!p.quizCorrect.includes(id)) p.quizCorrect.push(id);
  p.lastQuizId = id;
  writeKnowledgeProgress(p);
}
