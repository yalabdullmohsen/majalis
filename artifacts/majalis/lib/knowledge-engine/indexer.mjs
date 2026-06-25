/**
 * Indexer — chunks content and prepares for hybrid/semantic search.
 */

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function splitChunks(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= CHUNK_SIZE) return [clean];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE, clean.length);
    chunks.push(clean.slice(start, end));
    start = end - CHUNK_OVERLAP;
    if (start >= clean.length - CHUNK_OVERLAP) break;
  }
  return chunks;
}

export async function indexItem(admin, itemId, text, metadata = {}) {
  const chunks = splitChunks(text);
  if (!chunks.length) return { indexed: 0 };

  await admin.from("knowledge_chunks").delete().eq("item_id", itemId);

  const chunkRows = chunks.map((chunk_text, chunk_index) => ({
    item_id: itemId,
    chunk_index,
    chunk_text,
    token_count: chunk_text.split(/\s+/).length,
    metadata,
  }));

  const { data: inserted, error } = await admin
    .from("knowledge_chunks")
    .insert(chunkRows)
    .select("id");

  if (error) throw error;

  return { indexed: inserted?.length || 0, chunk_ids: (inserted || []).map((c) => c.id) };
}

export async function generateEmbedding(text) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: String(text).slice(0, 8000),
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

export async function embedChunks(admin, itemId, chunkIds, texts) {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  if (!hasOpenAI) return { embedded: 0 };

  let embedded = 0;
  for (let i = 0; i < chunkIds.length; i++) {
    const embedding = await generateEmbedding(texts[i]);
    if (!embedding) continue;
    const { error } = await admin.from("knowledge_embeddings").upsert({
      chunk_id: chunkIds[i],
      item_id: itemId,
      embedding,
      model_name: "text-embedding-3-small",
    }, { onConflict: "chunk_id" });
    if (!error) embedded++;
  }
  return { embedded };
}

export async function indexAndEmbed(admin, item) {
  const text = [item.ai_title, item.ai_summary, item.raw_body].filter(Boolean).join("\n\n");
  const { indexed, chunk_ids } = await indexItem(admin, item.id, text, {
    kind: item.content_kind,
    category: item.ai_category,
  });

  let embedded = 0;
  if (chunk_ids?.length) {
    const { data: chunks } = await admin
      .from("knowledge_chunks")
      .select("id, chunk_text")
      .in("id", chunk_ids);
    if (chunks?.length) {
      const result = await embedChunks(
        admin,
        item.id,
        chunks.map((c) => c.id),
        chunks.map((c) => c.chunk_text),
      );
      embedded = result.embedded;
    }
  }

  return { indexed, embedded };
}

export { splitChunks };
