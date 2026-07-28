import { useCallback, useState } from "react";
import {
  autoTagAnnotation,
  autoTagEntireVault,
  listKnownSemanticTags,
  searchVaultByTag,
  searchVaultSemantic,
  suggestSemanticTags,
  type TaggedDocument,
} from "@/lib/semantic-vault-tagging";
import type { PersonalAnnotation } from "@/lib/personal-knowledge-vault";

/** Semantic tagging + vault search — logic only. */
export function useSemanticVaultSearch() {
  const [results, setResults] = useState<TaggedDocument[]>([]);
  const [knownTags] = useState(() => listKnownSemanticTags());

  const suggest = useCallback((text: string) => suggestSemanticTags(text), []);

  const search = useCallback(async (opts: Parameters<typeof searchVaultSemantic>[0]) => {
    const rows = await searchVaultSemantic(opts);
    setResults(rows);
    return rows;
  }, []);

  const byTag = useCallback(async (tag: string) => {
    const rows = await searchVaultByTag(tag);
    setResults(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        tags: r.tags,
        suggestedTags: suggestSemanticTags([r.title, r.body].filter(Boolean).join("\n")),
        kind: r.kind,
      })),
    );
    return rows as PersonalAnnotation[];
  }, []);

  const tagOne = useCallback(async (id: string) => autoTagAnnotation(id), []);
  const tagAll = useCallback(async () => autoTagEntireVault(), []);

  return { results, knownTags, suggest, search, byTag, tagOne, tagAll };
}
