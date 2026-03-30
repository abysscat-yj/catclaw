// screenshot tool - capture the screen using macOS screencapture

import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { v4 as uuid } from "uuid";
import type { Tool, ToolResult } from "../agent/agent-types.js";
import { imageResult, errorResult } from "../agent/agent-types.js";

export const screenshotTool: Tool = {
  definition: {
    name: "screenshot",
    description:
      "Take a screenshot of the Mac screen. Returns the image. " +
      "Requires Screen Recording permission (macOS will prompt on first use).",
    inputSchema: {
      type: "object",
      properties: {
        display: {
          type: "number",
          description:
            "Display number to capture. Omit to capture the main display.",
        },
      },
    },
  },

  async execute(
    input: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<ToolResult> {
    const tmpFile = path.join(os.tmpdir(), `catclaw-screenshot-${uuid()}.png`);

    try {
      // Build screencapture args
      const args = ["-x", "-C", "-t", "png"];
      if (input.display !== undefined) {
        args.push("-D", String(input.display));
      }
      args.push(tmpFile);

      // Capture screenshot
      await execCommand("screencapture", args, signal);

      // Check if file exists and has content
      const stat = await fs.promises.stat(tmpFile);
      if (stat.size < 1024) {
        return errorResult(
          "Screenshot failed — the captured file is too small. " +
            "Please grant Screen Recording permission: " +
            "System Settings > Privacy & Security > Screen Recording, then enable this app."
        );
      }

      // Resize to max 1920px longest dimension to control base64 size
      try {
        await execCommand("sips", ["-Z", "1920", tmpFile], signal);
      } catch {
        // sips failure is non-fatal, just use original size
      }

      // Read and encode
      const data = await fs.promises.readFile(tmpFile);
      const base64 = data.toString("base64");

      return imageResult(base64, "image/png", "Screenshot captured");
    } finally {
      // Cleanup temp file
      try {
        await fs.promises.unlink(tmpFile);
      } catch {
        // ignore cleanup errors
      }
    }
  },
};

function execCommand(
  cmd: string,
  args: string[],
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { timeout: 15_000 }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });

    if (signal) {
      const onAbort = () => child.kill();
      signal.addEventListener("abort", onAbort, { once: true });
      child.on("close", () => signal.removeEventListener("abort", onAbort));
    }
  });
}
