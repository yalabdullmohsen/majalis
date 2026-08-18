/**
 * يُحمّل ويُحلّل فهرس البحث خارج الخيط الرئيسي.
 */
addEventListener("message", async (event: MessageEvent<{ url?: string }>) => {
  try {
    const url = event.data?.url;
    if (!url) throw new Error("missing url");
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`search index ${res.status}`);
    const json = await res.json();
    postMessage({ ok: true, json });
  } catch (err) {
    postMessage({
      ok: false,
      error: err instanceof Error ? err.message : "search worker failed",
    });
  }
});
