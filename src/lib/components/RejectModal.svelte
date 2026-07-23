<script lang="ts">
	import { XCircle, X, AlertTriangle } from 'lucide-svelte';

	let {
		isOpen = false,
		isSubmitting = false,
		onConfirm,
		onCancel
	}: {
		isOpen: boolean;
		isSubmitting?: boolean;
		onConfirm: (comment: string) => void;
		onCancel: () => void;
	} = $props();

	let comment = $state('');
	let errorMessage = $state('');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!comment.trim()) {
			errorMessage = 'A rejection comment is required by the workflow rules.';
			return;
		}
		errorMessage = '';
		onConfirm(comment.trim());
	}

	$effect(() => {
		if (isOpen) {
			comment = '';
			errorMessage = '';
		}
	});
</script>

{#if isOpen}
	<div class="modal-overlay animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
		<div class="modal-panel glass-modal">
			<div class="modal-header">
				<div class="header-left">
					<div class="danger-icon-badge">
						<XCircle class="w-5 h-5 text-red-400" />
					</div>
					<div>
						<h3 id="reject-modal-title" class="header-title">Reject Document</h3>
						<p class="header-sub">Document will return to draft for author revisions</p>
					</div>
				</div>
				<button type="button" class="close-btn" onclick={onCancel} aria-label="Close modal">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form onsubmit={handleSubmit} class="modal-body">
				<div class="notice-banner">
					<AlertTriangle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
					<p class="notice-text">
						<strong>Rule:</strong> Rejection requires providing a descriptive comment so the author knows what changes are required before resubmitting.
					</p>
				</div>

				<div class="form-group">
					<label for="rejection-comment" class="form-label">
						Rejection Reason / Comment <span class="text-red-400">*</span>
					</label>
					<textarea
						id="rejection-comment"
						class="textarea"
						rows="4"
						placeholder="Specify required corrections or reason for rejection..."
						bind:value={comment}
						required
					></textarea>
					{#if errorMessage}
						<span class="error-msg">{errorMessage}</span>
					{/if}
				</div>

				<div class="modal-footer">
					<button
						type="button"
						class="btn btn-outline"
						onclick={onCancel}
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn btn-danger"
						id="confirm-reject-btn"
						disabled={isSubmitting || !comment.trim()}
					>
						{#if isSubmitting}
							<span class="spinner"></span>
							<span>Rejecting...</span>
						{:else}
							<XCircle class="w-4 h-4" />
							<span>Confirm Rejection</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
		background: rgba(239, 68, 68, 0.05);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.danger-icon-badge {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.header-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.35rem;
		border-radius: var(--radius-sm);
		transition: color 0.15s, background 0.15s;
	}

	.close-btn:hover {
		color: var(--text-main);
		background: var(--bg-raised);
	}

	.modal-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.notice-banner {
		display: flex;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.25);
		border-radius: var(--radius-md);
	}

	.notice-text {
		font-size: 0.78rem;
		color: #FDE68A;
		line-height: 1.45;
	}

	.notice-text strong { color: #FBBF24; }

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-size: 0.825rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.error-msg {
		font-size: 0.75rem;
		color: #F87171;
		font-weight: 500;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 0.5rem;
	}

	.text-red-400 { color: #F87171; }
	:global(.shrink-0) { flex-shrink: 0; }
	:global(.mt-0\.5) { margin-top: 0.125rem; }
</style>
