// ──────────────────────────────────────────────
// Document Service
// ──────────────────────────────────────────────
// Implements core business logic, RBAC checks, Optimistic Concurrency Control (OCC),
// state machine validations, and transactional state mutations + audit logging.
// Uses native better-sqlite3 sqlite.transaction() for true synchronous transactions.

import { nanoid } from 'nanoid';
import { db, sqlite } from '$lib/server/db';
import { documents, users, auditLogs } from '$lib/server/db/schema';
import { DocumentRepository, type DocumentFilterOptions } from '$lib/server/repositories/document.repository';
import { AuditRepository } from '$lib/server/repositories/audit.repository';
import { validateTransition, isEditableStatus, findTransitionRule } from '$lib/state-machine/transitions';
import {
	NotFoundError,
	ForbiddenError,
	ConflictError,
	ValidationError,
	InvalidTransitionError
} from '$lib/server/errors';
import type { User, DocumentWithAuthor, DocumentStatus, PaginatedResponse } from '$lib/types';
import type {
	CreateDocumentInput,
	UpdateDocumentInput,
	TransitionInput,
	RejectInput,
	DocumentListQuery
} from '$lib/schemas/document.schema';

export class DocumentService {
	/**
	 * List documents with RBAC visibility rules applied.
	 * - Viewers: can ONLY see published documents.
	 * - Authors: can see all own documents + all published documents.
	 * - Reviewers & Admins: can see all active documents.
	 */
	static async listDocuments(
		actor: User,
		query: DocumentListQuery
	): Promise<PaginatedResponse<DocumentWithAuthor>> {
		const filterOptions: DocumentFilterOptions = {
			search: query.search,
			sortBy: query.sortBy,
			sortOrder: query.sortOrder,
			page: query.page,
			pageSize: query.pageSize
		};

		if (actor.role === 'viewer') {
			filterOptions.status = 'published';
		} else if (actor.role === 'author') {
			if (query.status) {
				if (query.status === 'published') {
					filterOptions.status = 'published';
				} else {
					filterOptions.status = query.status;
					filterOptions.authorId = actor.id;
				}
			} else {
				return await this.listAuthorDocuments(actor, query);
			}
		} else {
			// Reviewers and Admins
			if (query.status) {
				filterOptions.status = query.status;
			}
			if (actor.role === 'admin') {
				filterOptions.includeDeleted = true;
			}
		}

		const { items, total } = await DocumentRepository.findMany(filterOptions);

		return {
			items,
			total,
			page: query.page,
			pageSize: query.pageSize
		};
	}

	/**
	 * Helper for author role document listing: own docs OR published docs.
	 */
	private static async listAuthorDocuments(
		actor: User,
		query: DocumentListQuery
	): Promise<PaginatedResponse<DocumentWithAuthor>> {
		const { items: ownItems } = await DocumentRepository.findMany({
			authorId: actor.id,
			search: query.search,
			page: 1,
			pageSize: 1000
		});

		const { items: publishedItems } = await DocumentRepository.findMany({
			status: 'published',
			search: query.search,
			page: 1,
			pageSize: 1000
		});

		// Deduplicate by ID
		const map = new Map<string, DocumentWithAuthor>();
		for (const doc of ownItems) {
			map.set(doc.id, doc);
		}
		for (const doc of publishedItems) {
			map.set(doc.id, doc);
		}

		let allItems = Array.from(map.values());

		// Sort
		allItems.sort((a, b) => {
			const field = query.sortBy;
			const valA = a[field];
			const valB = b[field];
			if (valA < valB) return query.sortOrder === 'asc' ? -1 : 1;
			if (valA > valB) return query.sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		const total = allItems.length;
		const start = (query.page - 1) * query.pageSize;
		const paginatedItems = allItems.slice(start, start + query.pageSize);

		return {
			items: paginatedItems,
			total,
			page: query.page,
			pageSize: query.pageSize
		};
	}

	/**
	 * Create a new document in 'draft' state and record an audit log.
	 * Uses native sqlite.transaction() for true synchronous execution.
	 */
	static async createDocument(
		actor: User,
		input: CreateDocumentInput
	): Promise<DocumentWithAuthor> {
		if (actor.role === 'viewer') {
			throw new ForbiddenError('Viewers are not permitted to create documents.');
		}

		const docId = nanoid();
		const now = Date.now();

		const runTransaction = sqlite.transaction(() => {
			// Insert document
			sqlite.prepare(`
				INSERT INTO documents (id, title, content, status, version, author_id, created_at, updated_at)
				VALUES (?, ?, ?, 'draft', 1, ?, ?, ?)
			`).run(docId, input.title, input.content, actor.id, now, now);

			// Insert audit log
			sqlite.prepare(`
				INSERT INTO audit_logs (id, document_id, actor_id, action, from_status, to_status, comment, created_at)
				VALUES (?, ?, ?, 'DOCUMENT_CREATED', NULL, 'draft', NULL, ?)
			`).run(nanoid(), docId, actor.id, now);
		});

		runTransaction();

		// Fetch the created document with author join
		const doc = await DocumentRepository.findById(docId);
		if (!doc) {
			throw new NotFoundError('Failed to create document.');
		}
		return doc;
	}

	/**
	 * Retrieve document details by ID with RBAC read access check.
	 */
	static async getDocumentById(actor: User, id: string): Promise<DocumentWithAuthor> {
		const doc = await DocumentRepository.findById(id);

		if (!doc) {
			throw new NotFoundError(`Document with ID "${id}" was not found.`);
		}

		// RBAC Read Permissions
		if (actor.role === 'viewer') {
			if (doc.status !== 'published' || doc.deletedAt !== null) {
				throw new ForbiddenError('Viewers can only access published documents.');
			}
		} else if (actor.role === 'author') {
			if (doc.status !== 'published' && doc.authorId !== actor.id) {
				throw new ForbiddenError('You do not have permission to view this document.');
			}
		}

		return doc;
	}

	/**
	 * Update document title and content with Optimistic Concurrency Control (OCC).
	 * Enforces editability rules (only 'draft' or 'rejected' states, owner or admin).
	 * Uses native sqlite.transaction() for true synchronous execution.
	 */
	static async updateDocument(
		actor: User,
		id: string,
		input: UpdateDocumentInput
	): Promise<DocumentWithAuthor> {
		const doc = await DocumentRepository.findById(id);

		if (!doc) {
			throw new NotFoundError(`Document with ID "${id}" was not found.`);
		}

		// Editability rule: draft or rejected state only
		if (!isEditableStatus(doc.status)) {
			throw new ForbiddenError(
				`Document cannot be edited in its current status ("${doc.status}"). Only draft or rejected documents can be updated.`
			);
		}

		// Ownership check: must be document author or admin
		if (actor.role !== 'admin' && doc.authorId !== actor.id) {
			throw new ForbiddenError('Only the document author can edit this document.');
		}

		const now = Date.now();
		let conflictVersion: number | null = null;

		const runTransaction = sqlite.transaction(() => {
			// Update with OCC version check
			const result = sqlite.prepare(`
				UPDATE documents
				SET title = ?, content = ?, version = version + 1, updated_at = ?
				WHERE id = ? AND version = ? AND deleted_at IS NULL
			`).run(input.title, input.content, now, id, input.expectedVersion);

			if (result.changes === 0) {
				// OCC conflict: fetch current version
				const current = sqlite.prepare(`SELECT version FROM documents WHERE id = ?`).get(id) as { version: number } | undefined;
				conflictVersion = current?.version ?? null;
				return; // signal conflict
			}

			// Record changes in audit
			const changes: Record<string, { old: string; new: string }> = {};
			if (doc.title !== input.title) {
				changes.title = { old: doc.title, new: input.title };
			}
			if (doc.content !== input.content) {
				changes.content = { old: doc.content, new: input.content };
			}

			sqlite.prepare(`
				INSERT INTO audit_logs (id, document_id, actor_id, action, from_status, to_status, comment, changes, created_at)
				VALUES (?, ?, ?, 'DOCUMENT_UPDATED', ?, ?, NULL, ?, ?)
			`).run(
				nanoid(), id, actor.id,
				doc.status, doc.status,
				Object.keys(changes).length > 0 ? JSON.stringify(changes) : null,
				now
			);
		});

		runTransaction();

		if (conflictVersion !== null) {
			throw new ConflictError(
				`Concurrency conflict: This document was modified by another user (current version: ${conflictVersion}, provided: ${input.expectedVersion}). Please reload and try again.`,
				conflictVersion,
				doc.status
			);
		}

		const updatedDoc = await DocumentRepository.findById(id);
		if (!updatedDoc) {
			throw new NotFoundError(`Document with ID "${id}" was not found after update.`);
		}
		return updatedDoc;
	}

	/**
	 * Perform a state transition with OCC and audit log.
	 * Uses native sqlite.transaction() for true synchronous execution.
	 */
	static async transitionState(
		actor: User,
		id: string,
		targetStatus: DocumentStatus,
		input: TransitionInput | RejectInput
	): Promise<DocumentWithAuthor> {
		const doc = await DocumentRepository.findById(id);

		if (!doc) {
			throw new NotFoundError(`Document with ID "${id}" was not found.`);
		}

		// Validate transition using pure function state machine
		const validationError = validateTransition({
			from: doc.status,
			to: targetStatus,
			actorRole: actor.role,
			actorId: actor.id,
			documentAuthorId: doc.authorId,
			comment: input.comment
		});

		if (validationError) {
			if (validationError.startsWith('Forbidden:')) {
				throw new ForbiddenError(validationError);
			}
			if (validationError.startsWith('Validation error:')) {
				throw new ValidationError(validationError);
			}
			throw new InvalidTransitionError(validationError);
		}

		const rule = findTransitionRule(doc.status, targetStatus);
		if (!rule) {
			throw new InvalidTransitionError(
				`Invalid state transition from "${doc.status}" to "${targetStatus}".`
			);
		}

		const now = Date.now();
		let conflictVersion: number | null = null;

		const runTransaction = sqlite.transaction(() => {
			// Update status with OCC
			const setDeletedAt = targetStatus === 'archived' ? `, deleted_at = ${now}` : '';
			const result = sqlite.prepare(`
				UPDATE documents
				SET status = ?, version = version + 1, updated_at = ?${setDeletedAt}
				WHERE id = ? AND version = ?
			`).run(targetStatus, now, id, input.expectedVersion);

			if (result.changes === 0) {
				const current = sqlite.prepare(`SELECT version FROM documents WHERE id = ?`).get(id) as { version: number } | undefined;
				conflictVersion = current?.version ?? null;
				return; // signal conflict
			}

			// Insert audit log
			sqlite.prepare(`
				INSERT INTO audit_logs (id, document_id, actor_id, action, from_status, to_status, comment, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).run(
				nanoid(), id, actor.id,
				rule.auditAction,
				doc.status, targetStatus,
				input.comment ?? null,
				now
			);
		});

		runTransaction();

		if (conflictVersion !== null) {
			throw new ConflictError(
				`Concurrency conflict: This document was modified by another user (current version: ${conflictVersion}, provided: ${input.expectedVersion}). Please reload and try again.`,
				conflictVersion,
				doc.status
			);
		}

		const updatedDoc = await DocumentRepository.findById(id);
		if (!updatedDoc) {
			throw new NotFoundError(`Document with ID "${id}" was not found after transition.`);
		}
		return updatedDoc;
	}

	// ── Explicit Transition Wrappers ──

	static async submit(actor: User, id: string, input: TransitionInput) {
		return this.transitionState(actor, id, 'submitted', input);
	}

	static async approve(actor: User, id: string, input: TransitionInput) {
		return this.transitionState(actor, id, 'approved', input);
	}

	static async reject(actor: User, id: string, input: RejectInput) {
		return this.transitionState(actor, id, 'rejected', input);
	}

	static async reopen(actor: User, id: string, input: TransitionInput) {
		return this.transitionState(actor, id, 'draft', input);
	}

	static async publish(actor: User, id: string, input: TransitionInput) {
		return this.transitionState(actor, id, 'published', input);
	}

	static async archive(actor: User, id: string, input: TransitionInput) {
		return this.transitionState(actor, id, 'archived', input);
	}
}
