/**
 * Knowledge Graph API — /api/knowledge-graph/*
 *
 * GET  /api/knowledge-graph/node/:id           — عقدة + علاقاتها المباشرة (1-hop)
 * GET  /api/knowledge-graph/node/:id/expand    — توسيع الرسم ?depth=1-3
 * GET  /api/knowledge-graph/search?tag=X       — كل العقد المرتبطة بوسم
 * GET  /api/knowledge-graph/nodes?type=X       — قائمة العقد حسب النوع
 * POST /api/knowledge-graph/relationship       — إضافة علاقة (مشرف فقط)
 *
 * قيد: لا تُنشأ علاقة إلا يدوياً + verified_by إلزامي.
 */

import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";

const MAX_DEPTH = 3;

const REL_TYPES = new Set([
  "explains", "references", "authored_by",
  "related_topic", "contradicts_view", "prerequisite",
]);

const NODE_TYPES = new Set([
  "quran_ayah", "hadith", "fatwa", "scholar",
  "book", "lesson", "benefit", "prophet_story", "term",
]);

// ── مساعدات ──────────────────────────────────────────────────────────────

function isMissingTable(err) {
  if (!err) return false;
  const msg = String(err.message || "").toLowerCase();
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find")
  );
}

/** استخراج :id من URL */
function extractId(pathname, segment) {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf(segment);
  return idx !== -1 ? parts[idx + 1] : null;
}

/** جلب عقدة واحدة مع علاقاتها المباشرة */
async function getNode(admin, nodeId) {
  const [nodeRes, edgesRes] = await Promise.all([
    admin.from("kn_nodes").select("*").eq("id", nodeId).maybeSingle(),
    admin
      .from("kn_edges")
      .select(`
        id, relationship_type, strength, verified_by, created_at,
        source:source_node_id(id, node_type, title, summary, reference_id),
        target:target_node_id(id, node_type, title, summary, reference_id)
      `)
      .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
      .order("strength", { ascending: false }),
  ]);

  if (nodeRes.error) throw nodeRes.error;
  if (!nodeRes.data) return null;

  const edges = (edgesRes.data || []).map((e) => ({
    id: e.id,
    relationship_type: e.relationship_type,
    strength: e.strength,
    verified_by: e.verified_by,
    created_at: e.created_at,
    source: e.source,
    target: e.target,
    direction: e.source?.id === nodeId ? "outgoing" : "incoming",
  }));

  // جلب الوسوم
  const tagsRes = await admin
    .from("kn_node_tags")
    .select("tag:tag_id(id, tag_name_ar, category)")
    .eq("node_id", nodeId);

  return {
    ...nodeRes.data,
    edges,
    tags: (tagsRes.data || []).map((t) => t.tag),
  };
}

/** توسيع الرسم البياني بعمق محدود */
async function expandNode(admin, nodeId, depth) {
  const safeDepth = Math.min(Math.max(1, Number(depth) || 1), MAX_DEPTH);

  const { data, error } = await admin.rpc("get_node_subgraph", {
    p_node_id: nodeId,
    p_depth: safeDepth,
  });

  if (error) {
    if (isMissingTable(error)) return { nodes: [], edges: [], depth: safeDepth };
    throw error;
  }

  // فصل العقد عن الحواف
  const nodesMap = new Map();
  const edges = [];

  for (const row of data || []) {
    if (!nodesMap.has(row.node_id)) {
      nodesMap.set(row.node_id, {
        id: row.node_id,
        node_type: row.node_type,
        title: row.title,
        summary: row.summary,
        reference_id: row.reference_id,
        depth: row.depth,
      });
    }
    if (row.edge_id) {
      edges.push({
        id: row.edge_id,
        source_id: row.source_id,
        target_id: row.target_id,
        relationship_type: row.rel_type,
        strength: row.strength,
        verified_by: row.verified_by,
      });
    }
  }

  return {
    center_node_id: nodeId,
    depth: safeDepth,
    nodes: Array.from(nodesMap.values()),
    edges: edges.filter(
      (e, i, arr) => arr.findIndex((x) => x.id === e.id) === i,
    ),
  };
}

/** بحث حسب الوسم */
async function searchByTag(admin, tag, limit) {
  const safeLimit = Math.min(Number(limit) || 20, 100);

  // أولاً: ابحث عن الوسم
  const tagRes = await admin
    .from("kn_tags")
    .select("id, tag_name_ar, category")
    .ilike("tag_name_ar", `%${tag}%`)
    .limit(5);

  if (tagRes.error || !tagRes.data?.length) {
    return { tag, nodes: [], tags_found: [] };
  }

  const tagIds = tagRes.data.map((t) => t.id);

  const nodesRes = await admin
    .from("kn_node_tags")
    .select("node:node_id(id, node_type, title, summary, reference_id)")
    .in("tag_id", tagIds)
    .limit(safeLimit);

  return {
    tag,
    tags_found: tagRes.data,
    nodes: (nodesRes.data || [])
      .map((r) => r.node)
      .filter(Boolean),
  };
}

/** قائمة العقد حسب النوع */
async function listNodes(admin, type, limit) {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  let query = admin
    .from("kn_nodes")
    .select("id, node_type, title, summary, reference_id, created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (type && NODE_TYPES.has(type)) query = query.eq("node_type", type);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** إضافة علاقة جديدة — مشرف فقط */
async function createRelationship(admin, body) {
  const { source_node_id, target_node_id, relationship_type, strength, verified_by } = body;

  if (!source_node_id || !target_node_id || !relationship_type || !verified_by) {
    return { ok: false, status: 400, error: "source_node_id و target_node_id و relationship_type و verified_by إلزامية" };
  }

  if (!REL_TYPES.has(relationship_type)) {
    return { ok: false, status: 400, error: `نوع العلاقة غير مدعوم: ${relationship_type}` };
  }

  if (source_node_id === target_node_id) {
    return { ok: false, status: 400, error: "لا يمكن ربط عقدة بنفسها" };
  }

  const str = Math.min(1, Math.max(0, Number(strength) || 0.7));

  const { data, error } = await admin
    .from("kn_edges")
    .insert({
      source_node_id,
      target_node_id,
      relationship_type,
      strength: str,
      verified_by: String(verified_by).trim(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, status: 409, error: "هذه العلاقة موجودة بالفعل" };
    }
    return { ok: false, status: 500, error: error.message };
  }

  return { ok: true, status: 201, id: data.id };
}

// ── Handler الرئيسي ───────────────────────────────────────────────────────

export default async function handler(req, res) {
  const method = req.method?.toUpperCase();

  if (method !== "GET" && method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return sendJson(res, 503, { ok: false, error: "database_unavailable" });
  }

  // استخرج المسار: /api/knowledge-graph/...
  const rawUrl = req.url || req.path || "";
  const url = rawUrl.split("?")[0].replace(/\/+$/, "");
  const query = req.query || {};

  try {
    // POST /api/knowledge-graph/relationship
    if (method === "POST" && url.endsWith("/relationship")) {
      const auth = await requireAdminAccess(req, res, sendJson);
      if (!auth) return;

      const body = req.body || {};
      const result = await createRelationship(admin, body);
      return sendJson(res, result.status || 200, result);
    }

    // GET /api/knowledge-graph/node/:id/expand
    if (method === "GET" && url.includes("/node/") && url.endsWith("/expand")) {
      const parts = url.split("/");
      const nodeId = parts[parts.indexOf("node") + 1];
      if (!nodeId || nodeId === "expand") {
        return sendJson(res, 400, { ok: false, error: "node id مطلوب" });
      }

      const result = await expandNode(admin, nodeId, query.depth || 1);
      return sendJson(res, 200, { ok: true, ...result });
    }

    // GET /api/knowledge-graph/node/:id
    if (method === "GET" && url.includes("/node/")) {
      const nodeId = extractId(url, "node");
      if (!nodeId) {
        return sendJson(res, 400, { ok: false, error: "node id مطلوب" });
      }

      const node = await getNode(admin, nodeId);
      if (!node) {
        return sendJson(res, 404, { ok: false, error: "العقدة غير موجودة" });
      }
      return sendJson(res, 200, { ok: true, node });
    }

    // GET /api/knowledge-graph/search?tag=X
    if (method === "GET" && url.endsWith("/search")) {
      const tag = String(query.tag || "").trim();
      if (!tag) {
        return sendJson(res, 400, { ok: false, error: "معامل tag مطلوب" });
      }

      const result = await searchByTag(admin, tag, query.limit);
      return sendJson(res, 200, { ok: true, ...result });
    }

    // GET /api/knowledge-graph/nodes?type=X
    if (method === "GET" && (url.endsWith("/nodes") || url.endsWith("/knowledge-graph"))) {
      const nodes = await listNodes(admin, query.type, query.limit);
      return sendJson(res, 200, { ok: true, count: nodes.length, nodes });
    }

    return sendJson(res, 404, { ok: false, error: "المسار غير موجود" });
  } catch (err) {
    if (isMissingTable(err)) {
      return sendJson(res, 200, {
        ok: true,
        nodes: [],
        edges: [],
        message: "جداول الرسم البياني غير مهيأة بعد — شغّل knowledge_graph_islamic_v1.sql أولاً",
      });
    }
    console.error("[knowledge-graph]", err);
    return sendJson(res, 500, { ok: false, error: "server_error" });
  }
}
