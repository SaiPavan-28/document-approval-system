// ──────────────────────────────────────────────
// Drizzle SQLite Database Schema (Zero-Dependency Local Engine)
// ──────────────────────────────────────────────
// Serves as the database engine for local execution without requiring Docker or external PostgreSQL.

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import type { UserRole, DocumentStatus, AuditAction } from '$lib/types';

// ── Users Table ──

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	role: text('role').$type<UserRole>().notNull().default('author'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// ── Sessions Table ──

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// ── Documents Table ──

export const documents = sqliteTable(
	'documents',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		content: text('content').notNull(),
		status: text('status').$type<DocumentStatus>().notNull().default('draft'),
		version: integer('version').notNull().default(1),
		authorId: text('author_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		deletedAt: integer('deleted_at', { mode: 'timestamp' })
	},
	(table) => [
		index('idx_documents_status').on(table.status),
		index('idx_documents_author_id').on(table.authorId)
	]
);

// ── Audit Logs Table (Append-Only) ──

export const auditLogs = sqliteTable(
	'audit_logs',
	{
		id: text('id').primaryKey(),
		documentId: text('document_id')
			.notNull()
			.references(() => documents.id, { onDelete: 'restrict' }),
		actorId: text('actor_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		action: text('action').$type<AuditAction>().notNull(),
		fromStatus: text('from_status').$type<DocumentStatus>(),
		toStatus: text('to_status').$type<DocumentStatus>().notNull(),
		comment: text('comment'),
		changes: text('changes', { mode: 'json' }).$type<Record<string, { old: string; new: string }>>(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('idx_audit_logs_document_id').on(table.documentId),
		index('idx_audit_logs_actor_id').on(table.actorId)
	]
);

// ── Relations ──

export const usersRelations = relations(users, ({ many }) => ({
	documents: many(documents),
	sessions: many(sessions),
	auditLogs: many(auditLogs)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
	author: one(users, { fields: [documents.authorId], references: [users.id] }),
	auditLogs: many(auditLogs)
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	document: one(documents, { fields: [auditLogs.documentId], references: [documents.id] }),
	actor: one(users, { fields: [auditLogs.actorId], references: [users.id] })
}));
