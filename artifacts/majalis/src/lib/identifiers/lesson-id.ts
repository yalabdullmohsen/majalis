/** Shared UUID / slug helpers for routing and repositories. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Lowercase, trim, collapse whitespace; keep arabic letters and hyphens. */
export function normalizeSlug(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function classifyIdentifier(value: unknown): "uuid" | "slug" | "invalid" {
  if (typeof value !== "string") return "invalid";
  const raw = value.trim();
  if (!raw || raw.length > 200) return "invalid";
  if (raw.includes("..") || raw.includes("/") || raw.includes("\\")) return "invalid";
  if (isUuid(raw)) return "uuid";
  const slug = normalizeSlug(raw);
  if (!slug || slug.length < 2) return "invalid";
  return "slug";
}
