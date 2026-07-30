/**
 * Silence Node DEP0169 from parseurl→url.parse used by Express.
 * Must be imported before `express` / `parseurl` load (they capture url.parse).
 */
import url from "node:url";

function toLegacyUrlObject(parsed, input) {
  return {
    protocol: parsed.protocol || null,
    slashes: parsed.protocol ? true : null,
    auth: parsed.username ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}` : null,
    host: parsed.host || null,
    port: parsed.port || null,
    hostname: parsed.hostname || null,
    hash: parsed.hash || null,
    search: parsed.search || null,
    query: parsed.search ? parsed.search.slice(1) : null,
    pathname: parsed.pathname || null,
    path: `${parsed.pathname || ""}${parsed.search || ""}` || null,
    href: parsed.href || String(input || ""),
  };
}

if (typeof url.parse === "function" && !url.parse.__majalisDep0169Patched) {
  const original = url.parse.bind(url);
  function patchedParse(input, parseQueryString, slashesDenoteHost) {
    if (typeof input === "string" && !parseQueryString && slashesDenoteHost == null) {
      try {
        const abs = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(input)
          ? new URL(input)
          : new URL(input, "http://localhost");
        return toLegacyUrlObject(abs, input);
      } catch {
        return original(input, parseQueryString, slashesDenoteHost);
      }
    }
    return original(input, parseQueryString, slashesDenoteHost);
  }
  patchedParse.__majalisDep0169Patched = true;
  url.parse = patchedParse;
}
