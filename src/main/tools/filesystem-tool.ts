// filesystem tool - read, write, list, and inspect files and directories

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Tool, ToolResult } from "../agent/agent-types.js";
import { textResult, errorResult } from "../agent/agent-types.js";

const MAX_READ = 200 * 1024; // 200KB
const MAX_ENTRIES = 500;

export const filesystemTool: Tool = {
  definition: {
    name: "filesystem",
    description:
      "Perform file system operations: read files, write files, list directory contents, or get file info.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["read", "write", "list", "info"],
          description: "The file operation to perform.",
        },
        path: {
          type: "string",
          description:
            "Absolute or relative file/directory path. Relative paths resolve from the user's home directory.",
        },
        content: {
          type: "string",
          description: "File content to write. Required when action is 'write'.",
        },
      },
      required: ["action", "path"],
    },
  },

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const action = String(input.action || "");
    const rawPath = String(input.path || "");

    if (!action || !rawPath) {
      return errorResult("action and path are required");
    }

    const resolved = rawPath.startsWith("/")
      ? rawPath
      : rawPath.startsWith("~")
        ? rawPath.replace(/^~/, os.homedir())
        : path.resolve(os.homedir(), rawPath);

    try {
      switch (action) {
        case "read":
          return await readFile(resolved);
        case "write":
          return await writeFile(resolved, input.content);
        case "list":
          return await listDirectory(resolved);
        case "info":
          return await fileInfo(resolved);
        default:
          return errorResult(
            `Unknown action: ${action}. Use read, write, list, or info.`
          );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  },
};

async function readFile(filePath: string): Promise<ToolResult> {
  const buf = await fs.promises.readFile(filePath);

  // Binary detection: check first 8KB for null bytes
  const sample = buf.subarray(0, 8192);
  if (sample.includes(0)) {
    const size = formatSize(buf.length);
    return errorResult(
      `Binary file detected (${size}). Use exec tool with 'file', 'xxd', or 'hexdump' for binary files.`
    );
  }

  let text = buf.toString("utf-8");
  if (text.length > MAX_READ) {
    const totalSize = formatSize(buf.length);
    text =
      text.slice(0, MAX_READ) +
      `\n\n[...truncated, showing first 200KB of ${totalSize} total]`;
  }

  return textResult(text);
}

async function writeFile(
  filePath: string,
  content: unknown
): Promise<ToolResult> {
  if (content === undefined || content === null) {
    return errorResult("content is required for write action");
  }

  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  const text = String(content);
  await fs.promises.writeFile(filePath, text, "utf-8");

  return textResult(`Wrote ${formatSize(Buffer.byteLength(text))} to ${filePath}`);
}

async function listDirectory(dirPath: string): Promise<ToolResult> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const items: Array<{
    name: string;
    isDir: boolean;
    size: number;
    modified: Date;
  }> = [];

  for (const entry of entries) {
    if (items.length >= MAX_ENTRIES) break;
    try {
      const fullPath = path.join(dirPath, entry.name);
      const stat = await fs.promises.stat(fullPath);
      items.push({
        name: entry.name + (entry.isDirectory() ? "/" : ""),
        isDir: entry.isDirectory(),
        size: stat.size,
        modified: stat.mtime,
      });
    } catch {
      items.push({
        name: entry.name + (entry.isDirectory() ? "/" : ""),
        isDir: entry.isDirectory(),
        size: 0,
        modified: new Date(0),
      });
    }
  }

  // Sort: directories first, then alphabetically
  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const lines = [`Directory: ${dirPath}`, ""];
  for (const item of items) {
    const type = item.isDir ? "d" : "-";
    const size = item.isDir ? "" : formatSize(item.size).padStart(8);
    const date = formatDate(item.modified);
    lines.push(`${type}  ${item.name.padEnd(40)} ${size}  ${date}`);
  }

  if (entries.length > MAX_ENTRIES) {
    lines.push(`\n... and ${entries.length - MAX_ENTRIES} more entries`);
  }

  lines.push("", `Total: ${entries.length} entries`);
  return textResult(lines.join("\n"));
}

async function fileInfo(filePath: string): Promise<ToolResult> {
  const stat = await fs.promises.stat(filePath);
  const type = stat.isDirectory()
    ? "Directory"
    : stat.isSymbolicLink()
      ? "Symlink"
      : stat.isFile()
        ? "File"
        : "Other";

  const lines = [
    `Path: ${filePath}`,
    `Type: ${type}`,
    `Size: ${formatSize(stat.size)}`,
    `Created: ${stat.birthtime.toISOString()}`,
    `Modified: ${stat.mtime.toISOString()}`,
    `Permissions: ${(stat.mode & 0o777).toString(8)}`,
  ];

  if (stat.isSymbolicLink()) {
    const target = await fs.promises.realpath(filePath);
    lines.push(`Symlink target: ${target}`);
  }

  return textResult(lines.join("\n"));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

function formatDate(d: Date): string {
  if (d.getTime() === 0) return "";
  return d.toISOString().slice(0, 16).replace("T", " ");
}
