// Preload script - expose IPC bridge to renderer via contextBridge

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { IPC } from "../shared/ipc-channels.js";

type Cleanup = () => void;

contextBridge.exposeInMainWorld("catclaw", {
  // Agent
  sendMessage: (conversationId: string, message: string): Promise<void> =>
    ipcRenderer.invoke(IPC.AGENT_SEND_MESSAGE, conversationId, message),

  cancelAgent: (): Promise<void> => ipcRenderer.invoke(IPC.AGENT_CANCEL),

  onStream: (cb: (data: { text: string }) => void): Cleanup => {
    const handler = (_event: IpcRendererEvent, data: { text: string }) => cb(data);
    ipcRenderer.on(IPC.AGENT_STREAM, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_STREAM, handler);
  },

  onToolCall: (
    cb: (data: { id: string; name: string; input: Record<string, unknown> }) => void
  ): Cleanup => {
    const handler = (_event: IpcRendererEvent, data: { id: string; name: string; input: Record<string, unknown> }) => cb(data);
    ipcRenderer.on(IPC.AGENT_TOOL_CALL, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_TOOL_CALL, handler);
  },

  onToolResult: (
    cb: (data: { id: string; content: unknown[]; isError?: boolean }) => void
  ): Cleanup => {
    const handler = (_event: IpcRendererEvent, data: { id: string; content: unknown[]; isError?: boolean }) => cb(data);
    ipcRenderer.on(IPC.AGENT_TOOL_RESULT, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_TOOL_RESULT, handler);
  },

  onDone: (cb: (data: { messageId: string }) => void): Cleanup => {
    const handler = (_event: IpcRendererEvent, data: { messageId: string }) => cb(data);
    ipcRenderer.on(IPC.AGENT_DONE, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_DONE, handler);
  },

  onError: (cb: (data: { error: string }) => void): Cleanup => {
    const handler = (_event: IpcRendererEvent, data: { error: string }) => cb(data);
    ipcRenderer.on(IPC.AGENT_ERROR, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_ERROR, handler);
  },

  // Conversations
  listConversations: () => ipcRenderer.invoke(IPC.CONVERSATION_LIST),
  loadConversation: (id: string) => ipcRenderer.invoke(IPC.CONVERSATION_LOAD, id),
  newConversation: () => ipcRenderer.invoke(IPC.CONVERSATION_NEW),
  deleteConversation: (id: string) =>
    ipcRenderer.invoke(IPC.CONVERSATION_DELETE, id),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, settings),

  // Skills
  listSkills: () => ipcRenderer.invoke(IPC.SKILLS_LIST),
  createSkill: (data: { name: string; description: string; parameters: unknown[]; promptTemplate: string }) =>
    ipcRenderer.invoke(IPC.SKILLS_CREATE, data),
  updateSkill: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SKILLS_UPDATE, id, data),
  deleteSkill: (id: string) =>
    ipcRenderer.invoke(IPC.SKILLS_DELETE, id),
  importSkillFromUrl: (url: string) =>
    ipcRenderer.invoke(IPC.SKILLS_IMPORT_URL, url),

  // Scheduled Tasks
  listSchedules: () => ipcRenderer.invoke(IPC.SCHEDULES_LIST),
  createSchedule: (data: { name: string; prompt: string; cron: string; enabled?: boolean }) =>
    ipcRenderer.invoke(IPC.SCHEDULES_CREATE, data),
  updateSchedule: (id: string, data: { name?: string; prompt?: string; cron?: string; enabled?: boolean }) =>
    ipcRenderer.invoke(IPC.SCHEDULES_UPDATE, id, data),
  deleteSchedule: (id: string) =>
    ipcRenderer.invoke(IPC.SCHEDULES_DELETE, id),

  // Permissions
  checkPermissions: () => ipcRenderer.invoke(IPC.PERMISSIONS_CHECK),

  // Pets / Buddies
  listBuddies: () => ipcRenderer.invoke(IPC.PETS_LIST),
  drawBuddy: () => ipcRenderer.invoke(IPC.PETS_DRAW),
  getPetStats: () => ipcRenderer.invoke(IPC.PETS_GET_STATS),
  addPetCoins: (amount: number) => ipcRenderer.invoke(IPC.PETS_ADD_COINS, amount),
  getActiveBuddy: () => ipcRenderer.invoke(IPC.PETS_GET_ACTIVE),
  setActiveBuddy: (buddyId: string | null) => ipcRenderer.invoke(IPC.PETS_SET_ACTIVE, buddyId),
  getRandomSpeech: () => ipcRenderer.invoke(IPC.PETS_GET_SPEECH),
  renameBuddy: (buddyId: string, name: string) => ipcRenderer.invoke(IPC.PETS_RENAME, buddyId, name),
  getClickSpeech: () => ipcRenderer.invoke(IPC.PETS_GET_CLICK_SPEECH),
});
