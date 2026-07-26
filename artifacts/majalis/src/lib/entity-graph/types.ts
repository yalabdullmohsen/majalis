/** أنواع الكيانات في الرسم المعرفي الموحّد للواجهة. */
export type EntityKind =
  | "scholar"
  | "book"
  | "prophet"
  | "nation"
  | "topic"
  | "category"
  | "hub"
  | "hadith_collection"
  | "surah"
  | "lesson"
  | "university"
  | "madhhab"
  | "sahabah";

export type RelationKind =
  | "authored"
  | "authored_by"
  | "work_of"
  | "same_category"
  | "same_specialty"
  | "same_madhhab"
  | "same_era"
  | "mentioned_in"
  | "related_nation"
  | "related_prophet"
  | "sibling"
  | "parent_hub"
  | "child_of"
  | "see_also"
  | "continues"
  | "teaches";

export type EntityNode = {
  id: string;
  kind: EntityKind;
  title: string;
  href: string;
  summary?: string;
  tags: string[];
  parentHref?: string;
  parentLabel?: string;
};

export type EntityEdge = {
  from: string;
  to: string;
  relation: RelationKind;
  weight: number;
};

export type LinkedItem = {
  id: string;
  kind: EntityKind;
  title: string;
  href: string;
  subtitle?: string;
  relation: RelationKind;
  weight: number;
};

export type ConnectionSection = {
  id: "related" | "also_read" | "you_may_like" | "continue" | "keep_learning" | "sources";
  title: string;
  items: LinkedItem[];
};

export type RouteEntityContext = {
  path: string;
  entity: EntityNode | null;
  breadcrumbs: { label: string; href?: string }[];
  prev: LinkedItem | null;
  next: LinkedItem | null;
  sections: ConnectionSection[];
};

export type GraphSearchHit = {
  id: string;
  kind: EntityKind;
  title: string;
  href: string;
  subtitle?: string;
  score: number;
  reason: "text" | "tag" | "neighbor" | "hub";
};
