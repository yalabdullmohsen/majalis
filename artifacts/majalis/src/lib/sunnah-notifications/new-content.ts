/**
 * محتوى جديد — للمتابعين الصريحين فقط، مع تجميع الملخص.
 */

import { dispatchSunnahNotification } from "./dispatcher";

export type FollowTarget = {
  type: "world" | "series" | "category";
  id: string;
  title: string;
};

export type NewContentItem = {
  id: string;
  title: string;
  published: boolean;
  archived?: boolean;
  deleted?: boolean;
  deepLink: string;
  target: FollowTarget;
};

const FOLLOWS_KEY = "sunnah.notifications.follows.v1";

export function loadExplicitFollows(): FollowTarget[] {
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FollowTarget[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExplicitFollows(follows: FollowTarget[]): void {
  try {
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export function upsertExplicitFollow(target: FollowTarget): void {
  const list = loadExplicitFollows().filter(
    (f) => !(f.type === target.type && f.id === target.id),
  );
  list.unshift(target);
  saveExplicitFollows(list);
}

export function removeExplicitFollow(type: FollowTarget["type"], id: string): void {
  saveExplicitFollows(loadExplicitFollows().filter((f) => !(f.type === type && f.id === id)));
}

function isFollowed(item: NewContentItem, follows: FollowTarget[]): boolean {
  return follows.some((f) => f.type === item.target.type && f.id === item.target.id);
}

export async function notifyNewContentForFollowers(opts: {
  userId?: string | null;
  items: NewContentItem[];
}): Promise<{ ok: boolean; reason?: string; bundled?: number }> {
  const follows = loadExplicitFollows();
  const eligible = opts.items.filter(
    (i) => i.published && !i.archived && !i.deleted && isFollowed(i, follows),
  );
  if (eligible.length === 0) return { ok: false, reason: "no_eligible_items" };

  // تجميع في ملخص واحد
  const primary = eligible[0]!;
  const result = await dispatchSunnahNotification({
    channel: "new_content",
    userId: opts.userId,
    entityId: primary.target.id,
    eventType: "content_digest",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    compose: {
      kind: "content_digest",
      entityTitle: primary.target.title,
      count: eligible.length,
      deepLink:
        eligible.length === 1
          ? primary.deepLink
          : `/${primary.target.type === "world" ? "world" : primary.target.type === "series" ? "series" : "category"}/${encodeURIComponent(primary.target.id)}`,
    },
  });

  if (!result.ok) return { ok: false, reason: result.reason };
  return { ok: true, bundled: eligible.length };
}
