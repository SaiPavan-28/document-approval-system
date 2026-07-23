// ──────────────────────────────────────────────
// Document State Machine — Pure Function Implementation
// ──────────────────────────────────────────────
// This module defines the ONLY valid state transitions for a document.
// Any transition not listed here is INVALID and must be rejected by the server.
// This is the spine of the entire system (per PDF page 3).

import type { DocumentStatus, UserRole, AuditAction } from '$lib/types';

/**
 * Each transition entry defines:
 * - from: the current state
 * - to: the target state
 * - allowedRoles: which roles can trigger this transition
 * - requiresOwnership: if true, only the document's author can trigger it
 * - requiresNotOwner: if true, the actor MUST NOT be the document's author
 * - requiresComment: if true, a comment must be provided
 * - auditAction: the audit action to record
 */
export interface TransitionRule {
	from: DocumentStatus;
	to: DocumentStatus;
	allowedRoles: readonly UserRole[];
	requiresOwnership: boolean;
	requiresNotOwner: boolean;
	requiresComment: boolean;
	auditAction: AuditAction;
}

/**
 * The complete set of valid state transitions per the ElevateBox PDF (Page 3, Figure 1).
 *
 * From          → To          | Who triggers it
 * draft         → submitted   | Author submits own document
 * submitted     → approved    | Reviewer approves (not own)
 * submitted     → rejected    | Reviewer rejects (comment required, not own)
 * rejected      → draft       | Author reopens to fix (own doc)
 * approved      → published   | Reviewer or Admin publishes
 * draft         → archived    | Admin archives
 * submitted     → archived    | Admin archives
 * approved      → archived    | Admin archives
 * published     → archived    | Admin archives
 */
export const TRANSITION_RULES: readonly TransitionRule[] = [
	{
		from: 'draft',
		to: 'submitted',
		allowedRoles: ['author', 'admin'],
		requiresOwnership: true,
		requiresNotOwner: false,
		requiresComment: false,
		auditAction: 'DOCUMENT_SUBMITTED'
	},
	{
		from: 'submitted',
		to: 'approved',
		allowedRoles: ['reviewer', 'admin'],
		requiresOwnership: false,
		requiresNotOwner: true,
		requiresComment: false,
		auditAction: 'DOCUMENT_APPROVED'
	},
	{
		from: 'submitted',
		to: 'rejected',
		allowedRoles: ['reviewer', 'admin'],
		requiresOwnership: false,
		requiresNotOwner: true,
		requiresComment: true,
		auditAction: 'DOCUMENT_REJECTED'
	},
	{
		from: 'rejected',
		to: 'draft',
		allowedRoles: ['author', 'admin'],
		requiresOwnership: true,
		requiresNotOwner: false,
		requiresComment: false,
		auditAction: 'DOCUMENT_REOPENED'
	},
	{
		from: 'approved',
		to: 'published',
		allowedRoles: ['reviewer', 'admin'],
		requiresOwnership: false,
		requiresNotOwner: false,
		requiresComment: false,
		auditAction: 'DOCUMENT_PUBLISHED'
	},
	// Archive transitions — Admin only, from any active state
	{
		from: 'draft',
		to: 'archived',
		allowedRoles: ['admin'],
		requiresOwnership: false,
		requiresNotOwner: false,
		requiresComment: false,
		auditAction: 'DOCUMENT_ARCHIVED'
	},
	{
		from: 'submitted',
		to: 'archived',
		allowedRoles: ['admin'],
		requiresOwnership: false,
		requiresNotOwner: false,
		requiresComment: false,
		auditAction: 'DOCUMENT_ARCHIVED'
	},
	{
		from: 'approved',
		to: 'archived',
		allowedRoles: ['admin'],
		requiresOwnership: false,
		requiresNotOwner: false,
		requiresComment: false,
		auditAction: 'DOCUMENT_ARCHIVED'
	},
	{
		from: 'published',
		to: 'archived',
		allowedRoles: ['admin'],
		requiresOwnership: false,
		requiresNotOwner: false,
		requiresComment: false,
		auditAction: 'DOCUMENT_ARCHIVED'
	}
] as const;

/**
 * Find the transition rule for a given from → to state pair.
 * Returns undefined if the transition is not valid.
 */
export function findTransitionRule(
	from: DocumentStatus,
	to: DocumentStatus
): TransitionRule | undefined {
	return TRANSITION_RULES.find((rule) => rule.from === from && rule.to === to);
}

/**
 * Validate whether a state transition is allowed given the current context.
 *
 * @returns An error message string if invalid, or null if the transition is valid.
 */
export function validateTransition(params: {
	from: DocumentStatus;
	to: DocumentStatus;
	actorRole: UserRole;
	actorId: string;
	documentAuthorId: string;
	comment?: string | null;
}): string | null {
	const { from, to, actorRole, actorId, documentAuthorId, comment } = params;

	const rule = findTransitionRule(from, to);

	if (!rule) {
		return `Invalid transition: cannot move from "${from}" to "${to}". This transition is not allowed by the document workflow.`;
	}

	// Check role
	if (!rule.allowedRoles.includes(actorRole)) {
		return `Forbidden: role "${actorRole}" is not allowed to perform this transition (${from} → ${to}). Required roles: ${rule.allowedRoles.join(', ')}.`;
	}

	// Check ownership requirement
	if (rule.requiresOwnership && actorId !== documentAuthorId) {
		return `Forbidden: only the document owner can perform this action (${from} → ${to}).`;
	}

	// Check not-owner requirement (e.g., cannot approve own document)
	if (rule.requiresNotOwner && actorId === documentAuthorId) {
		return `Forbidden: you cannot ${to === 'approved' ? 'approve' : 'reject'} your own document.`;
	}

	// Check comment requirement
	if (rule.requiresComment && (!comment || comment.trim().length === 0)) {
		return `Validation error: a comment is required when rejecting a document.`;
	}

	return null; // Valid
}

/**
 * Get all valid target states from a given current state.
 */
export function getValidTargetStates(from: DocumentStatus): DocumentStatus[] {
	return TRANSITION_RULES.filter((rule) => rule.from === from).map((rule) => rule.to);
}

/**
 * Check if a document in the given status is editable (title/body can be updated).
 * Per PDF: Authors can edit documents in 'draft' or 'rejected' states only.
 */
export function isEditableStatus(status: DocumentStatus): boolean {
	return status === 'draft' || status === 'rejected';
}
