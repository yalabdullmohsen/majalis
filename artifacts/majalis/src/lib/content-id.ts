/**
 * Normalize and expand content identifiers for routing and lookup.
 * Supports UUID, slug, external_key (e.g. kuwait-lessons:hash), legacy ids, and encoded params.
 */

export function normalizeRouteParam(raw: string | undefined | null): string {
  if (!raw) return "";
  let value = String(raw).trim();
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }
  return value.replace(/\/+$/, "");
}

export function encodeRouteSegment(id: string | undefined | null): string {
  const normalized = normalizeRouteParam(id);
  if (!normalized) return "";
  return encodeURIComponent(normalized);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH_RE = /^[a-f0-9]{24,64}$/i;

/** All identifier variants to try when resolving content. */
export function expandContentIdentifiers(raw: string | undefined | null): string[] {
  const normalized = normalizeRouteParam(raw);
  if (!normalized) return [];

  const candidates = new Set<string>();
  const rawTrimmed = String(raw || "").trim();

  candidates.add(normalized);
  if (rawTrimmed) candidates.add(rawTrimmed);

  try {
    candidates.add(encodeURIComponent(normalized));
  } catch {
    /* ignore */
  }

  if (normalized.includes(":")) {
    const colonIdx = normalized.indexOf(":");
    const prefix = normalized.slice(0, colonIdx);
    const suffix = normalized.slice(colonIdx + 1);
    if (suffix) {
      candidates.add(suffix);
      candidates.add(`${prefix}:${suffix}`);
    }
    if (prefix === "kuwait-lessons" && suffix) {
      candidates.add(`kw-${suffix.slice(0, 12)}`);
    }
  } else {
    if (HASH_RE.test(normalized)) {
      candidates.add(`kuwait-lessons:${normalized}`);
    }
    if (UUID_RE.test(normalized)) {
      candidates.add(normalized.toLowerCase());
      candidates.add(normalized.toUpperCase());
    }
  }

  if (normalized.startsWith("kw-")) {
    candidates.add(normalized.slice(3));
  }

  return [...candidates].filter(Boolean);
}

export function matchesContentIdentifier(recordId: string, rawParam: string | undefined | null): boolean {
  const id = String(recordId || "").trim();
  if (!id) return false;
  return expandContentIdentifiers(rawParam).some((candidate) => candidate === id);
}
