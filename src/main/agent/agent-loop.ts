// Core agent loop - send message, stream response, execute tools, loop

import type { BrowserWindow } from "electron";
import { v4 as uuid } from "uuid";
import { IPC } from "../../shared/ipc-channels.js";
import type {
  ContentBlock,
  Message,
  ToolResultBlock,
} from "../../shared/message-types.js";
import type { ProviderConfig } from "../../shared/settings-types.js";
import type {
  LLMClient,
  LLMMessage,
  LLMToolDefinition,
  LLMResponse,
  LLMResponseBlock,
} from "./llm-client.js";
import { createClient } from "./client-factory.js";
import {
  loadMessages,
  saveMessage,
  updateConversationTitle,
} from "./conversation-store.js";
import { buildSystemPrompt } from "./system-prompt.js";
import { ToolExecutor } from "./tool-executor.js";
import { ToolRegistry } from "./tool-registry.js";

const MAX_TOOL_TURNS = 30;
const MAX_SUBTASK_TURNS = 10;

export class AgentLoop {
  private client: LLMClient | null = null;
  private toolRegistry = new ToolRegistry();
  private toolExecutor = new ToolExecutor(this.toolRegistry);
  private abortController: AbortController | null = null;
  private running = false;

  constructor(private window: BrowserWindow) {}

  get registry(): ToolRegistry {
    return this.toolRegistry;
  }

  setProvider(provider: ProviderConfig): void {
    this.client = createClient(provider);
  }

  cancel(): void {
    this.abortController?.abort();
  }

  get isRunning(): boolean {
    return this.running;
  }

  async sendMessage(
    conversationId: string,
    userText: string,
    settings: { model: string; maxTokens: number; customSystemPrompt?: string }
  ): Promise<void> {
    if (!this.client) {
      this.emit(IPC.AGENT_ERROR, { error: "Provider not configured" });
      return;
    }
    if (this.running) {
      this.emit(IPC.AGENT_ERROR, { error: "Agent is already running" });
      return;
    }

    this.running = true;
    this.abortController = new AbortController();

    try {
      // Save user message
      const userMessage: Message = {
        id: uuid(),
        conversationId,
        role: "user",
        content: [{ type: "text", text: userText }],
        createdAt: Date.now(),
      };
      saveMessage(userMessage);

      // Build unified messages from conversation history
      const messages = loadMessages(conversationId);
      const llmMessages = this.buildLLMMessages(messages);

      // Auto-title on first message
      if (messages.length <= 1) {
        const title =
          userText.length > 50 ? userText.slice(0, 47) + "..." : userText;
        updateConversationTitle(conversationId, title);
      }

      const systemPrompt = buildSystemPrompt(settings.customSystemPrompt);
      const tools = this.toolRegistry.getApiTools();
      const llmTools: LLMToolDefinition[] = tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.input_schema,
      }));

      await this.runAgentLoop(
        conversationId,
        llmMessages,
        systemPrompt,
        llmTools,
        settings,
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        this.emit(IPC.AGENT_ERROR, { error: "Cancelled" });
      } else {
        const message = err instanceof Error ? err.message : String(err);
        this.emit(IPC.AGENT_ERROR, { error: message });
      }
    } finally {
      this.running = false;
      this.abortController = null;
    }
  }

  private async runAgentLoop(
    conversationId: string,
    llmMessages: LLMMessage[],
    systemPrompt: string,
    tools: LLMToolDefinition[],
    settings: { model: string; maxTokens: number }
  ): Promise<void> {
    let turn = 0;

    while (turn < MAX_TOOL_TURNS) {
      turn++;
      const signal = this.abortController!.signal;

      // Accumulate streamed text
      let streamedText = "";
      const toolUses: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];

      const response: LLMResponse = await this.client!.createMessage({
        model: settings.model,
        system: systemPrompt,
        messages: llmMessages,
        tools: tools.length > 0 ? tools : undefined,
        maxTokens: settings.maxTokens,
        signal,
        callbacks: {
          onText: (text) => {
            streamedText += text;
            this.emit(IPC.AGENT_STREAM, { text });
          },
          onToolUse: (toolUse) => {
            toolUses.push(toolUse);
            this.emit(IPC.AGENT_TOOL_CALL, {
              id: toolUse.id,
              name: toolUse.name,
              input: toolUse.input,
            });
          },
          onError: (error) => {
            this.emit(IPC.AGENT_ERROR, { error });
          },
        },
      });

      // Build content blocks for storage
      const assistantContent: ContentBlock[] = [];
      for (const block of response.content) {
        if (block.type === "text") {
          assistantContent.push({ type: "text", text: block.text });
        } else if (block.type === "tool_use") {
          assistantContent.push({
            type: "tool_use",
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }

      // Save assistant message
      const assistantMessage: Message = {
        id: uuid(),
        conversationId,
        role: "assistant",
        content: assistantContent,
        createdAt: Date.now(),
      };
      saveMessage(assistantMessage);

      // If no tool use, we're done
      if (toolUses.length === 0 || response.stopReason !== "tool_use") {
        this.emit(IPC.AGENT_DONE, { messageId: assistantMessage.id });
        return;
      }

      // Execute tools and collect results
      const toolResultBlocks: ToolResultBlock[] = [];
      const toolResultMessages: LLMMessage[] = [];

      for (const toolUse of toolUses) {
        signal.throwIfAborted();

        const result = await this.toolExecutor.execute(
          toolUse.name,
          toolUse.input,
          signal
        );

        // Convert to IPC-friendly format
        const ipcContent = result.content.map((c) => {
          if (c.type === "text") return c;
          return {
            type: "image" as const,
            data: c.source.data,
            mimeType: c.source.media_type,
          };
        });

        this.emit(IPC.AGENT_TOOL_RESULT, {
          id: toolUse.id,
          content: ipcContent,
          isError: result.is_error,
        });

        toolResultBlocks.push({
          type: "tool_result",
          toolUseId: toolUse.id,
          content: ipcContent,
          isError: result.is_error,
        });

        // Build unified tool result for LLM messages
        const resultText = result.content
          .filter((c) => c.type === "text")
          .map((c) => (c as { type: "text"; text: string }).text)
          .join("\n");

        toolResultMessages.push({
          role: "tool",
          toolCallId: toolUse.id,
          content: resultText || "(no output)",
        });
      }

      // Save tool results as a user message (for persistence)
      const toolResultMessage: Message = {
        id: uuid(),
        conversationId,
        role: "user",
        content: toolResultBlocks,
        createdAt: Date.now(),
      };
      saveMessage(toolResultMessage);

      // Build assistant message for LLM context (with tool calls)
      const assistantLLM: LLMMessage = {
        role: "assistant",
        content: response.content
          .filter((b): b is { type: "text"; text: string } => b.type === "text")
          .map((b) => b.text)
          .join("") || "",
        toolCalls: toolUses.map((tu) => ({
          id: tu.id,
          name: tu.name,
          input: tu.input,
        })),
      };

      // Update LLM messages for next turn
      llmMessages.push(assistantLLM, ...toolResultMessages);
    }

    this.emit(IPC.AGENT_ERROR, {
      error: `Reached maximum tool turns (${MAX_TOOL_TURNS})`,
    });
  }

  /**
   * Run a sub-task invisibly: no persistence, no IPC events.
   * Used by custom prompt-template skills.
   */
  async runSubTask(
    prompt: string,
    settings: { model: string; maxTokens: number; customSystemPrompt?: string },
    signal?: AbortSignal
  ): Promise<string> {
    if (!this.client) throw new Error("Provider not configured");

    const systemPrompt = buildSystemPrompt(settings.customSystemPrompt);
    const tools = this.toolRegistry.getApiTools();
    const llmTools: LLMToolDefinition[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.input_schema,
    }));

    const llmMessages: LLMMessage[] = [{ role: "user", content: prompt }];
    let finalText = "";
    let turn = 0;

    while (turn < MAX_SUBTASK_TURNS) {
      turn++;
      signal?.throwIfAborted();

      const toolUses: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];
      let streamedText = "";

      const response: LLMResponse = await this.client.createMessage({
        model: settings.model,
        system: systemPrompt,
        messages: llmMessages,
        tools: llmTools.length > 0 ? llmTools : undefined,
        maxTokens: settings.maxTokens,
        signal,
        callbacks: {
          onText: (text) => {
            streamedText += text;
          },
          onToolUse: (toolUse) => {
            toolUses.push(toolUse);
          },
          onError: () => {},
        },
      });

      finalText = response.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("");

      // If no tool use, return the text
      if (toolUses.length === 0 || response.stopReason !== "tool_use") {
        return finalText || streamedText;
      }

      // Execute tools
      const toolResultMessages: LLMMessage[] = [];

      for (const toolUse of toolUses) {
        signal?.throwIfAborted();
        const result = await this.toolExecutor.execute(
          toolUse.name,
          toolUse.input,
          signal
        );
        const resultText = result.content
          .filter((c) => c.type === "text")
          .map((c) => (c as { type: "text"; text: string }).text)
          .join("\n");
        toolResultMessages.push({
          role: "tool",
          toolCallId: toolUse.id,
          content: resultText || "(no output)",
        });
      }

      // Build assistant message for context
      const assistantLLM: LLMMessage = {
        role: "assistant",
        content: finalText || "",
        toolCalls: toolUses.map((tu) => ({
          id: tu.id,
          name: tu.name,
          input: tu.input,
        })),
      };

      llmMessages.push(assistantLLM, ...toolResultMessages);
    }

    return finalText || "(sub-task reached maximum turns)";
  }

  private buildLLMMessages(messages: Message[]): LLMMessage[] {
    const result: LLMMessage[] = [];

    for (const msg of messages) {
      if (msg.role === "user") {
        // Check if it's tool results
        const hasToolResults = msg.content.some(
          (c) => c.type === "tool_result"
        );
        if (hasToolResults) {
          const toolResults = msg.content.filter(
            (c): c is ToolResultBlock => c.type === "tool_result"
          );
          for (const tr of toolResults) {
            const textContent = tr.content
              .filter((c) => c.type === "text")
              .map((c) => (c as { type: "text"; text: string }).text)
              .join("\n");
            result.push({
              role: "tool",
              toolCallId: tr.toolUseId,
              content: textContent || "(no output)",
            });
          }
        } else {
          const textContent = msg.content
            .filter((c) => c.type === "text")
            .map((c) => c.text || "")
            .join("\n");
          result.push({ role: "user", content: textContent });
        }
      } else {
        // assistant
        const textParts = msg.content
          .filter((c) => c.type === "text")
          .map((c) => c.text || "");
        const toolUseParts = msg.content
          .filter((c) => c.type === "tool_use")
          .map((c) => ({
            id: c.id!,
            name: c.name!,
            input: c.input || {},
          }));

        const assistantMsg: LLMMessage = {
          role: "assistant",
          content: textParts.join("") || "",
        };

        if (toolUseParts.length > 0) {
          (assistantMsg as { role: "assistant"; content: string; toolCalls?: typeof toolUseParts }).toolCalls = toolUseParts;
        }

        result.push(assistantMsg);
      }
    }

    return result;
  }

  private emit(channel: string, data: unknown): void {
    if (!this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }
}
