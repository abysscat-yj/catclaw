// Agent core types

import type Anthropic from "@anthropic-ai/sdk";

export type ApiMessage = Anthropic.MessageParam;
export type ApiContentBlock = Anthropic.ContentBlockParam;
export type ApiToolDefinition = Anthropic.Tool;
export type ApiToolResultBlock = Anthropic.ToolResultBlockParam;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  >;
  is_error?: boolean;
}

export interface Tool {
  definition: ToolDefinition;
  execute(
    input: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<ToolResult>;
}

// Helper functions
export function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

export function errorResult(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], is_error: true };
}

export function imageResult(
  base64: string,
  mediaType: string,
  caption?: string
): ToolResult {
  const content: ToolResult["content"] = [];
  if (caption) content.push({ type: "text", text: caption });
  content.push({
    type: "image",
    source: { type: "base64", media_type: mediaType, data: base64 },
  });
  return { content };
}
