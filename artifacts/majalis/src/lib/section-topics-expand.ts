/**
 * عقد توسيع موضوعات أبواب الأقسام — موحّد لكل SectionAccordionLayout.
 * أقل من 8 → أكورديون داخل البطاقة · 8 فأكثر → ورقة سفلية.
 */
export const INLINE_SECTION_TOPIC_LIMIT = 8;

export function shouldInlineExpandTopics(topicCount: number): boolean {
  return Number.isFinite(topicCount) && topicCount > 0 && topicCount < INLINE_SECTION_TOPIC_LIMIT;
}
