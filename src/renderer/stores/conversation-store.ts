// Zustand store for conversation state

import { create } from "zustand";

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: ContentBlock[];
  createdAt: number;
}

export interface ContentBlock {
  type: string;
  text?: string;
  data?: string;
  mimeType?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  toolUseId?: string;
  content?: ContentBlock[];
  isError?: boolean;
}

interface ToolCallState {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: { content: unknown[]; isError?: boolean };
  status: "running" | "done" | "error";
}

interface ConversationStore {
  conversations: ConversationItem[];
  activeConversationId: string | null;
  messages: MessageItem[];
  streamingText: string;
  isAgentRunning: boolean;
  activeToolCalls: ToolCallState[];
  error: string | null;

  setConversations: (conversations: ConversationItem[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: MessageItem[]) => void;
  appendStreamText: (text: string) => void;
  clearStream: () => void;
  setAgentRunning: (running: boolean) => void;
  addToolCall: (toolCall: Omit<ToolCallState, "status">) => void;
  updateToolResult: (
    id: string,
    result: { content: unknown[]; isError?: boolean }
  ) => void;
  clearToolCalls: () => void;
  setError: (error: string | null) => void;
  addMessage: (message: MessageItem) => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  streamingText: "",
  isAgentRunning: false,
  activeToolCalls: [],
  error: null,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) =>
    set({ activeConversationId: id, messages: [], streamingText: "", error: null }),
  setMessages: (messages) => set({ messages }),
  appendStreamText: (text) =>
    set((state) => ({ streamingText: state.streamingText + text })),
  clearStream: () => set({ streamingText: "" }),
  setAgentRunning: (running) => set({ isAgentRunning: running }),
  addToolCall: (toolCall) =>
    set((state) => ({
      activeToolCalls: [
        ...state.activeToolCalls,
        { ...toolCall, status: "running" },
      ],
    })),
  updateToolResult: (id, result) =>
    set((state) => ({
      activeToolCalls: state.activeToolCalls.map((tc) =>
        tc.id === id
          ? { ...tc, result, status: result.isError ? "error" : "done" }
          : tc
      ),
    })),
  clearToolCalls: () => set({ activeToolCalls: [] }),
  setError: (error) => set({ error }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
}));
