// OpenAI-compatible client using fetch + SSE
// Supports any endpoint that implements the OpenAI Chat Completions API format
// (Baidu Qianfan, DeepSeek, Zhipu GLM, Moonshot, etc.)

import type {
  LLMClient,
  CreateMessageParams,
  LLMResponse,
  LLMMessage,
  LLMToolDefinition,
  LLMResponseBlock,
} from "./llm-client.js";

interface OpenAICompatConfig {
  baseUrl: string; // e.g. "https://api.deepseek.com/v1"
  apiKey: string;
  customHeaders?: Record<string, string>;
}

// --- OpenAI API request/response types ---

interface OAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: OAIToolCall[];
  tool_call_id?: string;
}

interface OAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface OAIStreamDelta {
  id?: string;
  choices?: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

export class OpenAICompatClient implements LLMClient {
  private config: OpenAICompatConfig;

  constructor(config: OpenAICompatConfig) {
    this.config = config;
  }

  updateConfig(config: OpenAICompatConfig): void {
    this.config = config;
  }

  async createMessage(params: CreateMessageParams): Promise<LLMResponse> {
    const url = this.buildUrl("/chat/completions");
    const messages = this.convertMessages(params.system, params.messages);
    const tools = params.tools ? this.convertTools(params.tools) : undefined;

    const body: Record<string, unknown> = {
      model: params.model,
      messages,
      max_tokens: params.maxTokens,
      stream: true,
    };
    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      ...this.config.customHeaders,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: params.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const error = `API Error (${response.status}): ${text || response.statusText}`;
      params.callbacks.onError(error);
      throw new Error(error);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    return this.processSSEStream(response.body, params);
  }

  async validateKey(): Promise<boolean> {
    const url = this.buildUrl("/chat/completions");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          ...this.config.customHeaders,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // fallback model name for validation
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1,
          stream: false,
        }),
      });
      // Accept 200 or any 4xx that isn't 401/403 (means endpoint works, maybe model wrong)
      return response.ok || (response.status >= 400 && response.status < 500 && response.status !== 401 && response.status !== 403);
    } catch {
      return false;
    }
  }

  // --- Internal ---

  private buildUrl(path: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    // If user already included the endpoint path, use as-is
    if (base.endsWith("/chat/completions")) {
      return base;
    }
    // If user included /v1 or /v2 etc, just append the path
    return `${base}${path}`;
  }

  private convertMessages(system: string, messages: LLMMessage[]): OAIMessage[] {
    const result: OAIMessage[] = [];

    // System message
    if (system) {
      result.push({ role: "system", content: system });
    }

    for (const msg of messages) {
      if (msg.role === "user") {
        const content =
          typeof msg.content === "string"
            ? msg.content
            : msg.content
                .filter((c) => c.type === "text")
                .map((c) => (c as { type: "text"; text: string }).text)
                .join("\n");
        result.push({ role: "user", content });
      } else if (msg.role === "assistant") {
        const oaiMsg: OAIMessage = { role: "assistant" };

        if (typeof msg.content === "string") {
          oaiMsg.content = msg.content;
        } else {
          const textParts = msg.content
            .filter((c) => c.type === "text")
            .map((c) => (c as { type: "text"; text: string }).text);
          if (textParts.length > 0) {
            oaiMsg.content = textParts.join("\n");
          }
        }

        if (msg.toolCalls && msg.toolCalls.length > 0) {
          oaiMsg.tool_calls = msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.input),
            },
          }));
        }

        result.push(oaiMsg);
      } else if (msg.role === "tool") {
        result.push({
          role: "tool",
          tool_call_id: msg.toolCallId,
          content: msg.content,
        });
      }
    }

    return result;
  }

  private convertTools(tools: LLMToolDefinition[]): OAITool[] {
    return tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }));
  }

  private async processSSEStream(
    body: ReadableStream<Uint8Array>,
    params: CreateMessageParams
  ): Promise<LLMResponse> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let finishReason = "";

    // Accumulate tool calls across chunks
    const toolCallAccum: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") {
            if (trimmed === "data: [DONE]") {
              // Stream complete
            }
            continue;
          }

          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          let chunk: OAIStreamDelta;
          try {
            chunk = JSON.parse(jsonStr);
          } catch {
            continue; // skip malformed JSON
          }

          if (!chunk.choices || chunk.choices.length === 0) continue;
          const choice = chunk.choices[0];

          // Text content
          if (choice.delta.content) {
            fullText += choice.delta.content;
            params.callbacks.onText(choice.delta.content);
          }

          // Tool calls (accumulated across chunks)
          if (choice.delta.tool_calls) {
            for (const tc of choice.delta.tool_calls) {
              const existing = toolCallAccum.get(tc.index);
              if (!existing) {
                toolCallAccum.set(tc.index, {
                  id: tc.id || "",
                  name: tc.function?.name || "",
                  arguments: tc.function?.arguments || "",
                });
              } else {
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.name += tc.function.name;
                if (tc.function?.arguments)
                  existing.arguments += tc.function.arguments;
              }
            }
          }

          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Build response
    const content: LLMResponseBlock[] = [];

    if (fullText) {
      content.push({ type: "text", text: fullText });
    }

    // Emit tool uses and add to content
    for (const [, tc] of toolCallAccum) {
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(tc.arguments);
      } catch {
        input = { _raw: tc.arguments };
      }

      params.callbacks.onToolUse({
        id: tc.id,
        name: tc.name,
        input,
      });

      content.push({
        type: "tool_use",
        id: tc.id,
        name: tc.name,
        input,
      });
    }

    const stopReason: "end_turn" | "tool_use" =
      finishReason === "tool_calls" || toolCallAccum.size > 0
        ? "tool_use"
        : "end_turn";

    return { content, stopReason };
  }
}
