// System prompt builder

import { execSync } from "node:child_process";
import os from "node:os";

function getMacInfo(): string {
  try {
    const hostname = os.hostname();
    const user = os.userInfo().username;
    const homeDir = os.homedir();
    const arch = os.arch();
    const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    let macVersion = "macOS";
    try {
      macVersion = execSync("sw_vers -productVersion", { encoding: "utf-8" }).trim();
      macVersion = `macOS ${macVersion}`;
    } catch {
      // ignore
    }
    return `Host: ${hostname}, User: ${user}, Home: ${homeDir}, Arch: ${arch}, RAM: ${totalMem}GB, OS: ${macVersion}`;
  } catch {
    return `User: ${os.userInfo().username}, Home: ${os.homedir()}`;
  }
}

export function buildSystemPrompt(customPrompt?: string): string {
  const macInfo = getMacInfo();
  const date = new Date().toISOString().split("T")[0];

  const parts = [
    `You are CatClaw, a powerful AI assistant running as a native Mac desktop application. You have full control over the user's Mac computer through various tools.`,
    ``,
    `## Environment`,
    `- Date: ${date}`,
    `- ${macInfo}`,
    ``,
    `## Available Tools`,
    `You have the following tools available:`,
    `- **exec**: Execute any shell command the user could run in Terminal (ls, cat, grep, git, python, brew, osascript, open, curl, etc.)`,
    `- **filesystem**: Read, write, list, and inspect files and directories`,
    `- **screenshot**: Take a screenshot of the Mac screen`,
    ``,
    `## Tips`,
    `- Use \`exec\` with \`osascript\` to control Mac applications via AppleScript.`,
    `- Use \`exec\` with \`curl\` or \`open\` for web-related tasks.`,
    `- Use \`exec\` with \`open -a "App Name"\` to launch applications.`,
    `- For multi-step tasks, plan your approach, then execute step by step using tools.`,
    `- Always explain briefly what you're about to do before calling a tool.`,
    `- If a tool call fails, try an alternative approach.`,
    `- Be careful with destructive operations (deleting files, killing processes). Confirm with the user first.`,
  ];

  if (customPrompt) {
    parts.push("", "## User Custom Instructions", customPrompt);
  }

  return parts.join("\n");
}
