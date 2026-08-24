/**
 * تسخين اتصال WebSocket لتلاوة ASR قبل ضغط الميكروفون.
 * يفتح المقبس مبكرًا (بدون ميكروفون) ويُسلَّم لجلسة لاحقة عبر takeWarmedRecitationWs.
 */
import { getRecitationWsToken, getRecitationWsUrl } from "./streaming-audio";
import { markTarteelLatency } from "./tarteel-latency";

let warmed: WebSocket | null = null;
let warming: Promise<"ready" | "skipped" | "failed"> | null = null;

export function takeWarmedRecitationWs(): WebSocket | null {
  const sock = warmed;
  warmed = null;
  if (sock && sock.readyState === WebSocket.OPEN) return sock;
  try {
    sock?.close();
  } catch {
    /* ignore */
  }
  return null;
}

export function discardWarmedRecitationWs(): void {
  dropWarmedRecitationWs();
}

function closeWarmedSocketOnly(): void {
  try {
    warmed?.close();
  } catch {
    /* ignore */
  }
  warmed = null;
}

export function dropWarmedRecitationWs(): void {
  closeWarmedSocketOnly();
  warming = null;
}

/**
 * يفتح WebSocket مبكرًا إن وُجد VITE_RECITATION_WS_URL.
 * لا يطلب إذن ميكروفون — فقط مصافحة الشبكة لتقليل الكمون البارد.
 */
export function warmRecitationWsConnection(): Promise<"ready" | "skipped" | "failed"> {
  if (warming) return warming;
  warming = (async () => {
    const url = getRecitationWsUrl();
    if (!url || typeof WebSocket === "undefined") {
      markTarteelLatency("ws_warm_skipped");
      return "skipped";
    }
    if (warmed && warmed.readyState === WebSocket.OPEN) {
      markTarteelLatency("ws_warm_ready", { ms: 0 });
      return "ready";
    }
    closeWarmedSocketOnly();
    markTarteelLatency("ws_warm_start");
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();

    return await new Promise<"ready" | "failed">((resolve) => {
      let settled = false;
      let sock: WebSocket;
      try {
        sock = new WebSocket(url);
      } catch {
        markTarteelLatency("ws_warm_failed");
        resolve("failed");
        return;
      }
      sock.binaryType = "arraybuffer";
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          sock.close();
        } catch {
          /* ignore */
        }
        markTarteelLatency("ws_warm_timeout");
        resolve("failed");
      }, 6000);

      sock.onopen = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        warmed = sock;
        const token = getRecitationWsToken();
        try {
          sock.send(
            JSON.stringify({
              type: "warmup",
              language: "ar",
              ...(token ? { token } : {}),
            }),
          );
        } catch {
          /* ignore */
        }
        const elapsed =
          (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
        markTarteelLatency("ws_warm_ready", { ms: Math.round(elapsed) });
        resolve("ready");
      };

      sock.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        markTarteelLatency("ws_warm_failed");
        resolve("failed");
      };

      sock.onclose = () => {
        if (warmed === sock) warmed = null;
      };
    });
  })().finally(() => {
    warming = null;
  });

  return warming;
}
