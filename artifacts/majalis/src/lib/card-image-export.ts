/**
 * High-resolution card image export + Web Share API fallback.
 * Uses existing html-to-image dependency — no CSS / layout changes.
 */
import { toPng } from "html-to-image";

export type CardExportResult =
  | { ok: true; method: "share" | "download"; fileName: string }
  | { ok: false; error: string };

/** Logical export targets — pixelRatio only (canvas size comes from existing DOM). */
export type CardExportPreset = "feed" | "story" | "wide";

export const CARD_EXPORT_PRESETS: Record<
  CardExportPreset,
  { pixelRatio: number; label: string; aspect: "1:1" | "9:16" | "16:9" }
> = {
  feed: { pixelRatio: 3, label: "1:1 Feed", aspect: "1:1" },
  story: { pixelRatio: 4, label: "9:16 Story", aspect: "9:16" },
  wide: { pixelRatio: 3, label: "16:9 Wide", aspect: "16:9" },
};

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
    preset?: CardExportPreset;
    title?: string;
    text?: string;
    /** Force download even when Web Share is available. */
    forceDownload?: boolean;
  },
): Promise<CardExportResult> {
  const fileName = options?.fileName || `بطاقة-مجلس-علمي-${Date.now()}.png`;
  const presetRatio = options?.preset ? CARD_EXPORT_PRESETS[options.preset].pixelRatio : undefined;
  const pixelRatio = options?.pixelRatio ?? presetRatio ?? 3;

  try {
    const dataUrl = await toPng(element, {
      pixelRatio,
      cacheBust: true,
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

/** Convenience: export with a named social preset (story / feed / wide). */
export async function exportSocialCard(
  element: HTMLElement,
  preset: CardExportPreset,
  options?: Omit<Parameters<typeof exportCardImage>[1], "preset" | "pixelRatio">,
): Promise<CardExportResult> {
  return exportCardImage(element, { ...options, preset });
}
