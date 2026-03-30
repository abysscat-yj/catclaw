// Settings types shared between main and renderer

export interface ProviderConfig {
  id: string;
  name: string;
  type: "anthropic" | "openai-compatible";
  baseUrl: string;
  apiKey: string; // stored encrypted in main process; masked in renderer
  models: string[];
  defaultModel: string;
  customHeaders?: Record<string, string>;
  builtin?: boolean; // true for pre-configured providers
}

export interface Settings {
  activeProviderId: string;
  providers: ProviderConfig[];
  model: string;
  maxTokens: number;
  customSystemPrompt: string;
}

export const BUILTIN_PROVIDERS: ProviderConfig[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    type: "anthropic",
    baseUrl: "https://api.anthropic.com",
    apiKey: "",
    models: [
      "claude-opus-4-20250514",
      "claude-sonnet-4-20250514",
      "claude-haiku-4-5-20251001",
    ],
    defaultModel: "claude-sonnet-4-20250514",
    builtin: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    type: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
    defaultModel: "gpt-4o",
    builtin: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    type: "openai-compatible",
    baseUrl: "https://api.deepseek.com",
    apiKey: "",
    models: ["deepseek-chat", "deepseek-reasoner"],
    defaultModel: "deepseek-chat",
    builtin: true,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  activeProviderId: "anthropic",
  providers: BUILTIN_PROVIDERS.map((p) => ({ ...p })),
  model: "claude-sonnet-4-20250514",
  maxTokens: 8192,
  customSystemPrompt: "",
};
