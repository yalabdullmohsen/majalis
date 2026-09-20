const PREFIX = "kx-list-state:";

export type KnowledgeListState = {
  scrollY: number;
  search?: string;
  category?: string;
  status?: string;
  savedAt: number;
};

export function saveKnowledgeListState(
  listPath: string,
  partial: Omit<KnowledgeListState, "savedAt">,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: KnowledgeListState = {
      ...partial,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(`${PREFIX}${listPath}`, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function loadKnowledgeListState(
  listPath: string,
): KnowledgeListState | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${listPath}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KnowledgeListState;
    if (!parsed || typeof parsed.scrollY !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearKnowledgeListState(listPath: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(`${PREFIX}${listPath}`);
  } catch {
    /* ignore */
  }
}

/** يستعيد التمرير بعد رسم القائمة دون إعادة تحميل البيانات. */
export function restoreKnowledgeListScroll(scrollY: number): void {
  if (typeof window === "undefined") return;
  const y = Math.max(0, scrollY);
  requestAnimationFrame(() => {
    window.scrollTo({ top: y, behavior: "auto" });
  });
}
