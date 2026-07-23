import { describe, it, expect } from 'vitest';
import {
	validateTransition,
	findTransitionRule,
	isEditableStatus,
	TRANSITION_RULES
} from '../../src/lib/state-machine/transitions';
import type { DocumentStatus, UserRole } from '../../src/lib/types';

describe('Document State Machine Unit Tests', () => {
	const authorId = 'user_author_123';
	const reviewerId = 'user_reviewer_456';
	const adminId = 'user_admin_789';
	const otherUserId = 'user_other_999';

	describe('Valid Transitions Matrix', () => {
		it('draft → submitted by owner (author)', () => {
			const result = validateTransition({
				from: 'draft',
				to: 'submitted',
				actorRole: 'author',
				actorId: authorId,
				documentAuthorId: authorId
			});
			expect(result).toBeNull();
		});

		it('submitted → approved by reviewer (not owner)', () => {
			const result = validateTransition({
				from: 'submitted',
				to: 'approved',
				actorRole: 'reviewer',
				actorId: reviewerId,
				documentAuthorId: authorId
			});
			expect(result).toBeNull();
		});

		it('submitted → rejected by reviewer with mandatory comment', () => {
			const result = validateTransition({
				from: 'submitted',
				to: 'rejected',
				actorRole: 'reviewer',
				actorId: reviewerId,
				documentAuthorId: authorId,
				comment: 'Needs clearer section boundaries.'
			});
			expect(result).toBeNull();
		});

		it('rejected → draft by owner (reopen transition)', () => {
			const result = validateTransition({
				from: 'rejected',
				to: 'draft',
				actorRole: 'author',
				actorId: authorId,
				documentAuthorId: authorId
			});
			expect(result).toBeNull();
		});

		it('approved → published by reviewer or admin', () => {
			const reviewerResult = validateTransition({
				from: 'approved',
				to: 'published',
				actorRole: 'reviewer',
				actorId: reviewerId,
				documentAuthorId: authorId
			});
			expect(reviewerResult).toBeNull();

			const adminResult = validateTransition({
				from: 'approved',
				to: 'published',
				actorRole: 'admin',
				actorId: adminId,
				documentAuthorId: authorId
			});
			expect(adminResult).toBeNull();
		});

		it('any active state → archived by admin', () => {
			const statuses: DocumentStatus[] = ['draft', 'submitted', 'approved', 'published'];
			for (const status of statuses) {
				const result = validateTransition({
					from: status,
					to: 'archived',
					actorRole: 'admin',
					actorId: adminId,
					documentAuthorId: authorId
				});
				expect(result).toBeNull();
			}
		});
	});

	describe('Invalid Transitions & Rule Blocks', () => {
		it('blocks author from approving their own document (self-approval invariant)', () => {
			const result = validateTransition({
				from: 'submitted',
				to: 'approved',
				actorRole: 'reviewer', // Even if user has reviewer role
				actorId: authorId, // But is the author of this document
				documentAuthorId: authorId
			});
			expect(result).not.toBeNull();
			expect(result).toContain('cannot approve');
		});

		it('blocks non-owner author from submitting someone elses draft', () => {
			const result = validateTransition({
				from: 'draft',
				to: 'submitted',
				actorRole: 'author',
				actorId: otherUserId,
				documentAuthorId: authorId
			});
			expect(result).not.toBeNull();
			expect(result).toContain('only the document owner');
		});

		it('blocks rejection without a comment', () => {
			const result = validateTransition({
				from: 'submitted',
				to: 'rejected',
				actorRole: 'reviewer',
				actorId: reviewerId,
				documentAuthorId: authorId,
				comment: '   ' // whitespace only
			});
			expect(result).not.toBeNull();
			expect(result).toContain('comment is required');
		});

		it('blocks viewer from triggering any state transition', () => {
			const result = validateTransition({
				from: 'draft',
				to: 'submitted',
				actorRole: 'viewer',
				actorId: 'viewer_1',
				documentAuthorId: authorId
			});
			expect(result).not.toBeNull();
			expect(result).toContain('Forbidden: role "viewer"');
		});

		it('blocks illegal state transition jumps (e.g. draft → published)', () => {
			const result = validateTransition({
				from: 'draft',
				to: 'published',
				actorRole: 'admin',
				actorId: adminId,
				documentAuthorId: authorId
			});
			expect(result).not.toBeNull();
			expect(result).toContain('Invalid transition');
		});
	});

	describe('Editable Status Invariants', () => {
		it('allows editing ONLY for draft and rejected states', () => {
			expect(isEditableStatus('draft')).toBe(true);
			expect(isEditableStatus('rejected')).toBe(true);

			expect(isEditableStatus('submitted')).toBe(false);
			expect(isEditableStatus('approved')).toBe(false);
			expect(isEditableStatus('published')).toBe(false);
			expect(isEditableStatus('archived')).toBe(false);
		});
	});
});
