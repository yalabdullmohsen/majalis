export function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

export function safePublicError(error, fallback = "حدث خطأ. حاول مجددًا.") {
  if (!(error instanceof Error)) return fallback;
  const msg = error.message || "";

  if (
    msg.includes("ANTHROPIC") ||
    msg.includes("SUPABASE") ||
    msg.includes("API_KEY") ||
    msg.includes("SERVICE_ROLE") ||
    msg.includes("stack") ||
    msg.includes("/assets/") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("fetch failed")
  ) {
    return fallback;
  }

  if (msg.length > 120) return fallback;
  return msg;
}

export function blockInProduction(res, sendJson) {
  if (!isProduction()) return false;
  sendJson(res, 404, { ok: false, error: "غير متاح." });
  return true;
}
