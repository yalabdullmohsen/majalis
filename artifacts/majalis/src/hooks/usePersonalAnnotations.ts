import { useCallback, useEffect, useState } from "react";
import {
  deleteAnnotation,
  exportKnowledgeVaultJson,
  importKnowledgeVaultJson,
  listAllAnnotations,
  migrateLegacyQuranNotesToVault,
  queryKnowledgeVault,
  upsertAnnotation,
  type PersonalAnnotation,
  type VaultQuery,
} from "@/lib/personal-knowledge-vault";

/** Personal Knowledge Vault — logic only. */
export function usePersonalAnnotations() {
  const [items, setItems] = useState<PersonalAnnotation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (q?: VaultQuery) => {
    setLoading(true);
    try {
      const list = q ? await queryKnowledgeVault(q) : await listAllAnnotations();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await migrateLegacyQuranNotesToVault();
      await refresh();
    })();
  }, [refresh]);

  const save = useCallback(
    async (input: Parameters<typeof upsertAnnotation>[0]) => {
      const row = await upsertAnnotation(input);
      await refresh();
      return row;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteAnnotation(id);
      await refresh();
    },
    [refresh],
  );

  const exportJson = useCallback(() => exportKnowledgeVaultJson(), []);
  const importJson = useCallback(
    async (json: string) => {
      const n = await importKnowledgeVaultJson(json);
      await refresh();
      return n;
    },
    [refresh],
  );

  const search = useCallback(async (q: VaultQuery) => {
    const list = await queryKnowledgeVault(q);
    setItems(list);
    return list;
  }, []);

  return { items, loading, refresh, save, remove, exportJson, importJson, search };
}
