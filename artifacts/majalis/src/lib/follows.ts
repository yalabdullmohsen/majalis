export type FollowKind = "sheikh" | "category" | "series";

export type FollowItem = {
  kind: FollowKind;
  id: string;
  label: string;
  href: string;
  followedAt: number;
};

const STORAGE_KEY = "majalis-follows-v1";

export function readFollows(): FollowItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeFollows(items: FollowItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("majalis-follows-updated"));
}

export function isFollowing(kind: FollowKind, id: string): boolean {
  return readFollows().some((f) => f.kind === kind && f.id === id);
}

export function toggleFollow(item: Omit<FollowItem, "followedAt">): boolean {
  const list = readFollows();
  const idx = list.findIndex((f) => f.kind === item.kind && f.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    writeFollows(list);
    return false;
  }
  list.unshift({ ...item, followedAt: Date.now() });
  writeFollows(list.slice(0, 50));
  return true;
}

export const FOLLOW_KIND_LABELS: Record<FollowKind, string> = {
  sheikh: "مشايخ",
  category: "تصنيفات",
  series: "سلاسل",
};
