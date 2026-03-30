// Tool registration barrel - registers all tool implementations

import type { ToolRegistry } from "../agent/tool-registry.js";
import { execTool } from "./exec-tool.js";
import { filesystemTool } from "./filesystem-tool.js";
import { screenshotTool } from "./screenshot-tool.js";

export function registerAllTools(registry: ToolRegistry): void {
  registry.register(execTool);
  registry.register(filesystemTool);
  registry.register(screenshotTool);
}
