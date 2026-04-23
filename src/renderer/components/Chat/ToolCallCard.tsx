// ToolCallCard - shows tool invocation and result inline

import React, { useState } from "react";

interface ToolCallCardProps {
  name: string;
  input: Record<string, unknown>;
  result?: { content: unknown[]; isError?: boolean };
  status: "running" | "done" | "error";
}

export default function ToolCallCard({
  name,
  input,
  result,
  status,
}: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    status === "running"
      ? "text-yellow-500"
      : status === "done"
      ? "text-green-500"
      : "text-red-500";

  // Summarize input for display
  const inputSummary = summarizeInput(name, input);

  return (
    <div className="my-2 mx-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className={`text-xs font-bold ${statusColor}`}>
          {status === "running" ? (
            <span className="inline-block animate-spin">&#9696;</span>
          ) : status === "done" ? (
            "\u2713"
          ) : (
            "\u2717"
          )}
        </span>
        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-xs">
          {name}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-xs truncate flex-1">
          {inputSummary}
        </span>
        <span className="text-gray-400 text-xs">{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 space-y-2">
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">输入</div>
            <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">
                结果 {result.isError && "（错误）"}
              </div>
              <div className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-2 overflow-x-auto">
                {renderResultContent(result.content)}
              </div>
            </div>
          )}
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
  if (name === "computer_use" && input.action) return String(input.action);
  if (name === "web_fetch" && input.url) return String(input.url);
  if (name === "web_search" && input.query) return String(input.query);

  const keys = Object.keys(input);
  if (keys.length === 0) return "";
  const first = input[keys[0]];
  const val = typeof first === "string" ? first : JSON.stringify(first);
  return val.length > 80 ? val.slice(0, 77) + "..." : val;
}

function renderResultContent(content: unknown[]): React.ReactNode {
  return content.map((item, i) => {
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.type === "text" && typeof obj.text === "string") {
        return (
          <pre
            key={i}
            className="whitespace-pre-wrap text-gray-700 dark:text-gray-300"
          >
            {obj.text.length > 2000
              ? obj.text.slice(0, 2000) + "\n... (已截断)"
              : obj.text}
          </pre>
        );
      }
      if (obj.type === "image" && typeof obj.data === "string") {
        return (
          <img
            key={i}
            src={`data:${obj.mimeType || "image/png"};base64,${obj.data}`}
            alt="工具结果"
            className="max-w-full max-h-64 rounded"
          />
        );
      }
    }
    return null;
  });
}
