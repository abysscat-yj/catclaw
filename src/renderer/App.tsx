// App - root component with sidebar navigation + multi-view layout

import React, { useCallback, useEffect, useState } from "react";
import {
  useConversationStore,
  type ConversationItem,
} from "./stores/conversation-store";
import { useSettingsStore, getActiveProvider } from "./stores/settings-store";
import { usePetStore } from "./stores/pet-store";
import ChatView from "./components/Chat/ChatView";
import SettingsPanel from "./components/Settings/SettingsPanel";
import SkillsPanel from "./components/Skills/SkillsPanel";
import SchedulesPanel from "./components/Schedules/SchedulesPanel";
import PetsPanel from "./components/Pets/PetsPanel";
import BuddyDisplay from "./components/Pets/BuddyDisplay";
import CatClawLogo from "./components/common/CatClawLogo";

type ActiveView = "chat" | "skills" | "schedules" | "pets";

export default function App() {
  const conversations = useConversationStore((s) => s.conversations);
  const activeId = useConversationStore((s) => s.activeConversationId);
  const setConversations = useConversationStore((s) => s.setConversations);
  const setActiveConversation = useConversationStore(
    (s) => s.setActiveConversation
  );
  const setMessages = useConversationStore((s) => s.setMessages);
  const showSettings = useSettingsStore((s) => s.showSettings);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);
  const providers = useSettingsStore((s) => s.providers);
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const loaded = useSettingsStore((s) => s.loaded);

  const activeProvider = getActiveProvider({ providers, activeProviderId });
  const hasApiKey = activeProvider?.hasApiKey ?? false;

  const [activeView, setActiveView] = useState<ActiveView>("chat");

  // Load initial data
  useEffect(() => {
    if (!window.catclaw) {
      console.error("[CatClaw] window.catclaw not available - preload script not loaded");
      return;
    }
    window.catclaw.getSettings().then((settings) => {
      useSettingsStore.getState().setSettings(settings);
    }).catch((err) => console.error("[CatClaw] getSettings error:", err));
    window.catclaw.listConversations().then((convs) => {
      setConversations(convs);
    }).catch((err) => console.error("[CatClaw] listConversations error:", err));
    // Load active buddy for sidebar display
    window.catclaw.getActiveBuddy().then((buddy) => {
      usePetStore.getState().setActiveBuddy(buddy);
    }).catch(() => { /* ignore */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show settings on first load if no API key
  useEffect(() => {
    if (loaded && !hasApiKey) {
      setShowSettings(true);
    }
  }, [loaded, hasApiKey, setShowSettings]);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setActiveView("chat");
      setActiveConversation(id);
      const messages = await window.catclaw.loadConversation(id);
      setMessages(
        messages.map((m) => ({
          ...m,
          role: m.role as "user" | "assistant",
          content: m.content as never,
        }))
      );
    },
    [setActiveConversation, setMessages]
  );

  const handleNewConversation = useCallback(async () => {
    // If the most recent conversation has no messages, reuse it instead of creating a new one
    if (conversations.length > 0) {
      const latest = conversations[0]; // conversations sorted by updatedAt desc
      const msgs = await window.catclaw.loadConversation(latest.id);
      if (msgs.length === 0) {
        setActiveConversation(latest.id);
        setMessages([]);
        setActiveView("chat");
        return;
      }
    }
    const conv = await window.catclaw.newConversation();
    const convs = await window.catclaw.listConversations();
    setConversations(convs);
    setActiveConversation(conv.id);
    setMessages([]);
    setActiveView("chat");
  }, [conversations, setConversations, setActiveConversation, setMessages]);

  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await window.catclaw.deleteConversation(id);
      const convs = await window.catclaw.listConversations();
      setConversations(convs);
      if (activeId === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    },
    [activeId, setConversations, setActiveConversation, setMessages]
  );

  const viewTitle =
    activeView === "skills"
      ? "技能"
      : activeView === "schedules"
        ? "定时任务"
        : activeView === "pets"
          ? "伙伴收藏"
          : conversations.find((c) => c.id === activeId)?.title ?? "CatClaw";

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex flex-col">
        {/* Drag region / logo */}
        <div className="drag-region h-14 flex items-center px-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="no-drag flex items-center gap-2 ml-16">
            <CatClawLogo size={24} />
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
              CatClaw
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-2 space-y-0.5">
          <NavButton
            icon="+"
            label="新任务"
            onClick={handleNewConversation}
          />
          <NavButton
            icon={"\uD83D\uDD27"}
            label="技能"
            active={activeView === "skills"}
            onClick={() => setActiveView("skills")}
          />
          <NavButton
            icon={"\u23F0"}
            label="定时任务"
            active={activeView === "schedules"}
            onClick={() => setActiveView("schedules")}
          />
          <NavButton
            icon={"\uD83D\uDC3E"}
            label="伙伴"
            active={activeView === "pets"}
            onClick={() => setActiveView("pets")}
          />
        </div>

        {/* History section */}
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            历史记录
          </span>
        </div>

        {/* Conversation list - hide empty conversations that have no messages */}
        <div className="flex-1 overflow-y-auto px-2">
          {conversations
            .filter((conv) => conv.title !== "New Chat" || conv.id === activeId)
            .map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              active={activeView === "chat" && conv.id === activeId}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
            />
          ))}
        </div>

        {/* Active buddy display */}
        <BuddyDisplay />

        {/* Settings button */}
        <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setShowSettings(true)}
            className="no-drag w-full rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 px-3 py-2 text-sm text-left transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400"
          >
            <span>&#9881;</span>
            <span>设置</span>
            {!hasApiKey && (
              <span className="ml-auto text-xs text-red-500">未配置 API Key</span>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title bar drag region */}
        <div className="drag-region h-12 flex items-center px-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          {activeView === "chat" && (
            <span className="no-drag text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
              {viewTitle}
            </span>
          )}
        </div>

        {activeView === "chat" && <ChatView />}
        {activeView === "skills" && <SkillsPanel />}
        {activeView === "schedules" && <SchedulesPanel />}
        {activeView === "pets" && <PetsPanel />}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

// --- Nav button ---

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`no-drag w-full rounded-xl px-3 py-2.5 text-sm text-left transition-all duration-150 flex items-center gap-3 ${
        active
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
      }`}
    >
      <span className={`text-base ${active ? "" : "opacity-70"}`}>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

// --- Conversation row ---

function ConversationRow({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: ConversationItem;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(conv.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`no-drag w-full rounded-xl px-3 py-2 text-sm text-left transition-all duration-150 mb-0.5 flex items-center group ${
        active
          ? "bg-gray-200/80 dark:bg-gray-700/80"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <span className="truncate flex-1">{conv.title}</span>
      {hovered && (
        <span
          onClick={(e) => onDelete(conv.id, e)}
          className="text-gray-400 hover:text-red-500 text-xs ml-1 transition-colors"
        >
          &times;
        </span>
      )}
    </button>
  );
}
