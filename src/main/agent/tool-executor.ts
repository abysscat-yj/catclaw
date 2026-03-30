// Tool executor - executes tool calls with timeout and error handling

import type { Tool, ToolResult } from "./agent-types.js";
import { ToolRegistry } from "./tool-registry.js";

const DEFAULT_TIMEOUT = 60_000; // 60 seconds

export class ToolExecutor {
  constructor(private registry: ToolRegistry) {}

  async execute(
    name: string,
    input: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<ToolResult> {
    const tool = this.registry.get(name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        is_error: true,
      };
    }

    try {
      const result = await this.executeWithTimeout(tool, input, signal);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Tool execution error: ${message}` }],
        is_error: true,
      };
    }
  }

  private async executeWithTimeout(
    tool: Tool,
    input: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<ToolResult> {
    const controller = new AbortController();

    // Combine external signal with timeout
    if (signal) {
      signal.addEventListener("abort", () => controller.abort(signal.reason));
    }

    const timeout = setTimeout(() => {
      controller.abort(new Error("Tool execution timed out"));
    }, DEFAULT_TIMEOUT);

    try {
      return await tool.execute(input, controller.signal);
    } finally {
      clearTimeout(timeout);
    }
  }
}
