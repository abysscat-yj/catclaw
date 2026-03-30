// Custom skill tool factory - creates Tool objects from prompt-template skill records

import type { Tool, ToolResult } from "../agent/agent-types.js";
import { textResult, errorResult } from "../agent/agent-types.js";
import type { AgentLoop } from "../agent/agent-loop.js";
import type { CustomSkillRecord, SkillParameter } from "../custom-skill-store.js";

/**
 * Build a JSON Schema "inputSchema" from SkillParameter[].
 */
export function buildInputSchema(
  parameters: SkillParameter[]
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const p of parameters) {
    properties[p.name] = {
      type: p.type,
      description: p.description,
    };
    if (p.required) required.push(p.name);
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

/**
 * Replace {{paramName}} placeholders in a template string.
 */
function fillTemplate(
  template: string,
  input: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return input[key] !== undefined ? String(input[key]) : `{{${key}}}`;
  });
}

/**
 * Create a Tool that executes a prompt-template skill via AgentLoop.runSubTask.
 */
export function createCustomSkillTool(
  skill: CustomSkillRecord,
  agentLoop: AgentLoop,
  getSettings: () => { model: string; maxTokens: number; customSystemPrompt?: string }
): Tool {
  return {
    definition: {
      name: skill.name,
      description: skill.description,
      inputSchema: buildInputSchema(skill.parameters),
    },
    async execute(
      input: Record<string, unknown>,
      signal?: AbortSignal
    ): Promise<ToolResult> {
      const filledPrompt = fillTemplate(skill.promptTemplate, input);
      try {
        const result = await agentLoop.runSubTask(
          filledPrompt,
          getSettings(),
          signal
        );
        return textResult(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return errorResult(`Skill "${skill.name}" failed: ${msg}`);
      }
    },
  };
}
