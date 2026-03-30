// ThinkingStep - collapsible intermediate step (text + tool calls)
// Used to display agent's reasoning and tool invocations inline in the conversation

import React, { useState } from "react";
import type { ContentBlock } from "../../stores/conversation-store";

interface ThinkingStepProps {
  /** The "thinking" text before the tool calls */
  text: string;
  /** Tool use blocks that follow this thinking text */
  toolCalls: ContentBlock[];
  /** Matching tool result blocks */
  toolResults: ContentBlock[];
}

export default function ThinkingStep({
  text,
  toolCalls,
  toolResults,
}: ThinkingStepProps) {
  const [expanded, setExpanded] = useState(false);

  // Build a summary line
  const truncated =
    text.length > 80 ? text.slice(0, 77).trimEnd() + "..." : text;
  const toolSummary = toolCalls
    .map((tc) => tc.name || "tool")
    .join(", ");

  return (
    <div className="my-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 overflow-hidden text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
      >
        <span className="text-gray-500 dark:text-gray-400 flex-1 truncate">
          {truncated}
        </span>
        {toolCalls.length > 0 && (
          <span className="text-xs text-blue-500 dark:text-blue-400 font-mono shrink-0">
            {toolSummary}
          </span>
        )}
        <span className="text-gray-400 text-xs shrink-0">
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3">
          {/* Full thinking text */}
          <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
            {text}
          </p>

          {/* Tool calls with results */}
          {toolCalls.map((tc, i) => {
            const result = toolResults.find(
              (tr) => tr.toolUseId === tc.id
            );
            return (
              <InlineToolCall
                key={tc.id || i}
                name={tc.name || "unknown"}
                input={tc.input || {}}
                result={result}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function InlineToolCall({
  name,
  input,
  result,
}: {
  name: string;
  input: Record<string, unknown>;
  result?: ContentBlock;
}) {
  const [showDetail, setShowDetail] = useState(false);

  const summary = summarizeInput(name, input);
  const hasError = result?.isError;
  const resultTexts = (result?.content as ContentBlock[] | undefined)
    ?.filter((c) => c.type === "text")
    ?.map((c) => c.text || "")
    ?.join("\n") || "";

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className={`text-xs font-bold ${hasError ? "text-red-500" : result ? "text-green-500" : "text-yellow-500"}`}>
          {!result ? (
            <span className="inline-block animate-spin">{"\u25D2"}</span>
          ) : hasError ? (
            "\u2717"
          ) : (
            "\u2713"
          )}
        </span>
        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-xs">
          {name}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-xs truncate flex-1">
          {summary}
        </span>
      </button>

      {showDetail && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 space-y-1.5">
          <pre className="text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(input, null, 2)}
          </pre>
          {resultTexts && (
            <pre className="text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
              {resultTexts.length > 2000
                ? resultTexts.slice(0, 2000) + "\n... (truncated)"
                : resultTexts}
            </pre>
          )}
          {/* Render images from results */}
          {(result?.content as ContentBlock[] | undefined)
            ?.filter((c) => c.type === "image")
            ?.map((c, idx) => (
              <img
                key={idx}
                src={`data:${c.mimeType || "image/png"};base64,${c.data}`}
                alt="Tool result"
                className="max-w-full max-h-48 rounded"
              />
            ))}
        </div>
      )}
    </div>
  );
}

function summarizeInput(
  name: string,
  input: Record<string, unknown>
): string {
  if (name === "exec" && input.command) return String(input.command);
  if (name === "filesystem" && input.action && input.path)
    return `${input.action}: ${input.path}`;
  if (name === "screenshot") return "capture screen";
  if (name === "web_fetch" && input.url) return String(input.url);
  if (name === "web_search" && input.query) return String(input.query);

  const keys = Object.keys(input);
  if (keys.length === 0) return "";
  const first = input[keys[0]];
  const val = typeof first === "string" ? first : JSON.stringify(first);
  return val.length > 60 ? val.slice(0, 57) + "..." : val;
}
