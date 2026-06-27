/**
 * Duplicate detection for automated lesson imports.
 */
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { findDuplicateSourceUrl } from "./lesson-import-draft.mjs";

function normalizeText(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, "");
}

export function hashImageBuffer(buffer) {
  if (!buffer || !buffer.length) return null;
  return createHash("sha256").update(buffer).digest("hex").slice(0, 32);
}

export function hashImageBase64(base64) {
  if (!base64) return null;
  try {
    const raw = base64.includes(",") ? base64.split(",")[1] : base64;
    return hashImageBuffer(Buffer.from(raw, "base64"));
  } catch {
    return null;
  }
}

function similarityScore(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const partsA = na.split(" ");
  const partsB = nb.split(" ");
  const overlap = partsA.filter((p) => partsB.some((q) => q.includes(p) || p.includes(q))).length;
  return overlap / Math.max(partsA.length, partsB.length, 1);
}

function compositeSimilarity(parsed) {
  const title = parsed.title || "";
  const speaker = parsed.speaker_name || "";
  const mosque = parsed.mosque || "";
  const date = parsed.start_date || parsed.gregorian_date || "";
  return [title, speaker, mosque, date].filter(Boolean).join("|");
}

export async function findDuplicateLesson({ parsed, sourceUrl, imageHash }) {
  const admin = getSupabaseAdmin();
  const reasons = [];
  let bestScore = 0;
  let matchedLesson = null;

  const urlDup = await findDuplicateSourceUrl(sourceUrl);
  if (urlDup?.lesson) {
    return {
      isDuplicate: true,
      reason: "duplicate_source_url",
      message: "رابط المصدر موجود مسبقًا",
      lesson: urlDup.lesson,
      draft: urlDup.draft,
      similarity_score: 1,
    };
  }
  if (urlDup?.draft) {
    return {
      isDuplicate: true,
      reason: "duplicate_draft_url",
      message: "مسودة بنفس رابط المصدر",
      draft: urlDup.draft,
      similarity_score: 1,
    };
  }

  if (!admin) {
    return { isDuplicate: false, similarity_score: 0, reasons };
  }

  if (imageHash) {
    const { data: byHash } = await admin
      .from("lessons")
      .select("id, title, poster_image_hash")
      .eq("poster_image_hash", imageHash)
      .limit(1);
    if (byHash?.[0]) {
      return {
        isDuplicate: true,
        reason: "duplicate_image_hash",
        message: "صورة الإعلان مكررة",
        lesson: byHash[0],
        similarity_score: 1,
      };
    }
  }

  const composite = compositeSimilarity(parsed);
  const { data: recent } = await admin
    .from("lessons")
    .select("id, title, speaker_name, mosque, start_date, day_of_week, external_key")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);

  for (const row of recent || []) {
    const rowComposite = [row.title, row.speaker_name, row.mosque, row.start_date || row.day_of_week].filter(Boolean).join("|");
    const score = similarityScore(composite, rowComposite);
    if (score > bestScore) {
      bestScore = score;
      matchedLesson = row;
    }
  }

  if (bestScore >= 0.88) {
    return {
      isDuplicate: true,
      reason: "similar_lesson",
      message: `درس مشابه (${Math.round(bestScore * 100)}%)`,
      lesson: matchedLesson,
      similarity_score: bestScore,
    };
  }

  const externalKey = parsed.external_key;
  if (externalKey) {
    const { data: byKey } = await admin.from("lessons").select("id, title").eq("external_key", externalKey).maybeSingle();
    if (byKey?.id) {
      return {
        isDuplicate: true,
        reason: "duplicate_external_key",
        message: "مفتاح خارجي مكرر",
        lesson: byKey,
        similarity_score: 1,
      };
    }
  }

  return { isDuplicate: false, similarity_score: bestScore, reasons };
}
