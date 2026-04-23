// useAgent hook - manages agent communication via IPC

import { useCallback, useEffect } from "react";
import { useConversationStore } from "../stores/conversation-store";
import { usePetStore } from "../stores/pet-store";

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
        const convId = useConversationStore.getState().activeConversationId;

        if (convId) {
          // Load persisted messages FIRST, then clear streaming state
          // This prevents a visual gap where active work vanishes before final messages render
          window.catclaw.loadConversation(convId).then((messages) => {
            store.setMessages(
              messages.map((m) => ({
                ...m,
                role: m.role as "user" | "assistant",
                content: m.content as never,
              }))
            );
            // Clear streaming state AFTER messages are loaded so there's no flash
            store.clearStream();
            store.clearToolCalls();
            store.setAgentRunning(false);
          });

          // Also refresh conversation list (title may have changed)
          window.catclaw.listConversations().then((convs) => {
            store.setConversations(convs);
          });
        } else {
          store.clearStream();
          store.clearToolCalls();
          store.setAgentRunning(false);
        }

        // Refresh paw coins after conversation turn
        window.catclaw.getPetStats().then((stats) => {
          usePetStore.getState().setCoins(stats.pawCoins);
        }).catch(() => { /* ignore */ });
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
