import { sendJson } from "../api/_http.mjs";
import { blockInProduction } from "../api/_security.mjs";

export const maxDuration = 30;

export default async function handler(req, res) {
  if (blockInProduction(res, sendJson)) return;

  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }

  if (!apiKey) {
    sendJson(res, 200, { success: false, error: "Service not configured" });
    return;
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { createAnthropicClient, TEST_MODEL } = await import("../api/anthropic-config.mjs");
    const client = createAnthropicClient(Anthropic, apiKey);
    await client.messages.create({
      model: TEST_MODEL,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with OK only." }],
    });
    sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("[test-anthropic] failed:", error);
    sendJson(res, 200, { success: false, error: "Connection test failed" });
  }
}
