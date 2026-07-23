<script lang="ts">
	import type { DocumentWithAuthor, User, DocumentStatus } from '$lib/types';
	import { validateTransition, isEditableStatus } from '$lib/state-machine/transitions';
	import { Send, CheckCircle2, XCircle, RotateCcw, Globe, Archive, Edit3, Lock, ChevronRight } from 'lucide-svelte';

	let {
		document,
		currentUser,
		onTransition,
		onOpenRejectModal
	}: {
		document: DocumentWithAuthor;
		currentUser: User | null;
		onTransition: (targetStatus: DocumentStatus, comment?: string) => void;
		onOpenRejectModal: () => void;
	} = $props();

	function check(to: DocumentStatus, comment?: string): boolean {
		if (!currentUser) return false;
		return validateTransition({
			from: document.status,
			to,
			actorRole: currentUser.role,
			actorId: currentUser.id,
			documentAuthorId: document.authorId,
			comment
		}) === null;
	}

	let canSubmit  = $derived(check('submitted'));
	let canApprove = $derived(check('approved'));
	let canReject  = $derived(check('rejected', 'DUMMY'));
	let canReopen  = $derived(check('draft'));
	let canPublish = $derived(check('published'));
	let canArchive = $derived(check('archived'));
	let canEdit    = $derived(
		currentUser
			? isEditableStatus(document.status) && (currentUser.id === document.authorId || currentUser.role === 'admin')
			: false
	);

	let hasAnyAction = $derived(canSubmit || canApprove || canReject || canReopen || canPublish || canArchive || canEdit);
</script>

<div class="action-bar card">
	<div class="action-bar-header">
		<div class="action-bar-title-group">
			<h3 class="action-bar-title">Workflow Actions</h3>
			<p class="action-bar-sub">Available for <span class="role-badge-{currentUser?.role}">{currentUser?.role}</span> in state <strong>{document.status}</strong></p>
		</div>
	</div>

	<div class="action-buttons">
		{#if !hasAnyAction}
			<div class="no-actions">
				<Lock class="w-4 h-4" />
				<span>
					No actions available for role <strong>{currentUser?.role}</strong> when document is <strong>{document.status}</strong>.
				</span>
			</div>
		{/if}

		{#if canEdit}
			<a href="/documents/{document.id}/edit" class="btn btn-secondary" id="action-edit">
				<Edit3 class="w-4 h-4" />
				Edit Document
			</a>
		{/if}

		{#if canSubmit}
			<button type="button" class="btn btn-primary" id="action-submit" onclick={() => onTransition('submitted')}>
				<Send class="w-4 h-4" />
				Submit for Review
			</button>
		{/if}

		{#if canApprove}
			<button type="button" class="btn btn-success" id="action-approve" onclick={() => onTransition('approved')}>
				<CheckCircle2 class="w-4 h-4" />
				Approve
			</button>
		{/if}

		{#if canReject}
			<button type="button" class="btn btn-danger" id="action-reject" onclick={onOpenRejectModal}>
				<XCircle class="w-4 h-4" />
				Reject with Comment
			</button>
		{/if}

		{#if canReopen}
			<button type="button" class="btn btn-warning" id="action-reopen" onclick={() => onTransition('draft')}>
				<RotateCcw class="w-4 h-4" />
				Reopen as Draft
			</button>
		{/if}

		{#if canPublish}
			<button type="button" class="btn btn-purple" id="action-publish" onclick={() => onTransition('published')}>
				<Globe class="w-4 h-4" />
				Publish
			</button>
		{/if}

		{#if canArchive}
			<button
				type="button"
				class="btn btn-outline archive-btn"
				id="action-archive"
				onclick={() => onTransition('archived')}
			>
				<Archive class="w-4 h-4" />
				Archive Document
			</button>
		{/if}
	</div>
</div>

<style>
	.action-bar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-bar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.875rem;
		border-bottom: 1px solid var(--border-color);
	}

	.action-bar-title-group { display: flex; flex-direction: column; gap: 0.25rem; }

	.action-bar-title {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-muted);
	}

	.action-bar-sub {
		font-size: 0.78rem;
		color: var(--text-dim);
		display: flex;
		align-items: center;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.action-bar-sub strong { color: var(--text-muted); }

	.action-bar-sub :global(span) {
		font-size: 0.62rem !important;
		padding: 0.08rem 0.4rem !important;
	}

	.action-buttons {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.no-actions {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: rgba(255,255,255,0.02);
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		color: var(--text-dim);
	}

	.no-actions strong { color: var(--text-muted); }

	.archive-btn {
		color: #F87171 !important;
		border-color: rgba(239,68,68,0.3) !important;
	}

	.archive-btn:hover {
		background: rgba(239,68,68,0.08) !important;
		border-color: rgba(239,68,68,0.5) !important;
	}
</style>
