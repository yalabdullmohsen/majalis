import { adminFetch } from "@/lib/admin-api";

type SmartCmsResponse = {
  ok: boolean;
  error?: string;
  draft?: Record<string, unknown>;
  drafts?: Record<string, unknown>[];
  extracted?: Record<string, unknown>;
  validation?: { valid: boolean; errors: { field: string; message: string }[]; warnings: unknown[] };
  lesson?: Record<string, unknown>;
};

async function postSmartCms(body: Record<string, unknown>): Promise<SmartCmsResponse> {
  const res = await adminFetch("/api/admin/smart-cms", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function listContentDrafts(status = "pending") {
  return postSmartCms({ action: "list-drafts", status });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function extractLessonFromImageFile(file: File) {
  const base64 = await fileToBase64(file);
  return postSmartCms({
    action: "extract-from-image",
    imageBase64: base64,
    mimeType: file.type || "image/jpeg",
  });
}

export async function extractLessonFromUrl(url: string) {
  return postSmartCms({ action: "extract-from-url", url });
}

export async function approveContentDraft(draftId: string, extracted?: Record<string, unknown>) {
  return postSmartCms({ action: "approve-draft", draftId, extracted });
}

export async function rejectContentDraft(draftId: string) {
  return postSmartCms({ action: "reject-draft", draftId });
}

export async function validateDraftExtracted(extracted: Record<string, unknown>) {
  return postSmartCms({ action: "validate-draft", extracted });
}

export async function extractFromRawText(rawText: string, hint?: string) {
  return postSmartCms({ action: "extract-from-text", rawText, hint });
}
