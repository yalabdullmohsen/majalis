/**
 * Course detection and annual_courses linking.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const COURSE_SIGNALS = [/دورة/u, /course/i, /برنامج/u, /مكثف/u, /حلقة/u, /مستوى/u];

export function detectCourseFromParsed(parsed) {
  if (parsed.is_course === true) return true;
  const title = String(parsed.title || "");
  const desc = String(parsed.description || "");
  const text = `${title} ${desc} ${parsed.course_title || ""}`;
  return COURSE_SIGNALS.some((re) => re.test(text));
}

export async function ensureCourseRecord(parsed, { sourceId, sourceUrl } = {}) {
  if (!detectCourseFromParsed(parsed)) {
    return { isCourse: false, courseId: null };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { isCourse: true, courseId: parsed.course_id || null };

  const courseTitle = parsed.course_title || parsed.title || "دورة";
  const externalKey = `course:${sourceId || ""}:${courseTitle}`.slice(0, 120);

  try {
    const { data: existing } = await admin
      .from("annual_courses")
      .select("id")
      .eq("title", courseTitle)
      .maybeSingle();

    if (existing?.id) {
      return { isCourse: true, courseId: existing.id, courseTitle };
    }

    const { data: created } = await admin
      .from("annual_courses")
      .insert({
        title: courseTitle,
        description: parsed.description?.slice(0, 500) || null,
        external_key: externalKey,
        source_url: sourceUrl || null,
        status: "approved",
      })
      .select("id")
      .single();

    return { isCourse: true, courseId: created?.id || null, courseTitle };
  } catch {
    parsed.is_course = true;
    return { isCourse: true, courseId: null, courseTitle };
  }
}
