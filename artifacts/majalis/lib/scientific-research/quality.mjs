export function validatePaperQuality(paper) {
  const issues = [];

  if (!paper.title?.trim() || paper.title.length < 8) issues.push("title_too_short");
  if (!paper.author_name?.trim()) issues.push("missing_author");
  if (!paper.abstract_full?.trim() && !paper.abstract_short?.trim()) issues.push("missing_abstract");
  if (!paper.pdf_url && !paper.file_url) issues.push("missing_pdf");
  if ((paper.title || "").length > 500) issues.push("title_too_long");
  if ((paper.abstract_full || "").length > 15000) issues.push("abstract_too_long");

  return { ok: issues.length === 0, issues };
}

export function estimatePageCount(fileSizeBytes) {
  if (!fileSizeBytes) return null;
  return Math.max(1, Math.round(fileSizeBytes / 50000));
}

export function defaultCoverUrl() {
  return "/images/research/default-cover.svg";
}
