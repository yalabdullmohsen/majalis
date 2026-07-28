/**
 * High-resolution card image export + Web Share API fallback.
 * Uses existing html-to-image dependency — no CSS changes.
 */
import { toPng } from "html-to-image";

export type CardExportResult =
  | { ok: true; method: "share" | "download"; fileName: string }
  | { ok: false; error: string };

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(header)?.[1] || "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

/**
 * Render a DOM node to a crisp PNG (pixelRatio ≥ 3 for story/post sharpness).
 * Prefers navigator.share({ files }) on mobile; otherwise downloads the file.
 */
export async function exportCardImage(
  element: HTMLElement,
  options?: {
    fileName?: string;
    /** Default 3; use 4 for ultra-sharp story exports. */
    pixelRatio?: number;
    title?: string;
    text?: string;
    /** Force download even when Web Share is available. */
    forceDownload?: boolean;
  },
): Promise<CardExportResult> {
  const fileName = options?.fileName || `بطاقة-مجلس-علمي-${Date.now()}.png`;
  const pixelRatio = options?.pixelRatio ?? 3;

  try {
    const dataUrl = await toPng(element, {
      pixelRatio,
      cacheBust: true,
      // Improve sharpness on high-DPI mobile screens
      quality: 1,
    });

    const canShareFiles =
      !options?.forceDownload &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof Navigator !== "undefined" &&
      typeof Navigator.prototype.canShare === "function";

    if (canShareFiles) {
      try {
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], fileName, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: options?.title || "بطاقة المجلس العلمي",
            text: options?.text || "",
          });
          return { ok: true, method: "share", fileName };
        }
      } catch (err) {
        // User abort → don't fall through as error download spam
        if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "AbortError") {
          return { ok: false, error: "aborted" };
        }
        /* fall through to download */
      }
    }

    triggerDownload(dataUrl, fileName);
    return { ok: true, method: "download", fileName };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "export_failed" };
  }
}

/** Download-only helper (keeps previous CardsPage behavior). */
export async function downloadCardImage(
  element: HTMLElement,
  fileName?: string,
  pixelRatio = 3,
): Promise<CardExportResult> {
  return exportCardImage(element, { fileName, pixelRatio, forceDownload: true });
}
