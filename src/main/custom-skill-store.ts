// CustomSkillStore - SQLite CRUD for user-defined prompt-template skills

import { v4 as uuid } from "uuid";
import type Database from "better-sqlite3";

export interface SkillParameter {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

export interface CustomSkillRecord {
  id: string;
  name: string;
  description: string;
  parameters: SkillParameter[];
  promptTemplate: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateSkillInput {
  name: string;
  description: string;
  parameters: SkillParameter[];
  promptTemplate: string;
}

const BUILTIN_NAMES = new Set(["exec", "filesystem", "screenshot"]);

export class CustomSkillStore {
  constructor(private db: Database.Database) {
    this.initTable();
  }

  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS custom_skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        parameters TEXT NOT NULL,
        prompt_template TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS seeded_skills (
        name TEXT PRIMARY KEY
      );
    `);
  }

  list(): CustomSkillRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM custom_skills ORDER BY created_at ASC")
      .all() as Array<{
      id: string;
      name: string;
      description: string;
      parameters: string;
      prompt_template: string;
      created_at: number;
      updated_at: number;
    }>;
    return rows.map(this.toRecord);
  }

  get(id: string): CustomSkillRecord | undefined {
    const row = this.db
      .prepare("SELECT * FROM custom_skills WHERE id = ?")
      .get(id) as {
      id: string;
      name: string;
      description: string;
      parameters: string;
      prompt_template: string;
      created_at: number;
      updated_at: number;
    } | undefined;
    return row ? this.toRecord(row) : undefined;
  }

  create(data: CreateSkillInput): CustomSkillRecord {
    if (BUILTIN_NAMES.has(data.name)) {
      throw new Error(`Name "${data.name}" is reserved for a built-in tool`);
    }
    const id = uuid();
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO custom_skills (id, name, description, parameters, prompt_template, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.name.trim(),
        data.description.trim(),
        JSON.stringify(data.parameters),
        data.promptTemplate,
        now,
        now
      );
    return {
      id,
      name: data.name.trim(),
      description: data.description.trim(),
      parameters: data.parameters,
      promptTemplate: data.promptTemplate,
      createdAt: now,
      updatedAt: now,
    };
  }

  update(
    id: string,
    data: Partial<CreateSkillInput>
  ): void {
    const existing = this.get(id);
    if (!existing) throw new Error(`Skill not found: ${id}`);

    if (data.name && BUILTIN_NAMES.has(data.name)) {
      throw new Error(`Name "${data.name}" is reserved for a built-in tool`);
    }

    const name = data.name?.trim() ?? existing.name;
    const description = data.description?.trim() ?? existing.description;
    const parameters = data.parameters ?? existing.parameters;
    const promptTemplate = data.promptTemplate ?? existing.promptTemplate;

    this.db
      .prepare(
        `UPDATE custom_skills SET name = ?, description = ?, parameters = ?, prompt_template = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        name,
        description,
        JSON.stringify(parameters),
        promptTemplate,
        Date.now(),
        id
      );
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM custom_skills WHERE id = ?").run(id);
  }

  seedDefaults(defaults: CreateSkillInput[]): void {
    const insertSeeded = this.db.prepare(
      "INSERT OR IGNORE INTO seeded_skills (name) VALUES (?)"
    );
    const checkSeeded = this.db.prepare(
      "SELECT name FROM seeded_skills WHERE name = ?"
    );

    for (const skill of defaults) {
      const alreadySeeded = checkSeeded.get(skill.name);
      if (alreadySeeded) continue;

      try {
        this.create(skill);
      } catch {
        // Skill name may conflict with existing user skill — skip
      }
      insertSeeded.run(skill.name);
    }
  }

  private toRecord(row: {
    id: string;
    name: string;
    description: string;
    parameters: string;
    prompt_template: string;
    created_at: number;
    updated_at: number;
  }): CustomSkillRecord {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      parameters: JSON.parse(row.parameters),
      promptTemplate: row.prompt_template,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
