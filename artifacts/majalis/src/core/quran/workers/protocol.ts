/**
 * Shared message protocol for Quran core Web Workers.
 * Keep payloads structured-cloneable (no Blobs / functions).
 */

export type MutashabihatWorkerRequest = {
  id: string;
  type: "flatten-index";
  index: Record<string, Array<{ surah: number; ayah: number }>>;
  themes?: Record<string, string[]>;
};

export type MutashabihatWorkerResponse = {
  id: string;
  type: "flatten-index-result";
  rows: Array<{
    ayah_key: string;
    similar_ayah_keys: string[];
    theme_ids: string[];
  }>;
  error?: string;
};

export type TajweedWorkerHeard = {
  word: string;
  startSec: number | null;
  endSec: number | null;
};

export type TajweedWorkerRef = {
  index: number;
  raw: string;
};

export type TajweedWorkerRequest = {
  id: string;
  type: "analyze-timings";
  pairs: Array<{ ref: TajweedWorkerRef; heard: TajweedWorkerHeard }>;
};

export type TajweedWorkerNote = {
  refIndex: number;
  rule: string;
  confidencePct: number;
  message: string;
};

export type TajweedWorkerResponse = {
  id: string;
  type: "analyze-timings-result";
  notes: TajweedWorkerNote[];
  error?: string;
};
