// MessageList - scrollable list of messages with streaming support

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useConversationStore } from "../../stores/conversation-store";
import MessageBubble from "./MessageBubble";
import ToolCallCard from "./ToolCallCard";
import CatClawLogo from "../common/CatClawLogo";

const SUGGESTIONS = [
  {
    icon: "\uD83D\uDCDD",
    title: "起草邮件",
    prompt: "帮我给团队写一封关于即将到来的项目截止日期的专业邮件",
  },
  {
    icon: "\uD83D\uDD0D",
    title: "调研一个主题",
    prompt: "调研最新的 AI 趋势并总结关键发现",
  },
  {
    icon: "\uD83D\uDCBB",
    title: "写一段代码",
    prompt: "创建一个 Python 脚本，读取 CSV 文件并生成汇总报告",
  },
];

interface MessageListProps {
  onSuggestionClick?: (text: string) => void;
}

export default function MessageList({ onSuggestionClick }: MessageListProps) {
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
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <CatClawLogo size={80} animated />

        {/* Brand name */}
        <h1 className="mt-5 text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          CatClaw
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          你的 Mac AI 助手
        </p>

        {/* Suggestion Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick?.(s.prompt)}
              className="group rounded-2xl border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800 p-5 text-left
                         hover:border-indigo-300 dark:hover:border-indigo-600
                         hover:shadow-lg hover:shadow-indigo-500/10
                         transition-all duration-200"
            >
              <span className="text-2xl">{s.icon}</span>
              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {s.title}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                {s.prompt}
              </p>
              <div className="mt-3 flex justify-end">
                <span className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors text-xs">
                  &#8599;
                </span>
              </div>
            </button>
          ))}
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

        {/* Active agent work: tool calls + streaming text */}
        {isRunning && (streamingText || activeToolCalls.length > 0) && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[85%] w-full space-y-2">
              {/* Streaming text (thinking/response shown first) */}
              {streamingText && (
                <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingText}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Active tool calls (shown below streaming text) */}
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
