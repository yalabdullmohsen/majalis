/**
 * حفظ محلي (localStorage) لمسائل المواريث المحسوبة، لاسترجاعها لاحقًا دون
 * إعادة إدخال البيانات. لا مزامنة سحابية حاليًا — كل الحفظ على هذا الجهاز فقط.
 */
import type { EstateInput, FiqhConfig, HeirsInput } from "./types";

export type SavedInheritanceCase = {
  id: string;
  title: string;
  createdAt: string;
  heirs: HeirsInput;
  estate: EstateInput;
  fiqhConfig: FiqhConfig;
};

const STORAGE_KEY = "majalis-mawarith-cases-v1";
const MAX_SAVED = 20;

function readAll(): SavedInheritanceCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(cases: SavedInheritanceCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases.slice(0, MAX_SAVED)));
  } catch {
    /* localStorage قد يكون ممتلئًا أو غير متاح — تجاهل بصمت، الحفظ ميزة تكميلية */
  }
}

export function listSavedCases(): SavedInheritanceCase[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveCase(entry: Omit<SavedInheritanceCase, "id" | "createdAt">): SavedInheritanceCase {
  const saved: SavedInheritanceCase = {
    ...entry,
    id: `mwc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  writeAll([saved, ...readAll()]);
  return saved;
}

export function deleteSavedCase(id: string): void {
  writeAll(readAll().filter((c) => c.id !== id));
}
