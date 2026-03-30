// MessageList - scrollable list of messages with streaming support

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useConversationStore } from "../../stores/conversation-store";
import MessageBubble from "./MessageBubble";
import ToolCallCard from "./ToolCallCard";

export default function MessageList() {
  const messages = useConversationStore((s) => s.messages);
  const streamingText = useConversationStore((s) => s.streamingText);
  const activeToolCalls = useConversationStore((s) => s.activeToolCalls);
  const isRunning = useConversationStore((s) => s.isAgentRunning);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, activeToolCalls]);

  if (messages.length === 0 && !isRunning) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">&#128049;</div>
          <p className="text-lg font-medium">CatClaw</p>
          <p className="text-sm mt-1">Your Mac AI Assistant</p>
          <p className="text-xs mt-3 text-gray-300 dark:text-gray-600">
            Send a message to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg, idx) => {
          // For assistant messages, collect tool_result blocks from the next message
          let content = msg.content;
          if (msg.role === "assistant") {
            const nextMsg = messages[idx + 1];
            if (nextMsg && nextMsg.role === "user") {
              const toolResults = nextMsg.content.filter(
                (c) => c.type === "tool_result"
              );
              if (toolResults.length > 0) {
                content = [...msg.content, ...toolResults];
              }
            }
          }
          // Skip user messages that are purely tool results (displayed inside ThinkingStep)
          if (
            msg.role === "user" &&
            msg.content.length > 0 &&
            msg.content.every((c) => c.type === "tool_result")
          ) {
            return null;
          }
          return (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={content}
            />
          );
        })}

        {/* Active agent work: streaming text + tool calls */}
        {isRunning && (streamingText || activeToolCalls.length > 0) && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[85%] w-full space-y-2">
              {/* Streaming text */}
              {streamingText && (
                <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingText}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Active tool calls */}
              {activeToolCalls.map((tc) => (
                <ToolCallCard
                  key={tc.id}
                  name={tc.name}
                  input={tc.input}
                  result={tc.result}
                  status={tc.status}
                />
              ))}
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isRunning && !streamingText && activeToolCalls.length === 0 && (
          <div className="flex justify-start mb-4">
            <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
