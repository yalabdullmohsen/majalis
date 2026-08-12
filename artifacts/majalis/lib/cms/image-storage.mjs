/**
 * Upload lesson poster images to Supabase Storage (admin-only bucket).
 */
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export const LESSON_POSTER_BUCKET = "lesson-posters";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validateImageUpload({ buffer, mimeType, sizeBytes }) {
  const size = sizeBytes ?? buffer?.length ?? 0;
  const mime = String(mimeType || "image/jpeg").toLowerCase();

  if (!buffer || size === 0) {
    return { ok: false, error: "missing_image", message: "لم تُرفع صورة." };
  }
  if (size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "file_too_large", message: "حجم الصورة يتجاوز 5 ميغابايت." };
  }
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    return { ok: false, error: "invalid_mime", message: "نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP." };
  }
  return { ok: true, mime, size };
}

function extForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function uploadLessonPoster({ buffer, mimeType, userId }) {
  const check = validateImageUpload({ buffer, mimeType, sizeBytes: buffer.length });
  if (!check.ok) return check;

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const ext = extForMime(check.mime);
  const path = `imports/${userId || "system"}/${randomUUID()}.${ext}`;

  const { error } = await admin.storage.from(LESSON_POSTER_BUCKET).upload(path, buffer, {
    contentType: check.mime,
    upsert: false,
  });

  if (error) return { ok: false, error: error.message };

  const { data } = admin.storage.from(LESSON_POSTER_BUCKET).getPublicUrl(path);
  return { ok: true, path, url: data.publicUrl };
}

export function decodeBase64Image(imageBase64) {
  const raw = String(imageBase64 || "").trim();
  if (!raw) return null;
  const data = raw.includes(",") ? raw.split(",")[1] : raw;
  try {
    return Buffer.from(data, "base64");
  } catch {
    return null;
  }
}
