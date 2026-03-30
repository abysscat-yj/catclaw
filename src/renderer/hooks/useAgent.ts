// useAgent hook - manages agent communication via IPC

import { useCallback, useEffect } from "react";
import { useConversationStore } from "../stores/conversation-store";

export function useAgent() {
  const store = useConversationStore();

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    cleanups.push(
      window.catclaw.onStream((data) => {
        store.appendStreamText(data.text);
      })
    );

    cleanups.push(
      window.catclaw.onToolCall((data) => {
        store.addToolCall({
          id: data.id,
          name: data.name,
          input: data.input,
        });
      })
    );

    cleanups.push(
      window.catclaw.onToolResult((data) => {
        store.updateToolResult(data.id, {
          content: data.content,
          isError: data.isError,
        });
      })
    );

    cleanups.push(
      window.catclaw.onDone(() => {
        // Finalize: move streaming text to a message
        const streamText = useConversationStore.getState().streamingText;
        const toolCalls = useConversationStore.getState().activeToolCalls;
        const convId = useConversationStore.getState().activeConversationId;

        if (convId) {
          // Reload messages from store to get the persisted version
          window.catclaw.loadConversation(convId).then((messages) => {
            store.setMessages(
              messages.map((m) => ({
                ...m,
                role: m.role as "user" | "assistant",
                content: m.content as never,
              }))
            );
          });

          // Also refresh conversation list (title may have changed)
          window.catclaw.listConversations().then((convs) => {
            store.setConversations(convs);
          });
        }

        store.clearStream();
        store.clearToolCalls();
        store.setAgentRunning(false);
      })
    );

    cleanups.push(
      window.catclaw.onError((data) => {
        store.setError(data.error);
        store.setAgentRunning(false);
        store.clearStream();
        store.clearToolCalls();
      })
    );

    return () => cleanups.forEach((fn) => fn());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    async (text: string) => {
      const convId = store.activeConversationId;
      if (!convId || !text.trim()) return;

      store.setError(null);
      store.setAgentRunning(true);
      store.clearStream();
      store.clearToolCalls();

      // Add user message locally for immediate display
      store.addMessage({
        id: crypto.randomUUID(),
        conversationId: convId,
        role: "user",
        content: [{ type: "text", text: text.trim() }],
        createdAt: Date.now(),
      });

      await window.catclaw.sendMessage(convId, text.trim());
    },
    [store.activeConversationId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const cancel = useCallback(() => {
    window.catclaw.cancelAgent();
  }, []);

  return { sendMessage, cancel };
}
