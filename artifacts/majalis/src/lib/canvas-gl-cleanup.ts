/**
 * Part 21 — Canvas / WebGL resource lifecycle cleanup.
 * Explicitly releases 2d & WebGL contexts and zeroes canvas buffers
 * (`width = 0; height = 0`) to prevent silent GPU memory leaks on mobile.
 * Logic-only — no UI layouts / CSS.
 */

export type CanvasCleanupResult = {
  cleared: boolean;
  contextLost: boolean;
  reasons: string[];
};

type WebGLContextLike = {
  getExtension?: (name: string) => { loseContext?: () => void } | null;
  isContextLost?: () => boolean;
};

/**
 * Release drawing resources for an HTMLCanvasElement.
 * Safe to call multiple times / on already-detached canvases.
 */
export function releaseCanvasResources(
  canvas: HTMLCanvasElement | null | undefined,
): CanvasCleanupResult {
  const reasons: string[] = [];
  if (!canvas) {
    return { cleared: false, contextLost: false, reasons: ["null-canvas"] };
  }

  let contextLost = false;

  try {
    const gl =
      (canvas.getContext("webgl2") as WebGLContextLike | null) ||
      (canvas.getContext("webgl") as WebGLContextLike | null) ||
      (canvas.getContext("experimental-webgl") as WebGLContextLike | null);
    if (gl) {
      const ext = gl.getExtension?.("WEBGL_lose_context");
      if (ext?.loseContext) {
        ext.loseContext();
        contextLost = true;
        reasons.push("webgl-lose-context");
      } else if (gl.isContextLost?.()) {
        contextLost = true;
        reasons.push("webgl-already-lost");
      }
    }
  } catch {
    reasons.push("webgl-release-error");
  }

  try {
    const ctx2d = canvas.getContext("2d");
    if (ctx2d) {
      try {
        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        ctx2d.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
        reasons.push("2d-cleared");
      } catch {
        reasons.push("2d-clear-error");
      }
    }
  } catch {
    reasons.push("2d-context-error");
  }

  try {
    // Force buffer discard — critical for mobile GPU memory
    canvas.width = 0;
    canvas.height = 0;
    reasons.push("zero-dimensions");
  } catch {
    reasons.push("dimension-error");
  }

  return {
    cleared: reasons.includes("zero-dimensions"),
    contextLost,
    reasons,
  };
}

/**
 * Create + use an offscreen canvas, then always release GPU buffers.
 */
export async function withEphemeralCanvas<T>(
  width: number,
  height: number,
  work: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => Promise<T> | T,
): Promise<T> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width | 0);
  canvas.height = Math.max(1, height | 0);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseCanvasResources(canvas);
    throw new Error("canvas-2d-unavailable");
  }
  try {
    return await work(canvas, ctx);
  } finally {
    releaseCanvasResources(canvas);
  }
}

/**
 * Hook-friendly disposer: call from useEffect cleanup when a component
 * owns a canvas ref. Does not touch React DOM structure.
 */
export function createCanvasDisposer(
  getCanvas: () => HTMLCanvasElement | null | undefined,
): () => CanvasCleanupResult {
  return () => releaseCanvasResources(getCanvas());
}
