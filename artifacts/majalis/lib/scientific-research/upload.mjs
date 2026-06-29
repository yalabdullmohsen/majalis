import crypto from "node:crypto";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
];

export function validateUploadFile(file) {
  const errors = [];
  if (!file) errors.push("missing_file");
  else {
    if (file.size > MAX_UPLOAD_BYTES) errors.push("file_too_large");
    if (file.type && !ALLOWED_MIME.includes(file.type)) errors.push("invalid_mime");
    if (file.name && /\.(exe|bat|sh|cmd|js|html)$/i.test(file.name)) errors.push("dangerous_extension");
  }
  return { ok: errors.length === 0, errors };
}

export function computeFileHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 32);
}

export function slugifyTitle(title) {
  const base = String(title || "")
    .trim()
    .slice(0, 80)
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "research"}-${suffix}`;
}

export async function checkDuplicateTitle(admin, title) {
  const norm = String(title || "").trim().toLowerCase();
  const { data } = await admin.from("research_papers").select("id, title").ilike("title", norm);
  return (data || []).length > 0;
}

export async function checkDuplicateHash(admin, hash) {
  if (!hash) return false;
  const { data } = await admin.from("research_papers").select("id").eq("content_hash", hash).maybeSingle();
  return Boolean(data);
}
