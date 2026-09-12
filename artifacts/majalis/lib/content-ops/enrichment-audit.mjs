/**
 * Path-C enrichment auditors — deterministic only.
 */
import { createHash } from "node:crypto";

const PLACEHOLDER_RE =
  /\b(lorem ipsum|TODO: content|FIXME: content|placeholder text|tbd content)\b/i;
const TEST_ID_RE = /^(test|dummy|placeholder|tmp|temp)$/i;
const LOCALHOST_RE = /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i;
const LEGACY_BRAND_RE = /منهج\s*مجالس|تطبيق\s*مجالس|MajalisApp/g;

export function findLeadingSpaceDuplicateLines(text) {
  if (!text) return [];
  const lines = String(text).split("\n");
  const hits = [];
  for (let i = 1; i < lines.length; i++) {
    const cur = lines[i];
    if (!/^\s+\S/.test(cur)) continue;
    const t = cur.trim();
    if (t.length < 40) continue;
    if (lines[i - 1].includes(t)) hits.push({ lineIndex: i, text: t });
  }
  return hits;
}

export function stripLeadingSpaceDuplicates(text) {
  const lines = String(text).split("\n");
  const out = [];
  let removed = 0;
  for (const cur of lines) {
    const t = cur.trim();
    const prev = out[out.length - 1] || "";
    if (/^\s+\S/.test(cur) && t.length >= 40 && prev.includes(t)) {
      removed += 1;
      continue;
    }
    out.push(cur);
  }
  return { text: out.join("\n"), removed };
}

export function detectTechnicalIssues(record = {}) {
  const issues = [];
  const title = record.title || "";
  const body = record.body || record.description || "";
  const id = String(record.id || record.contentId || "");

  if (!String(title).trim()) issues.push({ code: "missing_title", severity: "block" });
  if (TEST_ID_RE.test(id)) {
    issues.push({ code: "test_id", severity: "fixable_path_c" });
  }
  if (PLACEHOLDER_RE.test(title) || PLACEHOLDER_RE.test(body)) {
    issues.push({ code: "placeholder_content", severity: "block" });
  }
  if (LOCALHOST_RE.test(body) || LOCALHOST_RE.test(record.url || "")) {
    issues.push({ code: "localhost_url", severity: "block" });
  }
  const brandHits = `${title}\n${body}`.match(LEGACY_BRAND_RE);
  if (brandHits?.length) {
    issues.push({
      code: "legacy_brand",
      severity: "fixable_path_c",
      count: brandHits.length,
      replaceWith: "سُنّة",
    });
  }
  const dups = findLeadingSpaceDuplicateLines(body);
  if (dups.length) {
    issues.push({
      code: "leading_space_duplicate_sentence",
      severity: "fixable_path_c",
      count: dups.length,
    });
  }
  return issues;
}

export function contentHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function classifyEnrichmentAction(issue, { protectedContent = false } = {}) {
  if (protectedContent) {
    return { action: "automatically_blocked", reason: "protected_content", mayPublish: false };
  }
  if (issue.severity === "fixable_path_c") {
    return { action: "path_c_autofix", reason: issue.code, mayPublish: true, path: "C" };
  }
  if (issue.severity === "block") {
    return { action: "automatically_blocked", reason: issue.code, mayPublish: false };
  }
  return { action: "proposed_isolated", reason: issue.code || "unproven", mayPublish: false };
}
