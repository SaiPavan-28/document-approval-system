// ──────────────────────────────────────────────
// Document Repository
// ──────────────────────────────────────────────
import { db } from '$lib/server/db';
import { documents, users } from '$lib/server/db/schema';
import { eq, and, isNull, like, or, sql, asc, desc, inArray } from 'drizzle-orm';
import type { Document, DocumentWithAuthor, DocumentStatus } from '$lib/types';
import type { TxOrDb } from './user.repository';

export interface DocumentFilterOptions {
	status?: DocumentStatus;
	statuses?: DocumentStatus[];
	search?: string;
	authorId?: string;
	includeDeleted?: boolean;
	sortBy?: 'createdAt' | 'updatedAt' | 'title';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

export class DocumentRepository {
	/**
	 * Find document by ID with author details joined.
	 */
	static async findById(id: string, client: TxOrDb = db): Promise<DocumentWithAuthor | null> {
		const rows = await client
			.select({
				id: documents.id,
				title: documents.title,
				content: documents.content,
				status: documents.status,
				version: documents.version,
				authorId: documents.authorId,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
				deletedAt: documents.deletedAt,
				author: {
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role
				}
			})
			.from(documents)
			.innerJoin(users, eq(documents.authorId, users.id))
			.where(eq(documents.id, id))
			.limit(1);

		return rows[0] ?? null;
	}

	/**
	 * Find document by ID (raw, no joins).
	 */
	static async findRawById(id: string, client: TxOrDb = db): Promise<Document | null> {
		const [doc] = await client
			.select()
			.from(documents)
			.where(eq(documents.id, id))
			.limit(1);

		return doc ?? null;
	}

	/**
	 * Find multiple documents with filtering, pagination, and sorting.
	 */
	static async findMany(
		options: DocumentFilterOptions = {},
		client: TxOrDb = db
	): Promise<{ items: DocumentWithAuthor[]; total: number }> {
		const page = options.page ?? 1;
		const pageSize = options.pageSize ?? 20;
		const offset = (page - 1) * pageSize;

		const conditions = [];

		if (!options.includeDeleted) {
			conditions.push(isNull(documents.deletedAt));
		}

		if (options.status) {
			conditions.push(eq(documents.status, options.status));
		} else if (options.statuses && options.statuses.length > 0) {
			conditions.push(inArray(documents.status, options.statuses));
		}

		if (options.authorId) {
			conditions.push(eq(documents.authorId, options.authorId));
		}

		if (options.search && options.search.trim().length > 0) {
			const term = `%${options.search.trim()}%`;
			conditions.push(or(like(documents.title, term), like(documents.content, term)));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Count total records
		const [countResult] = await client
			.select({ count: sql<number>`count(*)` })
			.from(documents)
			.where(whereClause);

		const total = countResult?.count ?? 0;

		// Choose sorting column
		const sortColumn =
			options.sortBy === 'title'
				? documents.title
				: options.sortBy === 'createdAt'
					? documents.createdAt
					: documents.updatedAt;

		const order = options.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

		const items = await client
			.select({
				id: documents.id,
				title: documents.title,
				content: documents.content,
				status: documents.status,
				version: documents.version,
				authorId: documents.authorId,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
				deletedAt: documents.deletedAt,
				author: {
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role
				}
			})
			.from(documents)
			.innerJoin(users, eq(documents.authorId, users.id))
			.where(whereClause)
			.orderBy(order)
			.limit(pageSize)
			.offset(offset);

		return { items, total };
	}

	/**
	 * Create a new document record.
	 */
	static async create(
		data: {
			id: string;
			title: string;
			content: string;
			status?: DocumentStatus;
			version?: number;
			authorId: string;
		},
		client: TxOrDb = db
	): Promise<Document> {
		const [doc] = await client
			.insert(documents)
			.values({
				id: data.id,
				title: data.title,
				content: data.content,
				status: data.status ?? 'draft',
				version: data.version ?? 1,
				authorId: data.authorId
			})
			.returning();

		return doc;
	}

	/**
	 * Update document title and content with Optimistic Concurrency Control (OCC).
	 * Fails if current version != expectedVersion.
	 */
	static async updateContent(
		id: string,
		expectedVersion: number,
		data: { title: string; content: string },
		client: TxOrDb = db
	): Promise<Document | null> {
		const [updated] = await client
			.update(documents)
			.set({
				title: data.title,
				content: data.content,
				version: sql`${documents.version} + 1`,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(documents.id, id),
					eq(documents.version, expectedVersion),
					isNull(documents.deletedAt)
				)
			)
			.returning();

		return updated ?? null;
	}

	/**
	 * Update document status with Optimistic Concurrency Control (OCC).
	 * Fails if current version != expectedVersion.
	 */
	static async updateStatus(
		id: string,
		expectedVersion: number,
		toStatus: DocumentStatus,
		client: TxOrDb = db
	): Promise<Document | null> {
		const setValues: Record<string, any> = {
			status: toStatus,
			version: sql`${documents.version} + 1`,
			updatedAt: new Date()
		};

		if (toStatus === 'archived') {
			setValues.deletedAt = new Date();
		}

		const [updated] = await client
			.update(documents)
			.set(setValues)
			.where(and(eq(documents.id, id), eq(documents.version, expectedVersion)))
			.returning();

		return updated ?? null;
	}

	static findByIdSync(id: string, client: TxOrDb = db): DocumentWithAuthor | null {
		const rows = client
			.select({
				id: documents.id,
				title: documents.title,
				content: documents.content,
				status: documents.status,
				version: documents.version,
				authorId: documents.authorId,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
				deletedAt: documents.deletedAt,
				author: {
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role
				}
			})
			.from(documents)
			.innerJoin(users, eq(documents.authorId, users.id))
			.where(eq(documents.id, id))
			.limit(1)
			.all();

		return rows[0] ?? null;
	}

	static findRawByIdSync(id: string, client: TxOrDb = db): Document | null {
		const [doc] = client
			.select()
			.from(documents)
			.where(eq(documents.id, id))
			.limit(1)
			.all();

		return doc ?? null;
	}

	static createSync(
		data: {
			id: string;
			title: string;
			content: string;
			status?: DocumentStatus;
			version?: number;
			authorId: string;
		},
		client: TxOrDb = db
	): Document {
		const [doc] = client
			.insert(documents)
			.values({
				id: data.id,
				title: data.title,
				content: data.content,
				status: data.status ?? 'draft',
				version: data.version ?? 1,
				authorId: data.authorId
			})
			.returning()
			.all();

		return doc;
	}

	static updateContentSync(
		id: string,
		expectedVersion: number,
		data: { title: string; content: string },
		client: TxOrDb = db
	): Document | null {
		const [updated] = client
			.update(documents)
			.set({
				title: data.title,
				content: data.content,
				version: sql`${documents.version} + 1`,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(documents.id, id),
					eq(documents.version, expectedVersion),
					isNull(documents.deletedAt)
				)
			)
			.returning()
			.all();

		return updated ?? null;
	}

	static updateStatusSync(
		id: string,
		expectedVersion: number,
		toStatus: DocumentStatus,
		client: TxOrDb = db
	): Document | null {
		const setValues: Record<string, any> = {
			status: toStatus,
			version: sql`${documents.version} + 1`,
			updatedAt: new Date()
		};

		if (toStatus === 'archived') {
			setValues.deletedAt = new Date();
		}

		const [updated] = client
			.update(documents)
			.set(setValues)
			.where(and(eq(documents.id, id), eq(documents.version, expectedVersion)))
			.returning()
			.all();

		return updated ?? null;
	}
}
