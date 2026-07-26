import { getEntityGraph } from "./build-graph";
import { buildConnectionSections, findEntityByHref, getPrevNext } from "./query";
import { taxonomyBreadcrumbs } from "./taxonomy";
import type { EntityNode, RouteEntityContext } from "./types";

function resolveDetailEntity(path: string): EntityNode | null {
  const graph = getEntityGraph();
  const clean = path.split("?")[0].replace(/\/$/, "") || "/";

  const exact = findEntityByHref(clean);
  if (exact) return exact;

  const scholars = clean.match(/^\/scholars\/([^/]+)$/);
  if (scholars) return graph.nodes.get(`scholar:${scholars[1]}`) || null;

  const library = clean.match(/^\/library\/([^/]+)$/);
  if (library) return graph.nodes.get(`book:${library[1]}`) || null;

  const prophets = clean.match(/^\/(?:prophets|prophet-stories)\/([^/]+)$/);
  if (prophets) return graph.nodes.get(`prophet:${prophets[1]}`) || null;

  const nations = clean.match(/^\/nations\/([^/]+)$/);
  if (nations) return graph.nodes.get(`nation:${nations[1]}`) || null;

  return null;
}

function enrichBreadcrumbs(
  path: string,
  entity: EntityNode | null,
): { label: string; href?: string }[] {
  const crumbs = taxonomyBreadcrumbs(path);
  if (!entity) return crumbs;

  // تأكد أن عنوان الكيان الحالي ظاهر
  const last = crumbs[crumbs.length - 1];
  if (!last || last.label !== entity.title) {
    if (last) last.href = last.href ?? entity.parentHref;
    if (!crumbs.some((c) => c.label === entity.title && !c.href)) {
      crumbs.push({ label: entity.title });
    } else if (last) {
      last.label = entity.title;
      delete last.href;
    }
  }
  return crumbs;
}

const SKIP_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/auth",
  "/settings",
  "/privacy",
  "/terms",
  "/account-deletion",
  "/contact",
  "/api",
];

export function shouldShowKnowledgeRail(path: string): boolean {
  const clean = path.split("?")[0] || "/";
  if (clean === "/") return false;
  return !SKIP_PREFIXES.some((p) => clean === p || clean.startsWith(p + "/"));
}

export function resolveRouteEntity(path: string): RouteEntityContext {
  const clean = path.split("?")[0].replace(/\/$/, "") || "/";
  const entity = resolveDetailEntity(clean);
  const { prev, next } = entity ? getPrevNext(entity) : { prev: null, next: null };
  return {
    path: clean,
    entity,
    breadcrumbs: enrichBreadcrumbs(clean, entity),
    prev,
    next,
    sections: shouldShowKnowledgeRail(clean) ? buildConnectionSections(entity, clean) : [],
  };
}
