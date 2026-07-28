/**
 * Vitest setup — polyfill IndexedDB before any Dexie import.
 */
import "fake-indexeddb/auto";

// Dexie / Audio may touch these in Node.
if (typeof globalThis.structuredClone !== "function") {
  // Minimal structuredClone for plain JSON-like values in older Node.
  // Node 24 provides it; this is a safety net only.
  (globalThis as { structuredClone: <T>(v: T) => T }).structuredClone = <T>(v: T) =>
    JSON.parse(JSON.stringify(v)) as T;
}
