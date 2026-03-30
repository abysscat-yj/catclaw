// Anthropic SDK wrapper implementing the LLMClient interface

import Anthropic from "@anthropic-ai/sdk";
import type {
  LLMClient,
  CreateMessageParams,
  LLMResponse,
  LLMMessage,
  LLMToolDefinition,
  LLMResponseBlock,
} from "./llm-client.js";

export class AnthropicClient implements LLMClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  updateApiKey(apiKey: string): void {
    this.client = new Anthropic({ apiKey });
  }

  async createMessage(params: CreateMessageParams): Promise<LLMResponse> {
    const apiMessages = this.convertMessages(params.messages);
    const apiTools = params.tools
      ? this.convertTools(params.tools)
      : undefined;

    const stream = this.client.messages.stream(
      {
        model: params.model,
        system: params.system,
        messages: apiMessages,
        tools: apiTools,
        max_tokens: params.maxTokens,
      },
      { signal: params.signal }
    );

    stream.on("text", (text) => {
      params.callbacks.onText(text);
    });

    try {
      const finalMessage = await stream.finalMessage();

      // Extract tool use blocks and emit callbacks
      for (const block of finalMessage.content) {
        if (block.type === "tool_use") {
          params.callbacks.onToolUse({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      return this.convertResponse(finalMessage);
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        params.callbacks.onError(
          `API Error (${err.status}): ${err.message}`
        );
      }
      throw err;
    }
  }

  async validateKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      return true;
    } catch {
      return false;
    }
  }

  // --- Format conversions ---

  private convertMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
    const result: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === "user") {
        if (typeof msg.content === "string") {
          result.push({ role: "user", content: msg.content });
        } else {
          const blocks: Anthropic.ContentBlockParam[] = msg.content.map(
            (c) => {
              if (c.type === "text") {
                return { type: "text" as const, text: c.text };
              }
              if (c.type === "image") {
                return {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: c.mimeType as
                      | "image/png"
                      | "image/jpeg"
                      | "image/gif"
                      | "image/webp",
                    data: c.data,
                  },
                };
              }
              // tool_use blocks in user content are unexpected but handle gracefully
              return { type: "text" as const, text: "" };
            }
          );
          result.push({ role: "user", content: blocks });
        }
      } else if (msg.role === "assistant") {
        const blocks: Anthropic.ContentBlockParam[] = [];
        if (typeof msg.content === "string") {
          blocks.push({ type: "text", text: msg.content });
        } else {
          for (const c of msg.content) {
            if (c.type === "text") {
              blocks.push({ type: "text", text: c.text });
            } else if (c.type === "tool_use") {
              blocks.push({
                type: "tool_use",
                id: c.id,
                name: c.name,
                input: c.input,
              });
            }
          }
        }
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            blocks.push({
              type: "tool_use",
              id: tc.id,
              name: tc.name,
              input: tc.input,
            });
          }
        }
        result.push({ role: "assistant", content: blocks });
      } else if (msg.role === "tool") {
        // Anthropic tool results are user messages with tool_result content blocks
        result.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.toolCallId,
              content: msg.content,
            },
          ],
        });
      }
    }

    return result;
  }

  private convertTools(
    tools: LLMToolDefinition[]
  ): Anthropic.Tool[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));
  }

  private convertResponse(msg: Anthropic.Message): LLMResponse {
    const content: LLMResponseBlock[] = [];

    for (const block of msg.content) {
      if (block.type === "text") {
        content.push({ type: "text", text: block.text });
      } else if (block.type === "tool_use") {
        content.push({
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    const stopReason: "end_turn" | "tool_use" =
      msg.stop_reason === "tool_use" ? "tool_use" : "end_turn";

    return { content, stopReason };
  }
}
