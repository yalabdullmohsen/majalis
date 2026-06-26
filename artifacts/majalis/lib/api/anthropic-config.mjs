export const ANTHROPIC_VERSION = "2023-06-01";
export const ASSISTANT_MODEL = "claude-haiku-4-5";
export const TEST_MODEL = "claude-haiku-4-5";

export function readAnthropicApiKey() {
  return (process.env.ANTHROPIC_API_KEY || "").trim();
}

export function createAnthropicClient(Anthropic, apiKey = readAnthropicApiKey()) {
  return new Anthropic({
    apiKey,
    maxRetries: 0,
    defaultHeaders: {
      "anthropic-version": ANTHROPIC_VERSION,
    },
  });
}
