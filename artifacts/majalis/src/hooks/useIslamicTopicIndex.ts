import { useCallback, useState } from "react";
import {
  listTopicCategories,
  queryTopicEvidence,
  searchTopicsByLabel,
  type TopicQueryResult,
  type IslamicTopicNode,
} from "@/lib/islamic-topic-index";

/** Categorized Islamic topic index — logic only. */
export function useIslamicTopicIndex() {
  const [result, setResult] = useState<TopicQueryResult | null>(null);
  const [categories] = useState(() => listTopicCategories());

  const query = useCallback((queryOrId: string) => {
    const next = queryTopicEvidence(queryOrId);
    setResult(next);
    return next;
  }, []);

  const search = useCallback((q: string): IslamicTopicNode[] => searchTopicsByLabel(q), []);

  const clear = useCallback(() => setResult(null), []);

  return { categories, result, query, search, clear };
}
