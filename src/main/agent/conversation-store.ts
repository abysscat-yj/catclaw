// Conversation store - SQLite persistence for conversations and messages

import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import { v4 as uuid } from "uuid";
import type { Conversation } from "../../shared/message-types.js";
import type { ContentBlock, Message } from "../../shared/message-types.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath("userData"), "catclaw.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Chat',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at);
  `);
}

export function listConversations(): Conversation[] {
  const rows = getDb()
    .prepare(
      "SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM conversations ORDER BY updated_at DESC"
    )
    .all() as Conversation[];
  return rows;
}

export function createConversation(title?: string): Conversation {
  const now = Date.now();
  const conv: Conversation = {
    id: uuid(),
    title: title ?? "New Chat",
    createdAt: now,
    updatedAt: now,
  };
  getDb()
    .prepare(
      "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
    .run(conv.id, conv.title, conv.createdAt, conv.updatedAt);
  return conv;
}

export function updateConversationTitle(id: string, title: string): void {
  getDb()
    .prepare("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?")
    .run(title, Date.now(), id);
}

export function deleteConversation(id: string): void {
  getDb().prepare("DELETE FROM conversations WHERE id = ?").run(id);
}

export function loadMessages(conversationId: string): Message[] {
  const rows = getDb()
    .prepare(
      "SELECT id, conversation_id as conversationId, role, content, created_at as createdAt FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    )
    .all(conversationId) as Array<{
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as "user" | "assistant",
    content: JSON.parse(row.content) as ContentBlock[],
    createdAt: row.createdAt,
  }));
}

export function saveMessage(message: Message): void {
  getDb()
    .prepare(
      "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      message.id,
      message.conversationId,
      message.role,
      JSON.stringify(message.content),
      message.createdAt
    );

  // Touch conversation updated_at
  getDb()
    .prepare("UPDATE conversations SET updated_at = ? WHERE id = ?")
    .run(message.createdAt, message.conversationId);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
