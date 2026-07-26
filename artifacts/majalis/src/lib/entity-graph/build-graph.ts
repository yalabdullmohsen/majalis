import { SCHOLARS } from "@/lib/scholars-data";
import { LIBRARY_CATALOG } from "@/lib/library-catalog";
import { PROPHETS } from "@/lib/prophets-data";
import { NATIONS } from "@/lib/nations-seed";
import { resolveAuthorScholarLink } from "@/lib/author-scholar-links";
import { resolveScholarWorkLink } from "@/lib/scholar-library-links";
import { entityKey, normalizeArabic } from "./normalize";
import { LIBRARY_CATEGORY_HUBS, TAXONOMY } from "./taxonomy";
import type { EntityEdge, EntityNode, RelationKind } from "./types";

export type EntityGraph = {
  nodes: Map<string, EntityNode>;
  out: Map<string, EntityEdge[]>;
  byHref: Map<string, string>;
  builtAt: number;
};

let cached: EntityGraph | null = null;

function addNode(graph: EntityGraph, node: EntityNode) {
  if (graph.nodes.has(node.id)) return;
  graph.nodes.set(node.id, node);
  graph.byHref.set(node.href, node.id);
}

function addEdge(
  graph: EntityGraph,
  from: string,
  to: string,
  relation: RelationKind,
  weight = 1,
) {
  if (from === to) return;
  if (!graph.nodes.has(from) || !graph.nodes.has(to)) return;
  const list = graph.out.get(from) || [];
  if (list.some((e) => e.to === to && e.relation === relation)) return;
  list.push({ from, to, relation, weight });
  graph.out.set(from, list);
}

function linkBidirectional(
  graph: EntityGraph,
  a: string,
  b: string,
  forward: RelationKind,
  reverse: RelationKind,
  weight = 1,
) {
  addEdge(graph, a, b, forward, weight);
  addEdge(graph, b, a, reverse, weight);
}

/** يبني الرسم مرة واحدة ويُعاد استخدامه — أي تحديث للبذور ينعكس عند إعادة التحميل. */
export function getEntityGraph(): EntityGraph {
  if (cached) return cached;

  const graph: EntityGraph = {
    nodes: new Map(),
    out: new Map(),
    byHref: new Map(),
    builtAt: Date.now(),
  };

  // محاور التصنيف
  for (const node of Object.values(TAXONOMY)) {
    if (node.href === "/") continue;
    addNode(graph, {
      id: entityKey("hub", node.href),
      kind: "hub",
      title: node.label,
      href: node.href,
      tags: node.tags || [],
      parentHref: node.parent,
      parentLabel: node.parent ? TAXONOMY[node.parent]?.label : undefined,
    });
  }
  for (const node of Object.values(TAXONOMY)) {
    if (!node.parent || node.parent === "/") continue;
    const from = entityKey("hub", node.href);
    const to = entityKey("hub", node.parent);
    addEdge(graph, from, to, "child_of", 1.2);
    addEdge(graph, to, from, "parent_hub", 1);
    for (const sib of node.siblings || []) {
      linkBidirectional(graph, from, entityKey("hub", sib), "sibling", "sibling", 0.9);
    }
  }

  // علماء
  for (const s of SCHOLARS) {
    const id = entityKey("scholar", s.id);
    addNode(graph, {
      id,
      kind: "scholar",
      title: s.name,
      href: `/scholars/${s.id}`,
      summary: s.bio.slice(0, 160),
      tags: [...s.specialty, s.era, s.region, s.madhhab || ""].filter(Boolean),
      parentHref: "/scholars",
      parentLabel: "العلماء",
    });
    addEdge(graph, id, entityKey("hub", "/scholars"), "child_of", 1);
    addEdge(graph, entityKey("hub", "/scholars"), id, "parent_hub", 0.6);

    for (const work of s.key_works) {
      const link = resolveScholarWorkLink(work);
      if (link.bookId) {
        const bookId = entityKey("book", link.bookId);
        // سيُربط بعد إدراج الكتب
        (graph as EntityGraph & { _pendingWorks?: [string, string, number][] })._pendingWorks ??= [];
        (graph as EntityGraph & { _pendingWorks: [string, string, number][] })._pendingWorks.push([
          id,
          bookId,
          1.4,
        ]);
      }
    }
  }

  // كتب
  const booksByCategory = new Map<string, string[]>();
  for (const book of LIBRARY_CATALOG) {
    const id = entityKey("book", book.id);
    addNode(graph, {
      id,
      kind: "book",
      title: book.title,
      href: `/library/${book.id}`,
      summary: book.description.slice(0, 160),
      tags: [book.category, book.type, book.author, ...book.keywords].filter(Boolean),
      parentHref: "/library",
      parentLabel: "المكتبة",
    });
    addEdge(graph, id, entityKey("hub", "/library"), "child_of", 1);
    addEdge(graph, entityKey("hub", "/library"), id, "parent_hub", 0.5);

    const authorLink = resolveAuthorScholarLink(book.author);
    if (authorLink.scholarId) {
      linkBidirectional(
        graph,
        id,
        entityKey("scholar", authorLink.scholarId),
        "authored_by",
        "authored",
        1.5,
      );
    }

    const catList = booksByCategory.get(book.category) || [];
    catList.push(id);
    booksByCategory.set(book.category, catList);

    for (const hub of LIBRARY_CATEGORY_HUBS[book.category] || []) {
      addEdge(graph, id, entityKey("hub", hub), "see_also", 0.85);
      addEdge(graph, entityKey("hub", hub), id, "see_also", 0.5);
    }
  }

  // أعمال العلماء المؤجلة
  const pending = (graph as EntityGraph & { _pendingWorks?: [string, string, number][] })._pendingWorks || [];
  for (const [scholarId, bookId, w] of pending) {
    linkBidirectional(graph, scholarId, bookId, "authored", "authored_by", w);
  }

  // كتب نفس التصنيف (حد أقصى لتقليل التضخم)
  for (const ids of booksByCategory.values()) {
    const sample = ids.slice(0, 40);
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < Math.min(sample.length, i + 6); j++) {
        linkBidirectional(graph, sample[i], sample[j], "same_category", "same_category", 0.7);
      }
    }
  }

  // علماء بنفس المذهب / التخصص
  const byMadhhab = new Map<string, string[]>();
  const bySpecialty = new Map<string, string[]>();
  for (const s of SCHOLARS) {
    const id = entityKey("scholar", s.id);
    if (s.madhhab) {
      const list = byMadhhab.get(s.madhhab) || [];
      list.push(id);
      byMadhhab.set(s.madhhab, list);
    }
    for (const sp of s.specialty.slice(0, 2)) {
      const list = bySpecialty.get(sp) || [];
      list.push(id);
      bySpecialty.set(sp, list);
    }
  }
  for (const ids of byMadhhab.values()) {
    for (let i = 0; i < Math.min(ids.length, 12); i++) {
      for (let j = i + 1; j < Math.min(ids.length, i + 4); j++) {
        linkBidirectional(graph, ids[i], ids[j], "same_madhhab", "same_madhhab", 0.75);
      }
    }
  }
  for (const ids of bySpecialty.values()) {
    for (let i = 0; i < Math.min(ids.length, 10); i++) {
      for (let j = i + 1; j < Math.min(ids.length, i + 3); j++) {
        linkBidirectional(graph, ids[i], ids[j], "same_specialty", "same_specialty", 0.7);
      }
    }
  }

  // أنبياء
  for (let i = 0; i < PROPHETS.length; i++) {
    const p = PROPHETS[i];
    const id = entityKey("prophet", p.slug);
    addNode(graph, {
      id,
      kind: "prophet",
      title: p.arabicName,
      href: `/prophets/${p.slug}`,
      summary: p.briefBio.slice(0, 160),
      tags: [p.title, p.peopleOrPlace, ...p.keyAttributes, ...p.mainSurahs].filter(Boolean),
      parentHref: "/prophets",
      parentLabel: "قصص الأنبياء",
    });
    addEdge(graph, id, entityKey("hub", "/prophets"), "child_of", 1);
    addEdge(graph, entityKey("hub", "/prophets"), id, "parent_hub", 0.6);
    addEdge(graph, id, entityKey("hub", "/quran-hub"), "mentioned_in", 0.8);

    if (i > 0) {
      const prevId = entityKey("prophet", PROPHETS[i - 1].slug);
      addEdge(graph, id, prevId, "continues", 1.1);
      addEdge(graph, prevId, id, "continues", 1.1);
    }
  }

  // أمم
  for (let i = 0; i < NATIONS.length; i++) {
    const n = NATIONS[i];
    const id = entityKey("nation", n.slug);
    addNode(graph, {
      id,
      kind: "nation",
      title: n.name,
      href: `/nations/${n.slug}`,
      summary: (n.summary || n.name).slice(0, 160),
      tags: [n.slug, n.sin, ...n.aliases, ...n.tags].filter(Boolean),
      parentHref: "/nations",
      parentLabel: "الأمم السابقة",
    });
    addEdge(graph, id, entityKey("hub", "/nations"), "child_of", 1);
    addEdge(graph, entityKey("hub", "/nations"), id, "parent_hub", 0.6);
    addEdge(graph, id, entityKey("hub", "/prophets"), "related_prophet", 0.7);

    if (n.prophet?.slug && graph.nodes.has(entityKey("prophet", n.prophet.slug))) {
      linkBidirectional(
        graph,
        id,
        entityKey("prophet", n.prophet.slug),
        "related_prophet",
        "related_nation",
        1.5,
      );
    } else {
      const nationNorm = normalizeArabic(n.name);
      const prophetNameNorm = normalizeArabic(n.prophet?.name || "");
      for (const p of PROPHETS) {
        const prophetNorm = normalizeArabic(p.arabicName);
        const peopleNorm = normalizeArabic(p.peopleOrPlace);
        if (
          (prophetNameNorm && prophetNameNorm === prophetNorm) ||
          (nationNorm && peopleNorm.includes(nationNorm)) ||
          (nationNorm && nationNorm.includes(prophetNorm) && prophetNorm.length >= 3)
        ) {
          linkBidirectional(
            graph,
            id,
            entityKey("prophet", p.slug),
            "related_prophet",
            "related_nation",
            1.3,
          );
        }
      }
    }

    if (i > 0) {
      const prevId = entityKey("nation", NATIONS[i - 1].slug);
      addEdge(graph, id, prevId, "continues", 0.9);
      addEdge(graph, prevId, id, "continues", 0.9);
    }
  }

  // مجموعات حديث شائعة كعقد
  const hadithCollections: { id: string; title: string; href: string; bookId?: string }[] = [
    { id: "bukhari", title: "صحيح البخاري", href: "/hadith/sahih", bookId: "book-bukhari" },
    { id: "muslim", title: "صحيح مسلم", href: "/hadith/sahih", bookId: "book-muslim" },
    { id: "nawawi40", title: "الأربعون النووية", href: "/arbaeen-nawawi", bookId: "book-nawawi40" },
  ];
  for (const c of hadithCollections) {
    const id = entityKey("hadith_collection", c.id);
    addNode(graph, {
      id,
      kind: "hadith_collection",
      title: c.title,
      href: c.href,
      tags: ["حديث"],
      parentHref: "/hadith",
      parentLabel: "الحديث",
    });
    addEdge(graph, id, entityKey("hub", "/hadith"), "child_of", 1);
    if (c.bookId && graph.nodes.has(entityKey("book", c.bookId))) {
      linkBidirectional(graph, id, entityKey("book", c.bookId), "see_also", "see_also", 1.2);
    }
  }

  cached = graph;
  return graph;
}

/** للاختبارات فقط */
export function resetEntityGraphCache() {
  cached = null;
}

export function graphStats() {
  const g = getEntityGraph();
  let edges = 0;
  for (const list of g.out.values()) edges += list.length;
  return { nodes: g.nodes.size, edges, builtAt: g.builtAt };
}
