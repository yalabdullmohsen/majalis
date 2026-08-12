/**
 * Recommendation Engine — graph-based related content.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function recommendForLesson(lessonId, { limit = 8 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !lessonId) return { lessons: [], sheikhs: [], books: [], qa: [] };

  const lesson = await fetchLesson(admin, lessonId);
  if (!lesson) return { lessons: [], sheikhs: [], books: [], qa: [] };

  const [lessons, sheikhs, graphRelated] = await Promise.all([
    recommendSimilarLessons(admin, lesson, limit),
    recommendSimilarSheikhs(admin, lesson, 4),
    recommendFromGraph(admin, lessonId, limit),
  ]);

  return {
    lessons: dedupeById([...graphRelated.lessons, ...lessons]).slice(0, limit),
    sheikhs,
    books: graphRelated.books,
    courses: graphRelated.courses,
    qa: graphRelated.qa,
    surahs: graphRelated.surahs,
  };
}

async function fetchLesson(admin, id) {
  try {
    const { data } = await admin.from("lessons").select("*").eq("id", id).maybeSingle();
    return data;
  } catch {
    return null;
  }
}

async function recommendSimilarLessons(admin, lesson, limit) {
  try {
    let q = admin
      .from("lessons")
      .select("id, title, speaker_name, mosque, category, city, published_at")
      .eq("status", "published")
      .neq("id", lesson.id)
      .limit(limit * 2);

    if (lesson.category) q = q.eq("category", lesson.category);
    if (lesson.speaker_name) q = q.ilike("speaker_name", `%${lesson.speaker_name.split(" ").pop()}%`);

    const { data } = await q.order("published_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

async function recommendSimilarSheikhs(admin, lesson, limit) {
  if (!lesson.speaker_name) return [];
  try {
    const { data } = await admin
      .from("sheikhs")
      .select("id, name, city, specialties")
      .ilike("name", `%${lesson.speaker_name.replace(/^الشيخ\s*/, "").slice(0, 12)}%`)
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

async function recommendFromGraph(admin, lessonId, limit) {
  const out = { lessons: [], books: [], courses: [], qa: [], surahs: [] };
  try {
    const { data: node } = await admin
      .from("kg_nodes")
      .select("id, kind, ref_id")
      .eq("ref_id", lessonId)
      .eq("kind", "lesson")
      .maybeSingle();

    if (!node) return out;

    const { data: edges } = await admin
      .from("kg_edges")
      .select("target_id, relation, kg_nodes!kg_edges_target_id_fkey(id, kind, ref_id, label)")
      .eq("source_id", node.id)
      .limit(limit * 3);

    for (const edge of edges || []) {
      const target = edge.kg_nodes;
      if (!target) continue;
      if (target.kind === "lesson") out.lessons.push({ id: target.ref_id, title: target.label });
      if (target.kind === "book") out.books.push({ id: target.ref_id, title: target.label });
      if (target.kind === "course") out.courses.push({ id: target.ref_id, title: target.label });
      if (target.kind === "qa") out.qa.push({ id: target.ref_id, title: target.label });
      if (target.kind === "surah") out.surahs.push({ id: target.ref_id, title: target.label });
    }
  } catch {
    /* optional kg tables */
  }
  return out;
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter((i) => {
    if (!i?.id || seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

export async function recommendForUser(userId, { interests = [], limit = 10 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  try {
    let q = admin
      .from("lessons")
      .select("id, title, speaker_name, category, mosque")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (interests[0]) q = q.eq("category", interests[0]);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}
