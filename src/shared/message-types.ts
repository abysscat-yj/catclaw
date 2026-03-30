// Message types shared between main and renderer

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ImageBlock {
  type: "image";
  data: string; // base64
  mimeType: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  toolUseId: string;
  content: Array<TextBlock | ImageBlock>;
  isError?: boolean;
}

export type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock;

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: ContentBlock[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// IPC event payloads
export interface StreamEvent {
  text: string;
}

export interface ToolCallEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultEvent {
  id: string;
  content: Array<TextBlock | ImageBlock>;
  isError?: boolean;
}

export interface AgentDoneEvent {
  messageId: string;
}

export interface AgentErrorEvent {
  error: string;
}
