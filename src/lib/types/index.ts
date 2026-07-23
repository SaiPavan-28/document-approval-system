// ──────────────────────────────────────────────
// Shared TypeScript types for the Document Approval System
// ──────────────────────────────────────────────

export const USER_ROLES = ['viewer', 'author', 'reviewer', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DOCUMENT_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'published', 'archived'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const AUDIT_ACTIONS = [
	'DOCUMENT_CREATED',
	'DOCUMENT_UPDATED',
	'DOCUMENT_SUBMITTED',
	'DOCUMENT_APPROVED',
	'DOCUMENT_REJECTED',
	'DOCUMENT_REOPENED',
	'DOCUMENT_PUBLISHED',
	'DOCUMENT_ARCHIVED'
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// ── Entity Types ──

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
}

export interface Document {
	id: string;
	title: string;
	content: string;
	status: DocumentStatus;
	version: number;
	authorId: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export interface AuditLog {
	id: string;
	documentId: string;
	actorId: string;
	action: AuditAction;
	fromStatus: DocumentStatus | null;
	toStatus: DocumentStatus;
	comment: string | null;
	changes: Record<string, { old: string; new: string }> | null;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: Date;
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	createdAt: Date;
}

// ── API Response Types ──

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: ApiError;
}

export interface ApiError {
	code: string;
	message: string;
	details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
}

// ── Document with Relations ──

export interface DocumentWithAuthor extends Document {
	author: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface AuditLogWithActor extends AuditLog {
	actor: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

// ── Dashboard Types ──

export interface DashboardMetrics {
	totalDocuments: number;
	byStatus: Record<DocumentStatus, number>;
	recentActivity: AuditLogWithActor[];
}
