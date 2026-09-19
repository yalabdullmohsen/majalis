/**
 * منسّق نيّات تنقّل المصحف — مصدر حقيقة واحد للسباقات.
 * لا يغيّر النص ولا الهندسة؛ يقرّر فقط أي Intent يملك الانتقال.
 */

import { clampMushafPage, MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";

export type MushafIntentKind =
  | "TURN_NEXT"
  | "TURN_PREVIOUS"
  | "JUMP_PAGE"
  | "JUMP_REFERENCE"
  | "RESTORE_POSITION"
  | "SEARCH_RESULT"
  | "BOOKMARK_RESULT"
  | "SCRUB_COMMIT"
  | "DEEP_LINK"
  | "RESUME"
  | "ROTATE";

/** user > system > sync > prefetch */
export type MushafIntentPriorityBand = "user" | "system" | "sync" | "prefetch";

export type MushafIntentStatus =
  | "pending"
  | "accepted"
  | "executing"
  | "completed"
  | "cancelled"
  | "rejected";

export type MushafIntentResult =
  | { ok: true; page: number }
  | { ok: false; reason: string };

export type MushafNavIntent = {
  id: string;
  kind: MushafIntentKind;
  source: string;
  createdAt: number;
  priority: MushafIntentPriorityBand;
  /** صفحة مستهدفة إن وُجدت؛ ROTATE/RESUME قد تكون null */
  targetPage: number | null;
  status: MushafIntentStatus;
  cancelReason?: string;
  result?: MushafIntentResult;
};

export type SubmitIntentInput = {
  kind: MushafIntentKind;
  source: string;
  targetPage?: number | null;
  /** يتجاوز النطاق الافتراضي لنوع الـIntent */
  priority?: MushafIntentPriorityBand;
  now?: number;
};

export type SubmitDecision =
  | { accepted: true; intent: MushafNavIntent; cancelledIds: string[] }
  | { accepted: false; intent: MushafNavIntent; reason: string };

const PRIORITY_RANK: Record<MushafIntentPriorityBand, number> = {
  user: 40,
  system: 30,
  sync: 20,
  prefetch: 10,
};

const DEFAULT_PRIORITY: Record<MushafIntentKind, MushafIntentPriorityBand> = {
  TURN_NEXT: "user",
  TURN_PREVIOUS: "user",
  JUMP_PAGE: "user",
  JUMP_REFERENCE: "user",
  SEARCH_RESULT: "user",
  BOOKMARK_RESULT: "user",
  SCRUB_COMMIT: "user",
  DEEP_LINK: "user",
  RESTORE_POSITION: "system",
  RESUME: "system",
  ROTATE: "system",
};

/** أنواع تغيّر الصفحة المستهدفة */
const PAGE_MUTATING: ReadonlySet<MushafIntentKind> = new Set([
  "TURN_NEXT",
  "TURN_PREVIOUS",
  "JUMP_PAGE",
  "JUMP_REFERENCE",
  "RESTORE_POSITION",
  "SEARCH_RESULT",
  "BOOKMARK_RESULT",
  "SCRUB_COMMIT",
  "DEEP_LINK",
]);

let seq = 0;

export function nextMushafIntentId(now = Date.now()): string {
  seq += 1;
  return `mi-${seq}-${now.toString(36)}`;
}

export function defaultPriorityForKind(kind: MushafIntentKind): MushafIntentPriorityBand {
  return DEFAULT_PRIORITY[kind];
}

export function isPageMutatingIntent(kind: MushafIntentKind): boolean {
  return PAGE_MUTATING.has(kind);
}

export function inferTurnKind(fromPage: number, toPage: number): MushafIntentKind {
  const delta = toPage - fromPage;
  if (delta === 1) return "TURN_NEXT";
  if (delta === -1) return "TURN_PREVIOUS";
  return "JUMP_PAGE";
}

function normalizeTarget(kind: MushafIntentKind, raw: number | null | undefined): number | null {
  if (!isPageMutatingIntent(kind)) return null;
  if (raw == null || !Number.isFinite(raw)) return null;
  return clampMushafPage(raw);
}

export type MushafIntentCoordinator = {
  submit: (input: SubmitIntentInput) => SubmitDecision;
  beginExecute: (id: string) => boolean;
  complete: (id: string, result: MushafIntentResult) => boolean;
  cancel: (id: string, reason: string) => boolean;
  cancelAll: (reason: string) => string[];
  isActive: (id: string) => boolean;
  getActive: () => MushafNavIntent | null;
  getById: (id: string) => MushafNavIntent | undefined;
  /** للاختبارات والتشخيص — لا بيانات شخصية */
  snapshot: () => {
    activeId: string | null;
    intents: ReadonlyArray<Pick<MushafNavIntent, "id" | "kind" | "status" | "priority" | "targetPage">>;
  };
  reset: () => void;
};

/**
 * منسّق واحد لكل جلسة قارئ.
 * القواعد:
 * - Intent المستخدم المباشر يغلب sync/prefetch.
 * - عند تساوي النطاق: الأحدث يفوز ويلغي السابق.
 * - Intent مُلغى لا يكتب نتيجة.
 * - RESUME لا يتجاوز Intent مستخدم أحدث لنفس الصفحة.
 * - ROTATE لا يغيّر الصفحة.
 */
export function createMushafIntentCoordinator(): MushafIntentCoordinator {
  const byId = new Map<string, MushafNavIntent>();
  let activeId: string | null = null;

  const get = (id: string) => byId.get(id);

  const isLive = (intent: MushafNavIntent | undefined): boolean =>
    Boolean(
      intent &&
        (intent.status === "accepted" ||
          intent.status === "executing" ||
          intent.status === "pending"),
    );

  const cancelOne = (id: string, reason: string): boolean => {
    const intent = byId.get(id);
    if (!intent || !isLive(intent)) return false;
    intent.status = "cancelled";
    intent.cancelReason = reason;
    if (activeId === id) activeId = null;
    return true;
  };

  const submit = (input: SubmitIntentInput): SubmitDecision => {
    const now = input.now ?? Date.now();
    const priority = input.priority ?? defaultPriorityForKind(input.kind);
    const targetPage = normalizeTarget(input.kind, input.targetPage);
    const intent: MushafNavIntent = {
      id: nextMushafIntentId(now),
      kind: input.kind,
      source: input.source,
      createdAt: now,
      priority,
      targetPage,
      status: "pending",
    };
    byId.set(intent.id, intent);

    if (isPageMutatingIntent(input.kind) && targetPage == null) {
      intent.status = "rejected";
      intent.result = { ok: false, reason: "invalid_target" };
      return { accepted: false, intent, reason: "invalid_target" };
    }

    if (input.kind === "ROTATE") {
      /* دوران: لا يلغي انتقال مستخدم جاريًا ولا يغيّر الصفحة */
      intent.status = "completed";
      intent.result = {
        ok: true,
        page: activeId ? (byId.get(activeId)?.targetPage ?? MUSHAF_PAGE_MIN) : MUSHAF_PAGE_MIN,
      };
      return { accepted: true, intent, cancelledIds: [] };
    }

    const cancelledIds: string[] = [];
    const current = activeId ? byId.get(activeId) : undefined;

    if (current && isLive(current)) {
      const curRank = PRIORITY_RANK[current.priority];
      const nextRank = PRIORITY_RANK[priority];

      if (input.kind === "RESUME" && current.priority === "user" && isPageMutatingIntent(current.kind)) {
        intent.status = "rejected";
        intent.result = { ok: false, reason: "user_intent_active" };
        return { accepted: false, intent, reason: "user_intent_active" };
      }

      if (nextRank < curRank) {
        intent.status = "rejected";
        intent.result = { ok: false, reason: "lower_priority" };
        return { accepted: false, intent, reason: "lower_priority" };
      }

      /* مساوٍ أو أعلى: الأحدث يفوز */
      cancelOne(current.id, `superseded_by:${intent.id}`);
      cancelledIds.push(current.id);
    }

    intent.status = "accepted";
    if (isPageMutatingIntent(input.kind) || input.kind === "RESUME") {
      activeId = intent.id;
    }
    return { accepted: true, intent, cancelledIds };
  };

  const beginExecute = (id: string): boolean => {
    const intent = get(id);
    if (!intent || intent.status !== "accepted") return false;
    if (activeId !== id) return false;
    intent.status = "executing";
    return true;
  };

  const complete = (id: string, result: MushafIntentResult): boolean => {
    const intent = get(id);
    if (!intent) return false;
    if (intent.status === "cancelled" || intent.status === "rejected") return false;
    if (intent.status !== "accepted" && intent.status !== "executing") return false;
    intent.status = "completed";
    intent.result = result;
    if (activeId === id) activeId = null;
    return true;
  };

  const cancel = (id: string, reason: string) => cancelOne(id, reason);

  const cancelAll = (reason: string): string[] => {
    const ids: string[] = [];
    for (const intent of byId.values()) {
      if (isLive(intent)) {
        cancelOne(intent.id, reason);
        ids.push(intent.id);
      }
    }
    activeId = null;
    return ids;
  };

  const isActive = (id: string): boolean => {
    const intent = get(id);
    return Boolean(intent && activeId === id && isLive(intent));
  };

  return {
    submit,
    beginExecute,
    complete,
    cancel,
    cancelAll,
    isActive,
    getActive: () => (activeId ? byId.get(activeId) ?? null : null),
    getById: (id) => byId.get(id),
    snapshot: () => ({
      activeId,
      intents: [...byId.values()].map((i) => ({
        id: i.id,
        kind: i.kind,
        status: i.status,
        priority: i.priority,
        targetPage: i.targetPage,
      })),
    }),
    reset: () => {
      byId.clear();
      activeId = null;
    },
  };
}

/** حدود الصفحة للعقود — بدون تغيير محتوى */
export const MUSHAF_INTENT_PAGE_BOUNDS = {
  min: MUSHAF_PAGE_MIN,
  max: MUSHAF_PAGE_MAX,
} as const;
