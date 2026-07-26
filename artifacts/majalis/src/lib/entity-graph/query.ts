import { getRecentPages } from "@/lib/recent-pages";
import { getEntityGraph } from "./build-graph";
import { normalizeArabic, tokenOverlap } from "./normalize";
import { TAXONOMY, taxonomySiblings } from "./taxonomy";
import type {
  ConnectionSection,
  EntityNode,
  GraphSearchHit,
  LinkedItem,
  RelationKind,
} from "./types";

const RELATION_PRIORITY: RelationKind[] = [
  "authored",
  "authored_by",
  "related_prophet",
  "related_nation",
  "continues",
  "same_madhhab",
  "same_specialty",
  "same_category",
  "sibling",
  "see_also",
  "mentioned_in",
  "parent_hub",
  "child_of",
  "work_of",
  "teaches",
];

function toLinked(node: EntityNode, relation: RelationKind, weight: number): LinkedItem {
  return {
    id: node.id,
    kind: node.kind,
    title: node.title,
    href: node.href,
    subtitle: node.summary,
    relation,
    weight,
  };
}

export function findEntityByHref(href: string): EntityNode | null {
  const graph = getEntityGraph();
  const clean = href.split("?")[0].replace(/\/$/, "") || "/";
  const id = graph.byHref.get(clean);
  if (id) return graph.nodes.get(id) || null;

  // تفاصيل ديناميكية: /scholars/x → جرب تطابق تام بعد بناء
  for (const [path, nodeId] of graph.byHref) {
    if (clean === path || clean.startsWith(path + "/")) {
      /* keep looking for exact */
    }
  }
  return null;
}

export function getNeighbors(entityId: string, limit = 24): LinkedItem[] {
  const graph = getEntityGraph();
  const edges = graph.out.get(entityId) || [];
  const scored = edges
    .map((e) => {
      const node = graph.nodes.get(e.to);
      if (!node) return null;
      const pri = RELATION_PRIORITY.indexOf(e.relation);
      const score = e.weight * (pri < 0 ? 0.5 : 1.2 - pri * 0.03);
      return { item: toLinked(node, e.relation, e.weight), score };
    })
    .filter(Boolean) as { item: LinkedItem; score: number }[];

  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: LinkedItem[] = [];
  for (const row of scored) {
    if (seen.has(row.item.href)) continue;
    seen.add(row.item.href);
    out.push(row.item);
    if (out.length >= limit) break;
  }
  return out;
}

export function getPrevNext(entity: EntityNode): { prev: LinkedItem | null; next: LinkedItem | null } {
  if (entity.kind !== "prophet" && entity.kind !== "nation") {
    return { prev: null, next: null };
  }
  const graph = getEntityGraph();
  const series = [...graph.nodes.values()].filter(
    (n) => n.kind === entity.kind && n.parentHref === entity.parentHref,
  );
  const idx = series.findIndex((n) => n.id === entity.id);
  if (idx < 0) return { prev: null, next: null };
  const prevNode = series[idx - 1];
  const nextNode = series[idx + 1];
  return {
    prev: prevNode ? toLinked(prevNode, "continues", 1) : null,
    next: nextNode ? toLinked(nextNode, "continues", 1) : null,
  };
}

function hubLinks(path: string, excludeHref: string, limit: number): LinkedItem[] {
  const graph = getEntityGraph();
  const items: LinkedItem[] = [];
  for (const href of taxonomySiblings(path)) {
    const node = graph.nodes.get(`hub:${href}`) || findEntityByHref(href);
    if (!node || node.href === excludeHref) continue;
    items.push(toLinked(node, "sibling", 0.9));
    if (items.length >= limit) break;
  }
  return items;
}

export function buildConnectionSections(
  entity: EntityNode | null,
  path: string,
): ConnectionSection[] {
  const graph = getEntityGraph();
  const sections: ConnectionSection[] = [];
  const neighbors = entity ? getNeighbors(entity.id, 30) : [];

  const related = neighbors.filter((n) =>
    ["authored", "authored_by", "related_prophet", "related_nation", "same_madhhab", "same_specialty", "same_category"].includes(n.relation),
  ).slice(0, 8);

  const alsoRead = [
    ...neighbors.filter((n) => ["see_also", "sibling", "mentioned_in"].includes(n.relation)),
    ...hubLinks(path, entity?.href || path, 6),
  ]
    .filter((n, i, arr) => arr.findIndex((x) => x.href === n.href) === i)
    .filter((n) => n.href !== path && n.href !== entity?.href)
    .slice(0, 8);

  const youMayLike = neighbors
    .filter((n) => !related.some((r) => r.href === n.href) && !alsoRead.some((r) => r.href === n.href))
    .slice(0, 6);

  // إن لم توجد علاقات كافية، اقترح أبناء المحور
  if (related.length < 3) {
    const hubHref = entity?.parentHref || (TAXONOMY[path]?.parent ? path : path);
    const hubId = graph.byHref.get(entity?.parentHref || hubHref.split("/").slice(0, 2).join("/") || "");
    if (hubId) {
      for (const item of getNeighbors(hubId, 10)) {
        if (item.href === entity?.href) continue;
        if (related.some((r) => r.href === item.href)) continue;
        related.push(item);
        if (related.length >= 6) break;
      }
    }
  }

  if (related.length) {
    sections.push({ id: "related", title: "مواضيع ذات صلة", items: related });
  }
  if (alsoRead.length) {
    sections.push({ id: "also_read", title: "اقرأ أيضاً", items: alsoRead });
  }
  if (youMayLike.length) {
    sections.push({ id: "you_may_like", title: "قد يعجبك", items: youMayLike });
  }

  // أكمل من حيث توقفت
  const recent = getRecentPages(5).filter((p) => p.href !== path).slice(0, 4);
  if (recent.length) {
    sections.push({
      id: "continue",
      title: "أكمل من حيث توقفت",
      items: recent.map((p) => ({
        id: `recent:${p.href}`,
        kind: "hub" as const,
        title: p.label,
        href: p.href,
        relation: "continues" as const,
        weight: 1,
      })),
    });
  }

  // استمر في التعلم — محاور تعليمية إن كنا في محتوى علمي
  const learningHubs = ["/learn", "/lessons", "/learning/paths", "/adab-talab-ilm", "/start-here", "/library"];
  const keep = learningHubs
    .filter((h) => h !== path && !path.startsWith(h + "/"))
    .map((h) => findEntityByHref(h))
    .filter(Boolean)
    .slice(0, 4) as EntityNode[];
  if (keep.length && (entity?.kind === "scholar" || entity?.kind === "book" || entity?.kind === "hub" || path.startsWith("/learn") || path.startsWith("/library") || path.startsWith("/scholars"))) {
    sections.push({
      id: "keep_learning",
      title: "استمر في التعلم",
      items: keep.map((n) => toLinked(n, "teaches", 0.8)),
    });
  }

  return sections;
}

/** بحث مترابط: نص + وسوم + جيران النتائج المباشرة */
export function searchEntityGraph(query: string, limit = 20): GraphSearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const nq = normalizeArabic(q);
  const graph = getEntityGraph();
  const hits: GraphSearchHit[] = [];

  for (const node of graph.nodes.values()) {
    const titleN = normalizeArabic(node.title);
    const summaryN = normalizeArabic(node.summary || "");
    const tagHit = node.tags.some((t) => normalizeArabic(t).includes(nq) || nq.includes(normalizeArabic(t)));
    let score = 0;
    let reason: GraphSearchHit["reason"] = "text";
    if (titleN === nq) score = 10;
    else if (titleN.includes(nq)) score = 7 + tokenOverlap(node.title, q);
    else if (tagHit) {
      score = 5;
      reason = "tag";
    } else if (summaryN.includes(nq)) score = 3.5;
    else {
      const ov = tokenOverlap(node.title, q);
      if (ov >= 0.4) score = 2 + ov;
    }
    if (score > 0) {
      hits.push({
        id: node.id,
        kind: node.kind,
        title: node.title,
        href: node.href,
        subtitle: node.summary,
        score,
        reason,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, Math.min(8, limit));
  const seen = new Set(top.map((h) => h.href));

  // وسّع بالجيران
  for (const hit of top.slice(0, 5)) {
    for (const nb of getNeighbors(hit.id, 4)) {
      if (seen.has(nb.href)) continue;
      seen.add(nb.href);
      hits.push({
        id: nb.id,
        kind: nb.kind,
        title: nb.title,
        href: nb.href,
        subtitle: `مرتبط بـ ${hit.title}`,
        score: hit.score * 0.55 * nb.weight,
        reason: "neighbor",
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const final: GraphSearchHit[] = [];
  const finalSeen = new Set<string>();
  for (const h of hits) {
    if (finalSeen.has(h.href)) continue;
    finalSeen.add(h.href);
    final.push(h);
    if (final.length >= limit) break;
  }
  return final;
}
