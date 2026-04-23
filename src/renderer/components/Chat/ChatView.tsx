// ChatView - main chat interface combining message list and input

import React, { useCallback } from "react";
import { useConversationStore } from "../../stores/conversation-store";
import { useSettingsStore, getActiveProvider } from "../../stores/settings-store";
import { useAgent } from "../../hooks/useAgent";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatView() {
  const { sendMessage, cancel } = useAgent();
  const activeId = useConversationStore((s) => s.activeConversationId);
  const isRunning = useConversationStore((s) => s.isAgentRunning);
  const error = useConversationStore((s) => s.error);
  const providers = useSettingsStore((s) => s.providers);
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeProvider = getActiveProvider({ providers, activeProviderId });
  const hasApiKey = activeProvider?.hasApiKey ?? false;

  // Wraps sendMessage to auto-create a conversation if none is selected
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      let convId = activeId;
      if (!convId) {
        const conv = await window.catclaw.newConversation();
        const convs = await window.catclaw.listConversations();
        useConversationStore.getState().setConversations(convs);
        useConversationStore.getState().setActiveConversation(conv.id);
        useConversationStore.getState().setMessages([]);
        convId = conv.id;

        // Manually send since the hook's sendMessage reads activeConversationId from store
        // which may not have propagated yet
        const store = useConversationStore.getState();
        store.setError(null);
        store.setAgentRunning(true);
        store.clearStream();
        store.clearToolCalls();
        store.addMessage({
          id: crypto.randomUUID(),
          conversationId: convId,
          role: "user",
          content: [{ type: "text", text: text.trim() }],
          createdAt: Date.now(),
        });
        await window.catclaw.sendMessage(convId, text.trim());
        return;
      }

      sendMessage(text);
    },
    [activeId, sendMessage]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <MessageList onSuggestionClick={handleSend} />

      <InputBar
        onSend={handleSend}
        onCancel={cancel}
        disabled={!hasApiKey}
        isRunning={isRunning}
      />
    </div>
  );
}
