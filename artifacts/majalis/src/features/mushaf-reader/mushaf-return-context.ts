/**
 * سياق العودة من المصحف — يحفظ مصدر الفتح دون إعادة تحميل القسم.
 */
export type MushafReturnContext = {
  sourceRoute: string;
  sourceSectionId?: string;
  sourceContentId?: string;
  sourceScrollPosition?: number;
  sourceExpandedCardId?: string;
  sourceFilter?: string;
  sourceSearchQuery?: string;
  openedAt: number;
};

const KEY = "sunnah-mushaf-return-context-v1";

export function saveMushafReturnContext(ctx: MushafReturnContext): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    /* ignore quota */
  }
}

export function readMushafReturnContext(): MushafReturnContext | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MushafReturnContext;
  } catch {
    return null;
  }
}

export function clearMushafReturnContext(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
