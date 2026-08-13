/**
 * محمّل طبقة المعرفة الموحّدة (public/data/knowledge).
 * كاش IndexedDB عبر fetchStaticJsonCached؛ تقدّم محلي + مزامنة اختيارية.
 */
import { fetchStaticJsonCached } from "@/lib/static-json-cache";

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

const base = `${String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}data/knowledge`.replace(
  /\/{2,}/g,
  "/",
);

function unwrap(raw: unknown): KnowledgeItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as KnowledgeItem[];
  const o = raw as { items?: KnowledgeItem[] };
  if (Array.isArray(o.items)) return o.items;
  if ((raw as KnowledgeItem).id) return [raw as KnowledgeItem];
  return [];
}

async function loadJson(rel: string): Promise<unknown> {
  return fetchStaticJsonCached(`${base}/${rel}`, null);
}

export function sectionForKnowledgeId(id: string): string {
  if (id.startsWith("prophet-")) return "prophets";
  if (id.startsWith("nation-")) return "nations";
  if (id.startsWith("quiz-")) return "quiz";
  if (id.startsWith("person-")) return "quran-people";
  if (id.startsWith("tafsir-")) return "tafsir";
  if (id.startsWith("history-")) return "history";
  if (id.startsWith("intro-")) return "intro-islam";
  if (id.startsWith("discover-")) return "discover-islam";
  return "intro-islam";
}

export function knowledgeHref(id: string): string {
  return `/knowledge/${sectionForKnowledgeId(id)}/${encodeURIComponent(id)}`;
}

export async function loadKnowledgeManifest() {
  return (await loadJson("manifest.json")) as {
    version: number;
    totals: Record<string, number>;
    sections: string[];
  } | null;
}

export async function loadSectionItems(section: string): Promise<KnowledgeItem[]> {
  const out: KnowledgeItem[] = [];

  if (section === "prophets") {
    const slugs = [
      "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","is-haq","yaqub","yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman","ilyas","al-yasa","yunus","zakariyya","yahya","isa","muhammad",
    ];
    for (const slug of slugs) {
      out.push(...unwrap(await loadJson(`prophets/${slug}.json`)));
    }
    return out;
  }

  if (section === "nations") {
    const ids = [
      "nation-qawm-nuh","nation-aad","nation-thamud","nation-qawm-lut","nation-madyan","nation-firaun","nation-bani-israil","nation-ashab-sabt","nation-ashab-kahf","nation-ashab-ukhdud","nation-saba","nation-ashab-rass","nation-qawm-yunus","nation-ashab-janna","nation-tubba","nation-rum-furs",
    ];
    for (const id of ids) {
      out.push(...unwrap(await loadJson(`nations/${id}.json`)));
    }
    return out;
  }

  if (section === "quiz") {
    for (let i = 1; i <= 8; i++) {
      out.push(...unwrap(await loadJson(`quiz/batch-${String(i).padStart(3, "0")}.json`)));
    }
    return out;
  }

  if (section === "tafsir") {
    out.push(...unwrap(await loadJson("tafsir/surahs/all-surah-intros.json")));
    out.push(...unwrap(await loadJson("tafsir/ayahs/juz-amma-and-fatiha.json")));
    for (const surah of [2, 3]) {
      for (let b = 1; b <= 8; b++) {
        const batch = await loadJson(
          `tafsir/ayahs/surah-${String(surah).padStart(3, "0")}-batch-${String(b).padStart(2, "0")}.json`,
        );
        if (batch) out.push(...unwrap(batch));
      }
    }
    return out;
  }

  const single: Record<string, string> = {
    "quran-people": "quran-people/people.json",
    history: "history/timeline.json",
    "intro-islam": "intro-islam/topics.json",
    "discover-islam": "discover-islam/path-and-faq.json",
  };
  const rel = single[section];
  if (!rel) return [];
  return unwrap(await loadJson(rel));
}

export async function getKnowledgeItem(section: string, id: string): Promise<KnowledgeItem | null> {
  // مسار سريع لبعض الأقسام ذات الملفات الفردية
  if (section === "prophets" && id.startsWith("prophet-")) {
    const slug = id.replace(/^prophet-/, "");
    const one = unwrap(await loadJson(`prophets/${slug}.json`))[0];
    if (one) return one;
  }
  if (section === "nations" && id.startsWith("nation-")) {
    const one = unwrap(await loadJson(`nations/${id}.json`))[0];
    if (one) return one;
  }
  if (section === "tafsir" && id.startsWith("tafsir-ayah-")) {
    const m = /^tafsir-ayah-(\d+)-(\d+)$/.exec(id);
    if (m) {
      const surah = Number(m[1]);
      const ayah = Number(m[2]);
      if (surah === 2 || surah === 3) {
        const batch = Math.ceil(ayah / 50);
        const file = unwrap(
          await loadJson(
            `tafsir/ayahs/surah-${String(surah).padStart(3, "0")}-batch-${String(batch).padStart(2, "0")}.json`,
          ),
        );
        return file.find((x) => x.id === id) || null;
      }
    }
  }
  const items = await loadSectionItems(section);
  return items.find((x) => x.id === id) || null;
}

const PROGRESS_KEY = "majlis-knowledge-progress-v1";

export type KnowledgeProgress = {
  quizCorrect: string[];
  discoverStations: string[];
  lastQuizId?: string;
  lastDiscoverId?: string;
  updatedAt?: string;
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
  const next = { ...p, updatedAt: new Date().toISOString() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  void syncKnowledgeProgressOptional(next);
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

/** مزامنة اختيارية صامتة عبر user_progress إن توفّرت جلسة. */
async function syncKnowledgeProgressOptional(p: KnowledgeProgress) {
  try {
    const { supabase } = await import("@/lib/supabase");
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getSession();
    const uid = auth.session?.user?.id;
    if (!uid) return;
    const { upsertProgress } = await import("@/lib/user-progress-service");
    const total = Math.max(1, (p.discoverStations?.length || 0) + (p.quizCorrect?.length || 0));
    const done = (p.discoverStations?.length || 0) + (p.quizCorrect?.length || 0);
    await upsertProgress({
      userId: uid,
      contentType: "course",
      contentId: "knowledge-progress-v1",
      title: "تقدّم المعرفة (سين جيم / اكتشف الإسلام)",
      url: "/knowledge/discover-islam",
      progressPct: Math.min(100, Math.round((done / Math.max(total, 20)) * 100)),
      lastPosition: p as unknown as Record<string, unknown>,
    });
  } catch {
    /* اختياري */
  }
}


export function knowledgeArticleJsonLd(item: KnowledgeItem, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    inLanguage: "ar",
    dateModified: item.updated_at,
    isAccessibleForFree: true,
    mainEntityOfPage: path,
  };
}

export function knowledgeFaqJsonLd(items: KnowledgeItem[]) {
  const faqs = items.filter((i) => i.tags?.includes("faq") || i.id.includes("-faq-")).slice(0, 40);
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.body.replace(/##[^\n]*/g, "").replace(/\s+/g, " ").trim().slice(0, 500),
      },
    })),
  };
}
