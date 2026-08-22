/**
 * يفرض Content-Type: text/html; charset=utf-8 على استجابات HTML في dev/preview.
 * vite preview الافتراضي يرسل text/html بلا charset — يفشل Lighthouse Best Practices.
 */

function wantsHtml(req) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const path = (req.url || "/").split("?")[0] || "/";
  if (/\.(js|mjs|css|woff2?|png|jpe?g|svg|webp|ico|json|xml|txt|map|webmanifest)$/i.test(path)) {
    return false;
  }
  const accept = req.headers.accept || "";
  return accept.includes("text/html") || accept.includes("*/*") || !/\.\w+$/.test(path);
}

function patchHtmlCharset(res) {
  const original = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (
      typeof name === "string" &&
      name.toLowerCase() === "content-type" &&
      typeof value === "string" &&
      value.includes("text/html") &&
      !/charset=/i.test(value)
    ) {
      value = "text/html; charset=utf-8";
    }
    return original(name, value);
  };
}

export function htmlCharsetMiddleware(req, res, next) {
  if (!wantsHtml(req)) return next();
  patchHtmlCharset(res);
  next();
}

export function htmlCharsetPlugin() {
  return {
    name: "majalis-html-charset",
    configureServer(server) {
      server.middlewares.use(htmlCharsetMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(htmlCharsetMiddleware);
    },
  };
}
