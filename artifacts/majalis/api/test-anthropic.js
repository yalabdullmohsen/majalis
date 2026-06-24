import Anthropic from "@anthropic-ai/sdk";
import { createAnthropicClient, readAnthropicApiKey, TEST_MODEL } from "./anthropic-config.js";
import { sendJson } from "./_http.js";

export const maxDuration = 30;

export default async function handler(req, res) {
  const apiKey = readAnthropicApiKey();

  console.log("[test-anthropic] request", {
    method: req.method,
    hasApiKey: Boolean(apiKey),
  });

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
    sendJson(res, 200, { success: false, error: "ANTHROPIC_API_KEY not configured" });
    return;
  }

  try {
    const client = createAnthropicClient(Anthropic, apiKey);
    await client.messages.create({
      model: TEST_MODEL,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with OK only." }],
    });

    console.log("[test-anthropic] success");
    sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("[test-anthropic] Anthropic API failed:", error);
    sendJson(res, 200, {
      success: false,
      error: error?.message || "Anthropic request failed",
    });
  }
}
