/**
 * Escape user input for PostgREST filter strings.
 * Bare interpolation into `.or(...)` breaks on `,().` and enables filter injection.
 */

/** Escape LIKE wildcards so user input cannot broaden matches via % / _. */
export function escapeIlikeWildcards(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/** Pattern for column `.ilike(col, pattern)` — contains-match with escaped wildcards. */
export function ilikeContains(term) {
  return `%${escapeIlikeWildcards(term)}%`;
}

/**
 * Quote a filter value for PostgREST `.or()` / filter DSL.
 * Reserved chars `,().:` must live inside double quotes.
 */
export function quotePostgrestFilterValue(value) {
  const raw = String(value ?? "");
  const escaped = raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Build a safe `col.ilike.%term%` clause for `.or(...)`.
 * @param {string} column
 * @param {string} term  raw/normalized search term (wildcards escaped here)
 */
export function postgrestOrIlike(column, term) {
  return `${column}.ilike.${quotePostgrestFilterValue(ilikeContains(term))}`;
}

/** UUID v1–v5 (lowercase/uppercase hex). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}
