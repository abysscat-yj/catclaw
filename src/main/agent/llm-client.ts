// LLM Client abstraction - provider-agnostic interface for agent loop

// --- Unified content types ---

export interface LLMTextContent {
  type: "text";
  text: string;
}

export interface LLMImageContent {
  type: "image";
  data: string; // base64
  mimeType: string;
}

export interface LLMToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type LLMContentPart = LLMTextContent | LLMImageContent | LLMToolUseContent;

export interface LLMToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// --- Unified message types ---

export interface LLMUserMessage {
  role: "user";
  content: string | LLMContentPart[];
}

export interface LLMAssistantMessage {
  role: "assistant";
  content: string | LLMContentPart[];
  toolCalls?: LLMToolCall[];
}

export interface LLMToolResultMessage {
  role: "tool";
  toolCallId: string;
  content: string;
}

export type LLMMessage = LLMUserMessage | LLMAssistantMessage | LLMToolResultMessage;

// --- Tool definition (provider-agnostic) ---

export interface LLMToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// --- Response ---

export interface LLMResponseContent {
  type: "text";
  text: string;
}

export interface LLMResponseToolUse {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type LLMResponseBlock = LLMResponseContent | LLMResponseToolUse;

export interface LLMResponse {
  content: LLMResponseBlock[];
  stopReason: "end_turn" | "tool_use";
}

// --- Streaming callbacks ---

export interface StreamCallbacks {
  onText: (text: string) => void;
  onToolUse: (toolUse: LLMToolCall) => void;
  onError: (error: string) => void;
}

// --- Client interface ---

export interface CreateMessageParams {
  model: string;
  system: string;
  messages: LLMMessage[];
  tools?: LLMToolDefinition[];
  maxTokens: number;
  callbacks: StreamCallbacks;
  signal?: AbortSignal;
}

export interface LLMClient {
  createMessage(params: CreateMessageParams): Promise<LLMResponse>;
  validateKey(): Promise<boolean>;
}
