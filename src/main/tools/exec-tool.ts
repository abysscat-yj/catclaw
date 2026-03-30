// exec tool - execute shell commands on the user's Mac

import { spawn } from "node:child_process";
import os from "node:os";
import type { Tool, ToolResult } from "../agent/agent-types.js";
import { textResult, errorResult } from "../agent/agent-types.js";

const MAX_OUTPUT = 100 * 1024; // 100KB
const DEFAULT_TIMEOUT = 30_000; // 30 seconds
const MAX_TIMEOUT = 300_000; // 5 minutes

export const execTool: Tool = {
  definition: {
    name: "exec",
    description:
      "Execute a shell command on the user's Mac. Returns stdout, stderr, and exit code. " +
      "Use for any terminal command: ls, cat, grep, git, brew, python, osascript, open, etc.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute.",
        },
        timeout: {
          type: "number",
          description:
            "Timeout in milliseconds. Default: 30000 (30s). Max: 300000 (5min).",
        },
        cwd: {
          type: "string",
          description:
            "Working directory. Defaults to the user's home directory.",
        },
      },
      required: ["command"],
    },
  },

  async execute(
    input: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<ToolResult> {
    const command = String(input.command || "");
    if (!command.trim()) {
      return errorResult("command is required");
    }

    const timeout = Math.min(
      Math.max(Number(input.timeout) || DEFAULT_TIMEOUT, 1000),
      MAX_TIMEOUT
    );
    const cwd = String(input.cwd || os.homedir());
    const shell = process.env.SHELL || "/bin/zsh";

    return new Promise<ToolResult>((resolve) => {
      let stdout = "";
      let stderr = "";
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let killed = false;

      const child = spawn(command, [], {
        shell,
        cwd,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      // Timeout handling
      const timer = setTimeout(() => {
        killed = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
        }, 2000);
      }, timeout);

      // Abort signal handling
      const onAbort = () => {
        killed = true;
        child.kill("SIGTERM");
      };
      if (signal) {
        if (signal.aborted) {
          child.kill("SIGTERM");
          clearTimeout(timer);
          resolve(errorResult("Cancelled"));
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
      }

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdoutBytes < MAX_OUTPUT) {
          const text = chunk.toString("utf-8");
          stdout += text;
          stdoutBytes += chunk.length;
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderrBytes < MAX_OUTPUT) {
          const text = chunk.toString("utf-8");
          stderr += text;
          stderrBytes += chunk.length;
        }
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);

        if (killed && !signal?.aborted) {
          resolve(
            errorResult(
              `Command timed out after ${timeout / 1000}s.\n\n` +
                formatOutput(stdout, stderr, null)
            )
          );
          return;
        }

        if (signal?.aborted) {
          resolve(errorResult("Cancelled"));
          return;
        }

        const output = formatOutput(stdout, stderr, code);

        if (code !== 0 && code !== null) {
          resolve(errorResult(output));
        } else {
          resolve(textResult(output));
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve(errorResult(`Failed to execute command: ${err.message}`));
      });
    });
  },
};

function formatOutput(
  stdout: string,
  stderr: string,
  exitCode: number | null
): string {
  const parts: string[] = [];

  if (exitCode !== null) {
    parts.push(`Exit code: ${exitCode}`);
  }

  if (stdout.trim()) {
    const truncated = truncateOutput(stdout);
    parts.push(truncated);
  }

  if (stderr.trim()) {
    parts.push(`stderr:\n${truncateOutput(stderr)}`);
  }

  if (parts.length === 0) {
    return exitCode !== null ? `Exit code: ${exitCode}\n(no output)` : "(no output)";
  }

  return parts.join("\n\n");
}

function truncateOutput(text: string): string {
  if (text.length <= MAX_OUTPUT) return text;
  const half = MAX_OUTPUT / 2;
  return (
    text.slice(0, half) +
    "\n\n... [output truncated] ...\n\n" +
    text.slice(-half)
  );
}
