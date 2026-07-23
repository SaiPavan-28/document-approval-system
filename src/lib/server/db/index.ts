// ──────────────────────────────────────────────
// Drizzle SQLite Database Connection
// ──────────────────────────────────────────────
// Embedded SQLite client storing database in local `docapproval.db` file.

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'docapproval.db');

// Create SQLite database instance
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Ensure tables exist automatically on startup
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		role TEXT NOT NULL DEFAULT 'author',
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		expires_at INTEGER NOT NULL,
		created_at INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS documents (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'draft',
		version INTEGER NOT NULL DEFAULT 1,
		author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL,
		deleted_at INTEGER
	);

	CREATE TABLE IF NOT EXISTS audit_logs (
		id TEXT PRIMARY KEY,
		document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
		actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
		action TEXT NOT NULL,
		from_status TEXT,
		to_status TEXT NOT NULL,
		comment TEXT,
		changes TEXT,
		ip_address TEXT,
		user_agent TEXT,
		created_at INTEGER NOT NULL
	);
`);

export const db = drizzle(sqlite, { schema });
export type DatabaseInstance = typeof db;
// Export raw sqlite for native synchronous transactions
export { sqlite };
