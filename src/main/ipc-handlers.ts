// IPC handlers - register all main-process IPC handlers

import { ipcMain, safeStorage, app } from "electron";
import type { BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { IPC } from "../shared/ipc-channels.js";
import type { Settings, ProviderConfig } from "../shared/settings-types.js";
import { DEFAULT_SETTINGS, BUILTIN_PROVIDERS } from "../shared/settings-types.js";
import { AgentLoop } from "./agent/agent-loop.js";
import { registerAllTools } from "./tools/index.js";
import {
  createConversation,
  deleteConversation,
  getDb,
  listConversations,
  loadMessages,
} from "./agent/conversation-store.js";
import { Scheduler } from "./scheduler.js";
import { CustomSkillStore } from "./custom-skill-store.js";
import { createCustomSkillTool, buildInputSchema } from "./tools/custom-skill-tool.js";
import { PetStore, COINS_PER_CONVERSATION } from "./pet-store.js";
import { DEFAULT_SKILLS } from "./default-skills.js";

// Extract a skill JSON object from agent text that may contain markdown, explanations, etc.
function extractSkillJson(text: string): { name: string; description: string; parameters: unknown[]; promptTemplate: string } | null {
  const candidates: string[] = [];

  // Strategy 1: code fence
  const fenceRe = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g;
  let m;
  while ((m = fenceRe.exec(text)) !== null) {
    candidates.push(m[1].trim());
  }

  // Strategy 2: find outermost { ... } with "name" and "promptTemplate" keys
  // Use a brace-counting approach to find balanced JSON objects
  const startIdx = text.indexOf("{");
  if (startIdx >= 0) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          candidates.push(text.slice(startIdx, i + 1));
          break;
        }
      }
    }
  }

  // Strategy 3: raw trimmed text
  candidates.push(text.trim());

  for (const candidate of candidates) {
    try {
      const obj = JSON.parse(candidate);
      if (obj && typeof obj === "object" && obj.name && obj.promptTemplate) {
        return {
          name: String(obj.name).trim().replace(/\s+/g, "_"),
          description: String(obj.description || "").trim(),
          parameters: Array.isArray(obj.parameters) ? obj.parameters : [
            { name: "request", type: "string", description: "What to do", required: true },
          ],
          promptTemplate: String(obj.promptTemplate),
        };
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

// Simple JSON file store
class JsonStore<T extends Record<string, unknown>> {
  private data: T;
  private filePath: string;

  constructor(name: string, defaults: T) {
    this.filePath = path.join(app.getPath("userData"), `${name}.json`);
    this.data = { ...defaults };
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.data = { ...defaults, ...JSON.parse(raw) };
      }
    } catch {
      // Use defaults on error
    }
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value;
    this.save();
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }
}

interface StoreSchema {
  [key: string]: unknown;
  settings: Omit<Settings, "providers"> & {
    providers: Array<Omit<ProviderConfig, "apiKey">>;
  };
  encryptedKeys: Record<string, string>; // providerId → encrypted API key
}

let store: JsonStore<StoreSchema> | null = null;

function getStore(): JsonStore<StoreSchema> {
  if (!store) {
    const defaultProviders = DEFAULT_SETTINGS.providers.map(
      ({ apiKey: _, ...rest }) => rest
    );
    store = new JsonStore<StoreSchema>("catclaw-settings", {
      settings: {
        activeProviderId: DEFAULT_SETTINGS.activeProviderId,
        providers: defaultProviders,
        model: DEFAULT_SETTINGS.model,
        maxTokens: DEFAULT_SETTINGS.maxTokens,
        customSystemPrompt: DEFAULT_SETTINGS.customSystemPrompt,
      },
      encryptedKeys: {},
    });
  }
  return store;
}

let agentLoop: AgentLoop | null = null;

function getApiKey(providerId: string): string {
  const keys = getStore().get("encryptedKeys");
  const encrypted = keys[providerId];
  if (!encrypted) return "";
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
    }
  } catch {
    // Fall through
  }
  return encrypted; // Fallback: stored as plain text
}

function setApiKey(providerId: string, apiKey: string): void {
  const keys = { ...getStore().get("encryptedKeys") };
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(apiKey);
    keys[providerId] = encrypted.toString("base64");
  } else {
    keys[providerId] = apiKey;
  }
  getStore().set("encryptedKeys", keys);
}

function removeApiKey(providerId: string): void {
  const keys = { ...getStore().get("encryptedKeys") };
  delete keys[providerId];
  getStore().set("encryptedKeys", keys);
}

function getFullProviders(): ProviderConfig[] {
  const stored = getStore().get("settings").providers;
  return stored.map((p) => ({
    ...p,
    apiKey: getApiKey(p.id),
  }));
}

function getActiveProvider(): ProviderConfig | null {
  const settings = getStore().get("settings");
  const providers = getFullProviders();
  return providers.find((p) => p.id === settings.activeProviderId) || null;
}

function applyProviderToAgent(): void {
  const provider = getActiveProvider();
  if (provider && provider.apiKey) {
    agentLoop!.setProvider(provider);
  }
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key ? "••••" : "";
  return "••••••••" + key.slice(-4);
}

export function registerIpcHandlers(window: BrowserWindow): AgentLoop {
  agentLoop = new AgentLoop(window);
  registerAllTools(agentLoop.registry);

  // Initialize with active provider
  applyProviderToAgent();

  // PetStore must be initialized before the agent handler to award coins
  const petStore = new PetStore(getDb());

  // --- Agent ---
  ipcMain.handle(
    IPC.AGENT_SEND_MESSAGE,
    async (_event, conversationId: string, message: string) => {
      const settings = getStore().get("settings");
      await agentLoop!.sendMessage(conversationId, message, {
        model: settings.model,
        maxTokens: settings.maxTokens,
        customSystemPrompt: settings.customSystemPrompt,
      });
      // Award paw coins on successful conversation completion
      try {
        petStore.addCoins(COINS_PER_CONVERSATION);
      } catch {
        // Ignore coin errors
      }
    }
  );

  ipcMain.handle(IPC.AGENT_CANCEL, () => {
    agentLoop!.cancel();
  });

  // --- Conversations ---
  ipcMain.handle(IPC.CONVERSATION_LIST, () => {
    return listConversations();
  });

  ipcMain.handle(IPC.CONVERSATION_LOAD, (_event, id: string) => {
    return loadMessages(id);
  });

  ipcMain.handle(IPC.CONVERSATION_NEW, () => {
    return createConversation();
  });

  ipcMain.handle(IPC.CONVERSATION_DELETE, (_event, id: string) => {
    deleteConversation(id);
  });

  // --- Settings ---
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    const settings = getStore().get("settings");
    const providers = settings.providers.map((p) => {
      const apiKey = getApiKey(p.id);
      return {
        ...p,
        apiKey: maskApiKey(apiKey),
        hasApiKey: !!apiKey,
      };
    });

    return {
      activeProviderId: settings.activeProviderId,
      providers,
      model: settings.model,
      maxTokens: settings.maxTokens,
      customSystemPrompt: settings.customSystemPrompt,
    };
  });

  ipcMain.handle(
    IPC.SETTINGS_SET,
    async (_event, updates: Record<string, unknown>) => {
      const current = getStore().get("settings");

      // Handle provider-specific API key
      if (updates.providerApiKey) {
        const { providerId, apiKey } = updates.providerApiKey as {
          providerId: string;
          apiKey: string;
        };
        if (apiKey) {
          setApiKey(providerId, apiKey);
        }
        // Re-apply if this is the active provider
        if (providerId === current.activeProviderId) {
          applyProviderToAgent();
        }
        return true;
      }

      // Handle adding a custom provider
      if (updates.addProvider) {
        const newProvider = updates.addProvider as Omit<ProviderConfig, "apiKey"> & { apiKey?: string };
        const providers = [...current.providers];
        const existingIdx = providers.findIndex((p) => p.id === newProvider.id);

        const { apiKey, ...providerWithoutKey } = newProvider;
        if (existingIdx >= 0) {
          providers[existingIdx] = providerWithoutKey;
        } else {
          providers.push(providerWithoutKey);
        }

        getStore().set("settings", { ...current, providers });

        if (apiKey) {
          setApiKey(newProvider.id, apiKey);
        }

        // Re-apply if this is the active provider (URL/headers may have changed)
        if (newProvider.id === current.activeProviderId) {
          applyProviderToAgent();
        }

        return true;
      }

      // Handle removing a custom provider
      if (updates.removeProvider) {
        const providerId = updates.removeProvider as string;
        const providers = current.providers.filter((p) => p.id !== providerId);
        removeApiKey(providerId);

        const newSettings = { ...current, providers };
        if (current.activeProviderId === providerId) {
          newSettings.activeProviderId = "anthropic";
          newSettings.model = "claude-sonnet-4-20250514";
        }

        getStore().set("settings", newSettings);
        applyProviderToAgent();
        return true;
      }

      // Handle general settings updates
      const { providerApiKey: _, addProvider: _2, removeProvider: _3, ...rest } = updates;
      const merged = { ...current, ...rest };

      // If active provider changed, update the model to the provider's default
      if (
        updates.activeProviderId &&
        updates.activeProviderId !== current.activeProviderId
      ) {
        const newProvider = merged.providers.find(
          (p: { id: string }) => p.id === updates.activeProviderId
        );
        if (newProvider && !updates.model) {
          merged.model = newProvider.defaultModel;
        }
      }

      getStore().set("settings", merged);

      // Re-apply provider if it changed
      if (updates.activeProviderId || updates.model) {
        applyProviderToAgent();
      }

      return true;
    }
  );

  // --- Permissions ---
  ipcMain.handle(IPC.PERMISSIONS_CHECK, () => {
    return {
      screenRecording: "unknown",
      accessibility: "unknown",
    };
  });

  // --- Skills ---
  const skillStore = new CustomSkillStore(getDb());
  skillStore.seedDefaults(DEFAULT_SKILLS);
  const registeredCustomSkillNames = new Set<string>();
  const BUILTIN_TOOL_NAMES = new Set(["exec", "filesystem", "screenshot"]);

  function getSettingsForSubTask() {
    const s = getStore().get("settings");
    return { model: s.model, maxTokens: s.maxTokens, customSystemPrompt: s.customSystemPrompt };
  }

  function syncCustomSkills(): void {
    const skills = skillStore.list();
    const currentNames = new Set(skills.map((s) => s.name));

    // Unregister removed custom skills
    for (const oldName of registeredCustomSkillNames) {
      if (!currentNames.has(oldName)) {
        agentLoop!.registry.unregister(oldName);
        registeredCustomSkillNames.delete(oldName);
      }
    }

    // Register/re-register all current custom skills
    for (const skill of skills) {
      agentLoop!.registry.unregister(skill.name);
      const tool = createCustomSkillTool(skill, agentLoop!, getSettingsForSubTask);
      agentLoop!.registry.register(tool);
      registeredCustomSkillNames.add(skill.name);
    }
  }

  // Load custom skills on startup
  syncCustomSkills();

  ipcMain.handle(IPC.SKILLS_LIST, () => {
    const allDefs = agentLoop!.registry.getDefinitions();
    const builtins = allDefs
      .filter((d) => BUILTIN_TOOL_NAMES.has(d.name))
      .map((d) => ({ ...d, builtin: true as const }));

    const customs = skillStore.list().map((s) => ({
      name: s.name,
      description: s.description,
      inputSchema: buildInputSchema(s.parameters),
      builtin: false as const,
      id: s.id,
      parameters: s.parameters,
      promptTemplate: s.promptTemplate,
    }));

    return [...customs, ...builtins];
  });

  ipcMain.handle(
    IPC.SKILLS_CREATE,
    (_event, data: { name: string; description: string; parameters: unknown[]; promptTemplate: string }) => {
      const record = skillStore.create(data as Parameters<typeof skillStore.create>[0]);
      syncCustomSkills();
      return {
        ...record,
        builtin: false,
        inputSchema: buildInputSchema(record.parameters),
      };
    }
  );

  ipcMain.handle(
    IPC.SKILLS_UPDATE,
    (_event, id: string, data: Record<string, unknown>) => {
      skillStore.update(id, data as Parameters<typeof skillStore.update>[1]);
      syncCustomSkills();
      return true;
    }
  );

  ipcMain.handle(IPC.SKILLS_DELETE, (_event, id: string) => {
    skillStore.delete(id);
    syncCustomSkills();
    return true;
  });

  ipcMain.handle(IPC.SKILLS_IMPORT_URL, async (_event, url: string) => {
    const prompt = `Fetch and analyze this URL to extract a skill definition: ${url}

The URL might be:
- A GitHub repo containing a SKILL.md or README describing a skill/tool
- A documentation page describing a workflow or capability
- Any page describing a reusable tool, template, or automation

Your task:
1. Use the exec tool with curl to fetch the URL content. For GitHub repos, also try fetching key files like SKILL.md, README.md, or the directory listing via the GitHub API.
2. Analyze the content to understand what the skill does, when to trigger it, and how it works.
3. Extract a complete skill definition and return it as JSON.

CRITICAL: Your final response must be ONLY the JSON below — no other text, no markdown, no explanation before or after:
{"name":"snake_case_name","description":"1-2 sentence description","parameters":[{"name":"request","type":"string","description":"What the user wants","required":true}],"promptTemplate":"Full prompt template with {{request}} placeholder. Include all best practices and instructions from the source."}`;

    const result = await agentLoop!.runSubTask(prompt, getSettingsForSubTask());

    // Try multiple strategies to extract JSON from agent response
    const parsed = extractSkillJson(result);
    if (parsed) return parsed;

    // Fallback: ask a second sub-task to extract just the JSON from the messy output
    const cleanupPrompt = `The text below is an agent response that contains a skill definition somewhere in it. Extract ONLY the JSON object with fields: name, description, parameters, promptTemplate. Return nothing but the JSON.

---
${result.slice(0, 8000)}
---`;

    const cleaned = await agentLoop!.runSubTask(cleanupPrompt, getSettingsForSubTask());
    const parsed2 = extractSkillJson(cleaned);
    if (parsed2) return parsed2;

    throw new Error("Could not extract a valid skill definition from the URL. The agent may not have been able to access the content.");
  });

  // --- Scheduled Tasks ---
  const scheduler = new Scheduler(getDb());

  scheduler.setExecutor(async (task) => {
    // Create a new conversation for the scheduled task
    const conv = createConversation(`[Scheduled] ${task.name}`);
    const settings = getStore().get("settings");
    await agentLoop!.sendMessage(conv.id, task.prompt, {
      model: settings.model,
      maxTokens: settings.maxTokens,
      customSystemPrompt: settings.customSystemPrompt,
    });
  });

  scheduler.start();

  ipcMain.handle(IPC.SCHEDULES_LIST, () => {
    return scheduler.list();
  });

  ipcMain.handle(
    IPC.SCHEDULES_CREATE,
    (_event, data: { name: string; prompt: string; cron: string; enabled?: boolean }) => {
      return scheduler.create(data);
    }
  );

  ipcMain.handle(
    IPC.SCHEDULES_UPDATE,
    (
      _event,
      id: string,
      data: { name?: string; prompt?: string; cron?: string; enabled?: boolean }
    ) => {
      scheduler.update(id, data);
      return true;
    }
  );

  ipcMain.handle(IPC.SCHEDULES_DELETE, (_event, id: string) => {
    scheduler.delete(id);
    return true;
  });

  // --- Pets ---
  // petStore already initialized above (before agent handler) to enable coin rewards

  ipcMain.handle(IPC.PETS_LIST, () => {
    return petStore.listBuddies();
  });

  ipcMain.handle(IPC.PETS_DRAW, () => {
    return petStore.drawBuddy();
  });

  ipcMain.handle(IPC.PETS_GET_STATS, () => {
    return { pawCoins: petStore.getCoins() };
  });

  ipcMain.handle(IPC.PETS_ADD_COINS, (_event, amount: number) => {
    return { pawCoins: petStore.addCoins(amount) };
  });

  ipcMain.handle(IPC.PETS_GET_ACTIVE, () => {
    return petStore.getActiveBuddy();
  });

  ipcMain.handle(IPC.PETS_SET_ACTIVE, (_event, buddyId: string | null) => {
    petStore.setActiveBuddy(buddyId);
    return true;
  });

  ipcMain.handle(IPC.PETS_GET_SPEECH, () => {
    return petStore.getRandomSpeech();
  });

  ipcMain.handle(IPC.PETS_RENAME, (_event, buddyId: string, name: string) => {
    petStore.renameBuddy(buddyId, name);
    return true;
  });

  ipcMain.handle(IPC.PETS_GET_CLICK_SPEECH, () => {
    return petStore.getClickSpeech();
  });

  return agentLoop;
}
