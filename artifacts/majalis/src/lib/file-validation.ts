export const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
export const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp"]);
export const PDF_MIME = new Set(["application/pdf"]);
export const MEDIA_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
]);

export const MAX_SHEIKH_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

export type FileValidationResult =
  | { ok: true }
  | { ok: false; error: string };

function extOf(name: string) {
  return (name.split(".").pop() || "").toLowerCase();
}

export function validateSheikhImage(file: File): FileValidationResult {
  if (!file) return { ok: false, error: "لم يتم اختيار ملف." };
  if (file.size > MAX_SHEIKH_IMAGE_BYTES) {
    return { ok: false, error: "حجم الصورة يتجاوز 5 ميجابايت." };
  }
  const ext = extOf(file.name);
  if (!IMAGE_EXT.has(ext) && !IMAGE_MIME.has(file.type)) {
    return { ok: false, error: "يُسمح فقط بصور: png, jpg, jpeg, webp." };
  }
  return { ok: true };
}

export function validateMediaUpload(file: File): FileValidationResult {
  if (!file) return { ok: false, error: "لم يتم اختيار ملف." };
  if (file.size > MAX_MEDIA_BYTES) {
    return { ok: false, error: "حجم الملف يتجاوز 100 ميجابايت." };
  }
  const ext = extOf(file.name);
  const allowedExt = new Set(["mp3", "wav", "m4a", "mp4", "webm"]);
  if (!allowedExt.has(ext) && !MEDIA_MIME.has(file.type)) {
    return { ok: false, error: "نوع الملف غير مدعوم. استخدم mp3, wav, m4a, mp4, webm." };
  }
  return { ok: true };
}

export function safeUploadFileName(original: string, fallbackExt = "bin") {
  const base = original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const ext = extOf(base) || fallbackExt;
  return base.includes(".") ? base : `${base}.${ext}`;
}
