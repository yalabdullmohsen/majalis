/**
 * Knowledge Graph linker — connect sheikhs, lessons, mosques, courses, books on publish.
 */
import { upsertGraphNode, createGraphEdge } from "../reasoning-engine/knowledge-graph.mjs";
import { buildGlobalRef } from "../global-reference/ids.mjs";

export async function linkPublishedLesson(admin, { lesson, parsed, source }) {
  if (!lesson?.id) return { ok: false, error: "no_lesson" };

  const nodes = [];
  const edges = [];

  const lessonRef = buildGlobalRef("lesson", lesson.id);
  const lessonNode = await upsertGraphNode(admin, {
    ref_id: lessonRef,
    node_kind: "lesson",
    title: lesson.title,
    stable_id: lesson.id,
    keywords: lesson.keywords || parsed?.keywords || [],
    trust_level: Math.round((lesson.confidence_score ?? 0.85) * 100),
    verification_status: "verified",
    metadata: {
      mosque: lesson.mosque,
      speaker: lesson.speaker_name,
      start_date: lesson.start_date,
      source_url: lesson.source_url,
    },
  });
  nodes.push(lessonNode);

  if (lesson.speaker_name || lesson.sheikh_id) {
    const sheikhRef = lesson.sheikh_id
      ? buildGlobalRef("scholar", lesson.sheikh_id)
      : buildGlobalRef("scholar", slugify(lesson.speaker_name));
    const sheikhNode = await upsertGraphNode(admin, {
      ref_id: sheikhRef,
      node_kind: "scholar",
      title: lesson.speaker_name,
      stable_id: lesson.sheikh_id || slugify(lesson.speaker_name),
      trust_level: 85,
      verification_status: lesson.sheikh_id ? "verified" : "needs_review",
    });
    nodes.push(sheikhNode);
    const edge = await createGraphEdge(admin, {
      from_ref_id: lessonRef,
      to_ref_id: sheikhRef,
      relation_type: "authored_by",
      confidence_score: 90,
      auto_generated: true,
    });
    edges.push(edge);
  }

  if (lesson.mosque || lesson.mosque_id) {
    const mosqueRef = lesson.mosque_id
      ? buildGlobalRef("mosque", lesson.mosque_id)
      : buildGlobalRef("mosque", slugify(lesson.mosque));
    const mosqueNode = await upsertGraphNode(admin, {
      ref_id: mosqueRef,
      node_kind: "mosque",
      title: lesson.mosque,
      stable_id: lesson.mosque_id || slugify(lesson.mosque),
      trust_level: 80,
      metadata: { city: lesson.city, region: lesson.region },
    });
    nodes.push(mosqueNode);
    const edge = await createGraphEdge(admin, {
      from_ref_id: lessonRef,
      to_ref_id: mosqueRef,
      relation_type: "discusses",
      confidence_score: 85,
      auto_generated: true,
    });
    edges.push(edge);
  }

  if (parsed?.is_course || lesson.is_course) {
    const courseRef = buildGlobalRef("course", slugify(parsed?.course_title || lesson.title));
    const courseNode = await upsertGraphNode(admin, {
      ref_id: courseRef,
      node_kind: "course",
      title: parsed?.course_title || lesson.title,
      stable_id: slugify(parsed?.course_title || lesson.title),
      trust_level: 75,
    });
    nodes.push(courseNode);
    await createGraphEdge(admin, {
      from_ref_id: lessonRef,
      to_ref_id: courseRef,
      relation_type: "contains",
      confidence_score: 80,
    });
  }

  if (source?.id) {
    const sourceRef = buildGlobalRef("source", source.id);
    await upsertGraphNode(admin, {
      ref_id: sourceRef,
      node_kind: "source",
      title: source.source_name || source.name,
      stable_id: source.id,
      trust_level: source.trust_score ?? 70,
    });
    await createGraphEdge(admin, {
      from_ref_id: lessonRef,
      to_ref_id: sourceRef,
      relation_type: "from_source",
      confidence_score: 95,
    });
  }

  // Persist graph links audit
  if (admin) {
    try {
      await admin.from("mke_graph_links").insert({
        lesson_id: lesson.id,
        nodes_created: nodes.filter((n) => n.ok).length,
        edges_created: edges.filter((e) => e.ok).length,
        metadata: { lesson_ref: lessonRef },
      });
    } catch {
      /* optional */
    }
  }

  return { ok: true, nodes: nodes.length, edges: edges.length, lessonRef };
}

function slugify(s) {
  return String(s || "unknown")
    .trim()
    .slice(0, 80)
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .toLowerCase() || "item";
}
