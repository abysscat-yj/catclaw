// MessageBubble - renders a single message (user or assistant)
// Assistant messages with tool calls are displayed as ThinkingSteps

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentBlock } from "../../stores/conversation-store";
import ThinkingStep from "./ThinkingStep";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: ContentBlock[];
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  // For user messages, just show text blocks
  if (isUser) {
    const textBlocks = content.filter((c) => c.type === "text");
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-blue-500 text-white">
          {textBlocks.map((block, i) => (
            <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
              {block.text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // For assistant messages, group content into steps:
  // - Text followed by tool_use(s) = a ThinkingStep (collapsible)
  // - Trailing text with no tool_use after it = final response (not collapsible)
  const groups = useMemo(() => groupContentBlocks(content), [content]);

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] w-full">
        {groups.map((group, i) => {
          if (group.type === "thinking") {
            return (
              <ThinkingStep
                key={i}
                text={group.text}
                toolCalls={group.toolCalls}
                toolResults={group.toolResults}
              />
            );
          }
          // Final text response
          return (
            <div
              key={i}
              className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {group.text}
                </ReactMarkdown>
              </div>
              {group.images.map((img, j) => (
                <img
                  key={j}
                  src={`data:${img.mimeType || "image/png"};base64,${img.data}`}
                  alt="图片"
                  className="max-w-full rounded-lg mt-2"
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Content grouping logic ---

interface ThinkingGroup {
  type: "thinking";
  text: string;
  toolCalls: ContentBlock[];
  toolResults: ContentBlock[];
}

interface TextGroup {
  type: "text";
  text: string;
  images: ContentBlock[];
}

type ContentGroup = ThinkingGroup | TextGroup;

/**
 * Groups assistant message content blocks into displayable groups:
 * - Text + following tool_use blocks → ThinkingGroup (collapsible)
 * - Trailing text without tool_use → TextGroup (final response)
 */
function groupContentBlocks(blocks: ContentBlock[]): ContentGroup[] {
  const groups: ContentGroup[] = [];

  // Collect all tool_result blocks into a map for lookup
  const resultMap = new Map<string, ContentBlock>();
  for (const block of blocks) {
    if (block.type === "tool_result" && block.toolUseId) {
      resultMap.set(block.toolUseId, block);
    }
  }

  // Filter to display blocks (text, image, tool_use — skip tool_result)
  const displayBlocks = blocks.filter((b) => b.type !== "tool_result");

  let currentText = "";
  let currentImages: ContentBlock[] = [];
  let currentToolCalls: ContentBlock[] = [];

  function flushThinking(): void {
    if (currentText || currentToolCalls.length > 0) {
      const toolResults = currentToolCalls
        .map((tc) => (tc.id ? resultMap.get(tc.id) : undefined))
        .filter((r): r is ContentBlock => !!r);

      groups.push({
        type: "thinking",
        text: currentText,
        toolCalls: currentToolCalls,
        toolResults,
      });
      currentText = "";
      currentImages = [];
      currentToolCalls = [];
    }
  }

  for (let i = 0; i < displayBlocks.length; i++) {
    const block = displayBlocks[i];

    if (block.type === "text") {
      // If we have pending tool calls, flush them as a thinking group first
      if (currentToolCalls.length > 0) {
        flushThinking();
      }
      currentText = block.text || "";
      currentImages = [];
    } else if (block.type === "image") {
      currentImages.push(block);
    } else if (block.type === "tool_use") {
      currentToolCalls.push(block);
    }
  }

  // Flush remaining content
  if (currentToolCalls.length > 0) {
    // Text + tool calls = thinking step
    flushThinking();
  } else if (currentText) {
    // Trailing text = final response
    groups.push({
      type: "text",
      text: currentText,
      images: currentImages,
    });
  }

  // If no groups were created but there are images, create a text group
  if (groups.length === 0 && currentImages.length > 0) {
    groups.push({ type: "text", text: "", images: currentImages });
  }

  return groups;
}
