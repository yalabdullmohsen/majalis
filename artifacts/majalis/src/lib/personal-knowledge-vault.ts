/**
 * Verse-bound Smart Notes & Personal Annotations — Personal Knowledge Vault.
 * Binds notes to Quran verses, Azkar, or Matn; IndexedDB + tags + export.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import { idbDelete, idbGetValue, idbPut, idbStreamAll, OFFLINE_STORES } from "@/lib/offline-db";
import { getAllNotes as getLegacyQuranNotes, saveNote as saveLegacyQuranNote } from "@/lib/quran-personal";

export type AnnotationTargetKind = "quran" | "adhkar" | "matn" | "other";

export type PersonalAnnotation = {
  id: string;
  kind: AnnotationTargetKind;
  /** e.g. "2:255", adhkar id, matn id */
  targetId: string;
  title?: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type VaultQuery = {
  kind?: AnnotationTargetKind;
  tag?: string;
  text?: string;
  targetId?: string;
  limit?: number;
};

const LS_INDEX_KEY = "majalis-knowledge-vault-index-v1";
const LS_BODY_KEY = "majalis-knowledge-vault-body-v1";
const IDB_PREFIX = "annotation:";

function uid(): string {
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function idbKey(id: string): string {
  return `${IDB_PREFIX}${id}`;
}

function readBodyMap(): Record<string, PersonalAnnotation> {
  try {
    const raw = localStorage.getItem(LS_BODY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PersonalAnnotation>) : {};
  } catch {
    return {};
  }
}

function writeBodyMap(map: Record<string, PersonalAnnotation>): void {
  try {
    localStorage.setItem(LS_BODY_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(LS_INDEX_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  try {
    localStorage.setItem(LS_INDEX_KEY, JSON.stringify(ids));
  } catch {
    /* quota */
  }
}

export async function upsertAnnotation(
  input: Omit<PersonalAnnotation, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<PersonalAnnotation> {
  const now = new Date().toISOString();
  const existingId = input.id;
  let createdAt = now;
  if (existingId) {
    const prev =
      (await idbGetValue<PersonalAnnotation>(OFFLINE_STORES.articles, idbKey(existingId)).catch(() => null)) ||
      readBodyMap()[existingId];
    if (prev?.createdAt) createdAt = prev.createdAt;
  }
  const annotation: PersonalAnnotation = {
    id: existingId || uid(),
    kind: input.kind,
    targetId: input.targetId,
    title: input.title?.trim() || undefined,
    body: input.body.trim(),
    tags: [...new Set((input.tags || []).map((t) => t.trim()).filter(Boolean))],
    createdAt,
    updatedAt: now,
  };

  await idbPut(OFFLINE_STORES.articles, idbKey(annotation.id), annotation).catch(() => undefined);
  const map = readBodyMap();
  map[annotation.id] = annotation;
  writeBodyMap(map);
  const index = readIndex();
  if (!index.includes(annotation.id)) writeIndex([annotation.id, ...index]);

  // Mirror Quran notes into legacy LS for existing mushaf note UI compatibility
  if (annotation.kind === "quran") {
    const [surah, ayah] = annotation.targetId.split(":").map(Number);
    if (Number.isFinite(surah) && Number.isFinite(ayah)) {
      try {
        saveLegacyQuranNote(surah, ayah, annotation.body);
      } catch {
        /* ignore */
      }
    }
  }

  return annotation;
}

export async function deleteAnnotation(id: string): Promise<void> {
  await idbDelete(OFFLINE_STORES.articles, idbKey(id)).catch(() => undefined);
  const map = readBodyMap();
  delete map[id];
  writeBodyMap(map);
  writeIndex(readIndex().filter((x) => x !== id));
}

export async function getAnnotation(id: string): Promise<PersonalAnnotation | null> {
  try {
    const fromIdb = await idbGetValue<PersonalAnnotation>(OFFLINE_STORES.articles, idbKey(id));
    if (fromIdb) return fromIdb;
  } catch {
    /* fall through */
  }
  return readBodyMap()[id] || null;
}

export async function listAllAnnotations(): Promise<PersonalAnnotation[]> {
  const map = readBodyMap();
  const fromLs = Object.values(map);
  if (fromLs.length) {
    return fromLs.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  const fromIndex: PersonalAnnotation[] = [];
  for (const id of readIndex()) {
    const row = await idbGetValue<PersonalAnnotation>(OFFLINE_STORES.articles, idbKey(id));
    if (row?.id) fromIndex.push(row);
  }
  if (fromIndex.length) {
    return fromIndex.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  try {
    const scanned: PersonalAnnotation[] = [];
    await idbStreamAll<PersonalAnnotation>(OFFLINE_STORES.articles, (batch) => {
      for (const r of batch) {
        const v = r.value;
        if (v && typeof v === "object" && "targetId" in v && "body" in v) {
          scanned.push(v);
        }
      }
    });
    return scanned.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

/** Query the Personal Knowledge Vault by kind / tag / free text. */
export async function queryKnowledgeVault(q: VaultQuery = {}): Promise<PersonalAnnotation[]> {
  const all = await listAllAnnotations();
  const textN = q.text ? normalizeArabic(q.text) : "";
  const tagN = q.tag ? normalizeArabic(q.tag) : "";
  const filtered = all.filter((a) => {
    if (q.kind && a.kind !== q.kind) return false;
    if (q.targetId && a.targetId !== q.targetId) return false;
    if (tagN) {
      const has = a.tags.some((t) => normalizeArabic(t).includes(tagN) || tagN.includes(normalizeArabic(t)));
      if (!has) return false;
    }
    if (textN) {
      const hay = normalizeArabic([a.title, a.body, a.targetId, ...a.tags].filter(Boolean).join(" "));
      if (!hay.includes(textN)) return false;
    }
    return true;
  });
  return filtered.slice(0, q.limit ?? 100);
}

export async function exportKnowledgeVaultJson(): Promise<string> {
  const items = await listAllAnnotations();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      count: items.length,
      annotations: items,
    },
    null,
    2,
  );
}

export async function importKnowledgeVaultJson(json: string): Promise<number> {
  try {
    const parsed = JSON.parse(json) as { annotations?: PersonalAnnotation[] };
    const list = Array.isArray(parsed.annotations) ? parsed.annotations : [];
    let n = 0;
    for (const a of list) {
      if (!a?.body || !a?.targetId) continue;
      await upsertAnnotation({
        id: a.id,
        kind: a.kind || "other",
        targetId: a.targetId,
        title: a.title,
        body: a.body,
        tags: a.tags || [],
      });
      n += 1;
    }
    return n;
  } catch {
    return 0;
  }
}

/** One-time hydrate from legacy mushaf notes (LS → vault). */
export async function migrateLegacyQuranNotesToVault(): Promise<number> {
  try {
    const legacy = getLegacyQuranNotes();
    let n = 0;
    for (const note of legacy) {
      const targetId = `${note.surahNum}:${note.ayahNum}`;
      const existing = await queryKnowledgeVault({ kind: "quran", targetId, limit: 1 });
      if (existing.length) continue;
      await upsertAnnotation({
        kind: "quran",
        targetId,
        body: note.text,
        tags: ["مصحف", "مرحَّل"],
      });
      n += 1;
    }
    return n;
  } catch {
    return 0;
  }
}
