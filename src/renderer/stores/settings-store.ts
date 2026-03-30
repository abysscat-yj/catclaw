// Zustand store for settings

import { create } from "zustand";

interface ProviderInfo {
  id: string;
  name: string;
  type: "anthropic" | "openai-compatible";
  baseUrl: string;
  apiKey: string; // masked
  hasApiKey: boolean;
  models: string[];
  defaultModel: string;
  customHeaders?: Record<string, string>;
  builtin?: boolean;
}

interface SettingsStore {
  activeProviderId: string;
  providers: ProviderInfo[];
  model: string;
  maxTokens: number;
  customSystemPrompt: string;
  loaded: boolean;
  showSettings: boolean;

  setSettings: (settings: {
    activeProviderId: string;
    providers: ProviderInfo[];
    model: string;
    maxTokens: number;
    customSystemPrompt: string;
  }) => void;
  setShowSettings: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  activeProviderId: "anthropic",
  providers: [],
  model: "claude-sonnet-4-20250514",
  maxTokens: 8192,
  customSystemPrompt: "",
  loaded: false,
  showSettings: false,

  setSettings: (settings) => set({ ...settings, loaded: true }),
  setShowSettings: (show) => set({ showSettings: show }),
}));

// Derived helpers
export function getActiveProvider(
  state: Pick<SettingsStore, "providers" | "activeProviderId">
): ProviderInfo | undefined {
  return state.providers.find((p) => p.id === state.activeProviderId);
}
