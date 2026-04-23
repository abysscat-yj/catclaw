// InputBar - message input with send button

import React, { useCallback, useRef, useState } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
  onCancel: () => void;
  disabled: boolean;
  isRunning: boolean;
}

export default function InputBar({
  onSend,
  onCancel,
  disabled,
  isRunning,
}: InputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      // Auto-resize
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    },
    []
  );

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-white dark:bg-gray-900 shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message CatClaw..."
          disabled={disabled && !isRunning}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:ring-indigo-400/40 dark:focus:border-indigo-500 disabled:opacity-50 placeholder:text-gray-400 transition-all"
        />
        {isRunning ? (
          <button
            onClick={onCancel}
            className="shrink-0 rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-3 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white px-4 py-3 text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:shadow-none disabled:cursor-not-allowed"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
