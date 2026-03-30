// Client factory - creates the appropriate LLM client based on provider config

import type { LLMClient } from "./llm-client.js";
import type { ProviderConfig } from "../../shared/settings-types.js";
import { AnthropicClient } from "./anthropic-client.js";
import { OpenAICompatClient } from "./openai-compat-client.js";

export function createClient(provider: ProviderConfig): LLMClient {
  if (provider.type === "anthropic") {
    return new AnthropicClient(provider.apiKey);
  }

  // openai-compatible
  return new OpenAICompatClient({
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    customHeaders: provider.customHeaders,
  });
}
