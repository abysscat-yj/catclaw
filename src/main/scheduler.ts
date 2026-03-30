// Scheduler - manages scheduled tasks with cron-like execution

import { v4 as uuid } from "uuid";
import type Database from "better-sqlite3";

export interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  cron: string; // "M H D Mon DOW" (5-field cron)
  enabled: boolean;
  lastRunAt: number | null;
  createdAt: number;
}

export class Scheduler {
  private interval: ReturnType<typeof setInterval> | null = null;
  private onExecute: ((task: ScheduledTask) => void) | null = null;

  constructor(private db: Database.Database) {
    this.initTable();
  }

  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        prompt TEXT NOT NULL,
        cron TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        last_run_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);
  }

  /** Set the callback that runs when a scheduled task fires */
  setExecutor(fn: (task: ScheduledTask) => void): void {
    this.onExecute = fn;
  }

  /** Start the scheduler — checks every 60 seconds */
  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 60_000);
    // Also run immediately on start
    this.tick();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick(): void {
    if (!this.onExecute) return;
    const now = new Date();
    const tasks = this.list().filter((t) => t.enabled);

    for (const task of tasks) {
      if (this.cronMatches(task.cron, now)) {
        // Avoid re-running within the same minute
        if (
          task.lastRunAt &&
          now.getTime() - task.lastRunAt < 60_000
        ) {
          continue;
        }
        this.db
          .prepare("UPDATE scheduled_tasks SET last_run_at = ? WHERE id = ?")
          .run(now.getTime(), task.id);
        this.onExecute({ ...task, lastRunAt: now.getTime() });
      }
    }
  }

  list(): ScheduledTask[] {
    const rows = this.db
      .prepare(
        "SELECT id, name, prompt, cron, enabled, last_run_at as lastRunAt, created_at as createdAt FROM scheduled_tasks ORDER BY created_at DESC"
      )
      .all() as Array<{
      id: string;
      name: string;
      prompt: string;
      cron: string;
      enabled: number;
      lastRunAt: number | null;
      createdAt: number;
    }>;
    return rows.map((r) => ({ ...r, enabled: !!r.enabled }));
  }

  create(data: {
    name: string;
    prompt: string;
    cron: string;
    enabled?: boolean;
  }): ScheduledTask {
    const task: ScheduledTask = {
      id: uuid(),
      name: data.name,
      prompt: data.prompt,
      cron: data.cron,
      enabled: data.enabled ?? true,
      lastRunAt: null,
      createdAt: Date.now(),
    };
    this.db
      .prepare(
        "INSERT INTO scheduled_tasks (id, name, prompt, cron, enabled, last_run_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        task.id,
        task.name,
        task.prompt,
        task.cron,
        task.enabled ? 1 : 0,
        task.lastRunAt,
        task.createdAt
      );
    return task;
  }

  update(
    id: string,
    data: Partial<Pick<ScheduledTask, "name" | "prompt" | "cron" | "enabled">>
  ): void {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.prompt !== undefined) {
      fields.push("prompt = ?");
      values.push(data.prompt);
    }
    if (data.cron !== undefined) {
      fields.push("cron = ?");
      values.push(data.cron);
    }
    if (data.enabled !== undefined) {
      fields.push("enabled = ?");
      values.push(data.enabled ? 1 : 0);
    }

    if (fields.length === 0) return;
    values.push(id);
    this.db
      .prepare(`UPDATE scheduled_tasks SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM scheduled_tasks WHERE id = ?").run(id);
  }

  /** Simple cron matching: "M H D Mon DOW" vs current time */
  private cronMatches(cron: string, now: Date): boolean {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const checks: [string, number][] = [
      [parts[0], now.getMinutes()],
      [parts[1], now.getHours()],
      [parts[2], now.getDate()],
      [parts[3], now.getMonth() + 1],
      [parts[4], now.getDay()],
    ];

    return checks.every(([field, value]) => this.fieldMatches(field, value));
  }

  private fieldMatches(field: string, value: number): boolean {
    if (field === "*") return true;

    // Handle step: */N
    if (field.startsWith("*/")) {
      const step = parseInt(field.slice(2), 10);
      return !isNaN(step) && step > 0 && value % step === 0;
    }

    // Handle list: 1,3,5
    const parts = field.split(",");
    for (const part of parts) {
      // Handle range: 1-5
      if (part.includes("-")) {
        const [lo, hi] = part.split("-").map(Number);
        if (value >= lo && value <= hi) return true;
      } else {
        if (parseInt(part, 10) === value) return true;
      }
    }

    return false;
  }
}
