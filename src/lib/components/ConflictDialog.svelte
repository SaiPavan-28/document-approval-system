<script lang="ts">
	import type { Document } from '$lib/types';
	import { AlertTriangle, RefreshCw, X } from 'lucide-svelte';

	let {
		isOpen = false,
		attemptedVersion = 1,
		latestDocument = null,
		onReload,
		onClose
	}: {
		isOpen: boolean;
		attemptedVersion?: number;
		latestDocument?: Document | null;
		onReload: () => void;
		onClose: () => void;
	} = $props();
</script>

{#if isOpen}
	<div class="modal-overlay animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
		<div class="modal-panel glass-modal">
			<div class="modal-header">
				<div class="header-left">
					<div class="warning-icon-badge">
						<AlertTriangle class="w-5 h-5 text-amber-400" />
					</div>
					<div>
						<h3 id="conflict-title" class="header-title text-amber-400">Concurrency Conflict (409)</h3>
						<p class="header-sub">Document was updated by another user while you were editing</p>
					</div>
				</div>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Close dialog">
					<X class="w-4 h-4" />
				</button>
			</div>

			<div class="modal-body">
				<div class="conflict-comparison">
					<div class="version-box your-box">
						<span class="box-label">Your Mutation</span>
						<div class="version-chip">v{attemptedVersion}</div>
						<p class="box-desc">Rejected by server to prevent overwriting newer data.</p>
					</div>

					<div class="vs-badge">VS</div>

					<div class="version-box server-box">
						<span class="box-label text-emerald-400">Current Server State</span>
						<div class="version-chip server-chip">
							v{latestDocument?.version ?? (attemptedVersion + 1)}
						</div>
						<p class="box-desc">
							Status: <strong class="uppercase text-emerald-300">{latestDocument?.status ?? 'Updated'}</strong>
						</p>
					</div>
				</div>

				{#if latestDocument}
					<div class="preview-box">
						<span class="preview-label">Latest Server Title:</span>
						<p class="preview-title">{latestDocument.title}</p>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button type="button" class="btn btn-outline" onclick={onClose}>
					Dismiss
				</button>
				<button type="button" class="btn btn-primary" onclick={onReload}>
					<RefreshCw class="w-4 h-4" />
					<span>Reload Latest State</span>
				</button>
			</div>
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
		background: rgba(245, 158, 11, 0.05);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.warning-icon-badge {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: rgba(245, 158, 11, 0.12);
		border: 1px solid rgba(245, 158, 11, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-title {
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.2;
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

	.conflict-comparison {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		align-items: center;
	}

	.version-box {
		padding: 1rem;
		border-radius: var(--radius-lg);
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.box-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.version-chip {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 700;
		padding: 0.2rem 0.55rem;
		background: var(--bg-raised);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-color);
		width: fit-content;
		color: var(--text-main);
	}

	.server-chip {
		background: rgba(16, 185, 129, 0.12);
		color: #34D399;
		border-color: rgba(16, 185, 129, 0.3);
	}

	.box-desc {
		font-size: 0.75rem;
		color: var(--text-dim);
		line-height: 1.35;
	}

	.vs-badge {
		font-weight: 800;
		font-size: 0.7rem;
		color: var(--text-dim);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-box {
		padding: 0.875rem 1rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
	}

	.preview-label {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.preview-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-main);
		margin-top: 0.25rem;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		border-top: 1px solid var(--border-color);
		background: rgba(0, 0, 0, 0.2);
	}

	.text-emerald-400 { color: #34D399; }
	.text-emerald-300 { color: #6EE7B7; }
	.text-amber-400 { color: #FBBF24; }
	.uppercase { text-transform: uppercase; }
</style>
