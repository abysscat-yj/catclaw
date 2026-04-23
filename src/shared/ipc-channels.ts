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
  SKILLS_IMPORT_URL: "skills:import-url",

  // Scheduled Tasks
  SCHEDULES_LIST: "schedules:list",
  SCHEDULES_CREATE: "schedules:create",
  SCHEDULES_UPDATE: "schedules:update",
  SCHEDULES_DELETE: "schedules:delete",

  // Permissions
  PERMISSIONS_CHECK: "permissions:check",

  // Pets / Buddies
  PETS_LIST: "pets:list",
  PETS_DRAW: "pets:draw",
  PETS_GET_STATS: "pets:get-stats",
  PETS_ADD_COINS: "pets:add-coins",
  PETS_GET_ACTIVE: "pets:get-active",
  PETS_SET_ACTIVE: "pets:set-active",
  PETS_GET_SPEECH: "pets:get-speech",
  PETS_RENAME: "pets:rename",
  PETS_GET_CLICK_SPEECH: "pets:get-click-speech",
} as const;
