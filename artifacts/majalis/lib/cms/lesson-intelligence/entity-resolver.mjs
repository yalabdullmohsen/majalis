/**
 * Phase 6 — Entity resolution (sheikh, mosque, course, organizer).
 */
import { matchSheikhByName } from "../sheikh-matcher.mjs";
import { createAndEnrichSheikh } from "../sheikh-enricher.mjs";
import { resolveMosqueIdForLesson } from "../mosque-matcher.mjs";
import { detectCourseFromParsed, ensureCourseRecord } from "../course-handler.mjs";

export async function resolveEntities({ parsed, source, sourceUrl }) {
  const sheikhMatch = await matchSheikhByName(parsed.speaker_name || parsed.sheikh_name);
  let sheikhId = sheikhMatch.matched?.id || null;

  if (!sheikhId && parsed.speaker_name) {
    sheikhId = await createAndEnrichSheikh({
      name: parsed.speaker_name,
      sourceConfig: source.config || {},
    });
  }

  const connectorSource = {
    name: source.source_name || source.name,
    config: source.config || {},
  };
  const mosqueId = await resolveMosqueIdForLesson(parsed, connectorSource);

  let courseId = parsed.course_id || null;
  if (detectCourseFromParsed(parsed)) {
    const course = await ensureCourseRecord(parsed, {
      sourceId: source.id,
      sourceUrl,
    });
    courseId = course.courseId;
    parsed.is_course = course.isCourse;
    if (courseId) parsed.course_id = courseId;
  }

  return {
    sheikhId,
    mosqueId,
    courseId,
    sheikhMatch,
    organizer: parsed.organizer || source.source_name,
  };
}
