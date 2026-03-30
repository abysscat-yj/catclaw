// Type declarations for the catclaw preload API exposed on window

declare global {
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

  interface SkillParameter {
    name: string;
    type: "string" | "number" | "boolean";
    description: string;
    required: boolean;
  }

  interface SkillDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    builtin: boolean;
    id?: string;
    parameters?: SkillParameter[];
    promptTemplate?: string;
  }

  interface CustomSkillData {
    name: string;
    description: string;
    parameters: SkillParameter[];
    promptTemplate: string;
  }

  interface ScheduledTask {
    id: string;
    name: string;
    prompt: string;
    cron: string;
    enabled: boolean;
    lastRunAt: number | null;
    createdAt: number;
  }

  interface CatClawApi {
    // Agent
    sendMessage(conversationId: string, message: string): Promise<void>;
    cancelAgent(): Promise<void>;
    onStream(cb: (data: { text: string }) => void): () => void;
    onToolCall(
      cb: (data: { id: string; name: string; input: Record<string, unknown> }) => void
    ): () => void;
    onToolResult(
      cb: (data: { id: string; content: unknown[]; isError?: boolean }) => void
    ): () => void;
    onDone(cb: (data: { messageId: string }) => void): () => void;
    onError(cb: (data: { error: string }) => void): () => void;

    // Conversations
    listConversations(): Promise<
      Array<{ id: string; title: string; createdAt: number; updatedAt: number }>
    >;
    loadConversation(
      id: string
    ): Promise<
      Array<{
        id: string;
        conversationId: string;
        role: string;
        content: unknown[];
        createdAt: number;
      }>
    >;
    newConversation(): Promise<{
      id: string;
      title: string;
      createdAt: number;
      updatedAt: number;
    }>;
    deleteConversation(id: string): Promise<void>;

    // Settings
    getSettings(): Promise<{
      activeProviderId: string;
      providers: ProviderInfo[];
      model: string;
      maxTokens: number;
      customSystemPrompt: string;
    }>;
    setSettings(settings: Record<string, unknown>): Promise<boolean>;

    // Skills
    listSkills(): Promise<SkillDefinition[]>;
    createSkill(data: CustomSkillData): Promise<SkillDefinition>;
    updateSkill(id: string, data: Partial<CustomSkillData>): Promise<boolean>;
    deleteSkill(id: string): Promise<boolean>;

    // Scheduled Tasks
    listSchedules(): Promise<ScheduledTask[]>;
    createSchedule(data: {
      name: string;
      prompt: string;
      cron: string;
      enabled?: boolean;
    }): Promise<ScheduledTask>;
    updateSchedule(
      id: string,
      data: { name?: string; prompt?: string; cron?: string; enabled?: boolean }
    ): Promise<boolean>;
    deleteSchedule(id: string): Promise<boolean>;

    // Permissions
    checkPermissions(): Promise<{
      screenRecording: string;
      accessibility: string;
    }>;
  }

  interface Window {
    catclaw: CatClawApi;
  }
}

export {};
