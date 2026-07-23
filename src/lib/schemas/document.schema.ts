// ──────────────────────────────────────────────
// Zod Validation Schemas for all API Payloads
// ──────────────────────────────────────────────
// Every incoming request is validated against these schemas.
// Empty strings, missing fields, and invalid types are rejected.

import { z } from 'zod';
import { DOCUMENT_STATUSES } from '$lib/types';

// ── Auth Schemas ──

export const loginSchema = z.object({
	email: z
		.string({ message: 'Email is required' })
		.email('Must be a valid email address')
		.trim()
		.toLowerCase()
});

// ── Document Schemas ──

export const createDocumentSchema = z.object({
	title: z
		.string({ message: 'Title is required' })
		.trim()
		.min(1, 'Title cannot be empty')
		.max(500, 'Title must be 500 characters or fewer'),
	content: z
		.string({ message: 'Body is required' })
		.trim()
		.min(1, 'Body cannot be empty')
		.max(50000, 'Body must be 50,000 characters or fewer')
});

export const updateDocumentSchema = z.object({
	title: z
		.string({ message: 'Title is required' })
		.trim()
		.min(1, 'Title cannot be empty')
		.max(500, 'Title must be 500 characters or fewer'),
	content: z
		.string({ message: 'Body is required' })
		.trim()
		.min(1, 'Body cannot be empty')
		.max(50000, 'Body must be 50,000 characters or fewer'),
	expectedVersion: z
		.number({ message: 'Expected version is required for concurrency control' })
		.int('Version must be an integer')
		.positive('Version must be positive')
});

export const transitionSchema = z.object({
	expectedVersion: z
		.number({ message: 'Expected version is required for concurrency control' })
		.int('Version must be an integer')
		.positive('Version must be positive'),
	comment: z
		.string()
		.trim()
		.max(5000, 'Comment must be 5,000 characters or fewer')
		.optional()
		.nullable()
});

export const rejectSchema = z.object({
	expectedVersion: z
		.number({ message: 'Expected version is required for concurrency control' })
		.int('Version must be an integer')
		.positive('Version must be positive'),
	comment: z
		.string({ message: 'A comment is required when rejecting a document' })
		.trim()
		.min(1, 'Rejection comment cannot be empty')
		.max(5000, 'Comment must be 5,000 characters or fewer')
});

// ── Query Schemas ──

export const documentListQuerySchema = z.object({
	status: z.enum(DOCUMENT_STATUSES).optional(),
	search: z.string().trim().optional(),
	sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

// ── Type Exports ──

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;
export type RejectInput = z.infer<typeof rejectSchema>;
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
