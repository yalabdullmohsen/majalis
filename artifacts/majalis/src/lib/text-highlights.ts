/**
 * Personal scientific highlights (فوائد) — local-first colored text marks.
 * Synced later via guest-cloud-merge / vault notes when signed in.
 */

import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";
import { normalizeArabic } from "@/shared/arabic-normalize";

export type HighlightColor = "yellow" | "green" | "blue";

export type TextHighlight = {
  id: string;
  color: HighlightColor;
  /** Source surface: book | tafsir | ayah | other */
  source: string;
  sourceId: string;
  sourceTitle: string;
  quote: string;
  note: string;
  href?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "majalis-text-highlights-v1";
const MAX = 200;

function isHighlight(v: unknown): v is TextHighlight {
  return (
    isPlainObject(v) &&
    typeof v.id === "string" &&
    (v.color === "yellow" || v.color === "green" || v.color === "blue") &&
    typeof v.source === "string" &&
    typeof v.sourceId === "string" &&
    typeof v.quote === "string" &&
    typeof v.note === "string" &&
    typeof v.createdAt === "string"
  );
}

function isList(v: unknown): v is TextHighlight[] {
  return Array.isArray(v) && v.every(isHighlight);
}

function uid(): string {
  return `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function listTextHighlights(): TextHighlight[] {
  return readLocalJson<TextHighlight[]>(STORAGE_KEY, [], isList).sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1,
  );
}

export function addTextHighlight(
  input: Omit<TextHighlight, "id" | "createdAt" | "updatedAt">,
): TextHighlight {
  const now = new Date().toISOString();
  const row: TextHighlight = {
    ...input,
    id: uid(),
    quote: input.quote.trim().slice(0, 2000),
    note: input.note.trim().slice(0, 4000),
    createdAt: now,
    updatedAt: now,
  };
  const all = listTextHighlights();
  writeLocalJson(STORAGE_KEY, [row, ...all].slice(0, MAX));
  return row;
}

export function updateTextHighlightNote(id: string, note: string): void {
  const all = listTextHighlights();
  const next = all.map((h) =>
    h.id === id ? { ...h, note: note.trim().slice(0, 4000), updatedAt: new Date().toISOString() } : h,
  );
  writeLocalJson(STORAGE_KEY, next);
}

export function removeTextHighlight(id: string): void {
  writeLocalJson(
    STORAGE_KEY,
    listTextHighlights().filter((h) => h.id !== id),
  );
}

export function searchTextHighlights(query: string): TextHighlight[] {
  const q = normalizeArabic(query.trim());
  if (!q) return listTextHighlights();
  return listTextHighlights().filter((h) => {
    const hay = normalizeArabic(`${h.quote} ${h.note} ${h.sourceTitle}`);
    return hay.includes(q);
  });
}

export const HIGHLIGHT_COLOR_LABEL: Record<HighlightColor, string> = {
  yellow: "أصفر",
  green: "أخضر",
  blue: "أزرق",
};
