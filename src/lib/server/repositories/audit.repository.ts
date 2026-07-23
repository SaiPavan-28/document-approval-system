// ──────────────────────────────────────────────
// Audit Log Repository
// ──────────────────────────────────────────────
import { db } from '$lib/server/db';
import { auditLogs, users, documents } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { AuditLog, AuditLogWithActor, AuditAction, DocumentStatus } from '$lib/types';
import type { TxOrDb } from './user.repository';

export interface CreateAuditLogData {
	id: string;
	documentId: string;
	actorId: string;
	action: AuditAction;
	fromStatus: DocumentStatus | null;
	toStatus: DocumentStatus;
	comment?: string | null;
	changes?: Record<string, { old: string; new: string }> | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export class AuditRepository {
	/**
	 * Insert a new append-only audit log entry.
	 */
	static async create(data: CreateAuditLogData, client: TxOrDb = db): Promise<AuditLog> {
		const [entry] = await client
			.insert(auditLogs)
			.values({
				id: data.id,
				documentId: data.documentId,
				actorId: data.actorId,
				action: data.action,
				fromStatus: data.fromStatus,
				toStatus: data.toStatus,
				comment: data.comment ?? null,
				changes: data.changes ?? null,
				ipAddress: data.ipAddress ?? null,
				userAgent: data.userAgent ?? null
			})
			.returning();

		return entry as AuditLog;
	}

	/**
	 * Find audit log entries for a document, ordered by creation time descending, with actor details.
	 */
	static async findByDocumentId(
		documentId: string,
		options: { page?: number; pageSize?: number } = {},
		client: TxOrDb = db
	): Promise<{ items: AuditLogWithActor[]; total: number }> {
		const page = options.page ?? 1;
		const pageSize = options.pageSize ?? 50;
		const offset = (page - 1) * pageSize;

		const [countResult] = await client
			.select({ count: sql<number>`count(*)` })
			.from(auditLogs)
			.where(eq(auditLogs.documentId, documentId));

		const total = countResult?.count ?? 0;

		const items = await client
			.select({
				id: auditLogs.id,
				documentId: auditLogs.documentId,
				actorId: auditLogs.actorId,
				action: auditLogs.action,
				fromStatus: auditLogs.fromStatus,
				toStatus: auditLogs.toStatus,
				comment: auditLogs.comment,
				changes: auditLogs.changes,
				ipAddress: auditLogs.ipAddress,
				userAgent: auditLogs.userAgent,
				createdAt: auditLogs.createdAt,
				actor: {
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role
				}
			})
			.from(auditLogs)
			.innerJoin(users, eq(auditLogs.actorId, users.id))
			.where(eq(auditLogs.documentId, documentId))
			.orderBy(desc(auditLogs.createdAt))
			.limit(pageSize)
			.offset(offset);

		return { items: items as AuditLogWithActor[], total };
	}

	static createSync(data: CreateAuditLogData, client: TxOrDb = db): AuditLog {
		const [entry] = client
			.insert(auditLogs)
			.values({
				id: data.id,
				documentId: data.documentId,
				actorId: data.actorId,
				action: data.action,
				fromStatus: data.fromStatus,
				toStatus: data.toStatus,
				comment: data.comment ?? null,
				changes: data.changes ?? null,
				ipAddress: data.ipAddress ?? null,
				userAgent: data.userAgent ?? null
			})
			.returning()
			.all();

		return entry as AuditLog;
	}

	static findRecentSync(
		options: { authorId?: string; limit?: number } = {},
		client: TxOrDb = db
	): any[] {
		const limit = options.limit ?? 10;
		let query = client
			.select({
				id: auditLogs.id,
				documentId: auditLogs.documentId,
				actorId: auditLogs.actorId,
				action: auditLogs.action,
				fromStatus: auditLogs.fromStatus,
				toStatus: auditLogs.toStatus,
				comment: auditLogs.comment,
				createdAt: auditLogs.createdAt,
				document: {
					id: documents.id,
					title: documents.title,
					authorId: documents.authorId
				},
				actor: {
					id: users.id,
					name: users.name,
					role: users.role
				}
			})
			.from(auditLogs)
			.innerJoin(users, eq(auditLogs.actorId, users.id))
			.innerJoin(documents, eq(auditLogs.documentId, documents.id));

		if (options.authorId) {
			query = query.where(eq(documents.authorId, options.authorId)) as any;
		}

		return query
			.orderBy(desc(auditLogs.createdAt))
			.limit(limit)
			.all();
	}
}
