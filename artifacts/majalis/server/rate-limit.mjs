const buckets = new Map();

export function createRateLimiter({ windowMs = 60_000, max = 20, keyPrefix = "" } = {}) {
  return (req, res, next) => {
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now >= entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      res.statusCode = 429;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار دقيقة ثم المحاولة مجددًا.",
        })
      );
      return;
    }

    entry.count += 1;
    return next();
  };
}
