// IPC Channel constants shared between main and renderer

export const IPC = {
  // Agent
  AGENT_SEND_MESSAGE: "agent:send-message",
  AGENT_CANCEL: "agent:cancel",
  AGENT_STREAM: "agent:stream",
  AGENT_TOOL_CALL: "agent:tool-call",
  AGENT_TOOL_RESULT: "agent:tool-result",
  AGENT_DONE: "agent:done",
  AGENT_ERROR: "agent:error",

  // Conversations
  CONVERSATION_LIST: "conversation:list",
  CONVERSATION_LOAD: "conversation:load",
  CONVERSATION_NEW: "conversation:new",
  CONVERSATION_DELETE: "conversation:delete",

  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",

  // Skills
  SKILLS_LIST: "skills:list",
  SKILLS_CREATE: "skills:create",
  SKILLS_UPDATE: "skills:update",
  SKILLS_DELETE: "skills:delete",

  // Scheduled Tasks
  SCHEDULES_LIST: "schedules:list",
  SCHEDULES_CREATE: "schedules:create",
  SCHEDULES_UPDATE: "schedules:update",
  SCHEDULES_DELETE: "schedules:delete",

  // Permissions
  PERMISSIONS_CHECK: "permissions:check",
} as const;
