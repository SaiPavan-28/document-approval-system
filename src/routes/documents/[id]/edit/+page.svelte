<script lang="ts">
	import type { DocumentWithAuthor } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ConflictDialog from '$lib/components/ConflictDialog.svelte';
	import { toastStore } from '$lib/stores/toast';
	import { api, ApiFetchError } from '$lib/utils/api';
	import { ArrowLeft, Edit3, Save } from 'lucide-svelte';

	let { data } = $props();

	let doc = $state<DocumentWithAuthor>(data.document);
	let title = $state(data.document.title);
	let content = $state(data.document.content);
	let isSubmitting = $state(false);

	let isConflictDialogOpen = $state(false);
	let attemptedVersion = $state(data.document.version);
	let latestServerDoc = $state<DocumentWithAuthor | null>(null);

	$effect(() => {
		doc = data.document;
		title = data.document.title;
		content = data.document.content;
		attemptedVersion = data.document.version;
	});

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			toastStore.error('Title and Content are required.');
			return;
		}

		isSubmitting = true;
		attemptedVersion = doc.version;

		try {
			const updated = await api.patch<DocumentWithAuthor>(`/api/documents/${doc.id}`, {
				expectedVersion: doc.version,
				title: title.trim(),
				content: content.trim()
			});

			doc = updated;
			toastStore.success('Document updated successfully!');
			window.location.href = `/documents/${doc.id}`;
		} catch (err: any) {
			if (err instanceof ApiFetchError && err.isConflict) {
				try {
					latestServerDoc = await api.get<DocumentWithAuthor>(`/api/documents/${doc.id}`);
				} catch {
					latestServerDoc = null;
				}
				isConflictDialogOpen = true;
			} else {
				toastStore.error(err.message || 'Failed to update document');
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function reloadLatest() {
		try {
			const latest = await api.get<DocumentWithAuthor>(`/api/documents/${doc.id}`);
			doc = latest;
			title = latest.title;
			content = latest.content;
			isConflictDialogOpen = false;
			toastStore.info('Document reloaded with latest server state.');
		} catch {
			toastStore.error('Failed to reload document');
		}
	}
</script>

<svelte:head>
	<title>Edit {doc.title} — ElevateBox Approval</title>
</svelte:head>

<div class="form-page font-sans">
	<div class="page-nav">
		<a href="/documents/{doc.id}" class="btn btn-outline btn-sm">
			<ArrowLeft class="w-4 h-4" />
			Cancel & Return
		</a>
	</div>

	<div class="card form-card">
		<div class="form-header">
			<div class="header-icon">
				<Edit3 class="w-5 h-5 text-indigo-400" />
			</div>
			<div>
				<div class="header-title-row">
					<h1 class="form-title">Edit Document</h1>
					<StatusBadge status={doc.status} size="sm" />
				</div>
				<p class="form-sub">
					Editing version {doc.version}. Saving will increment to version {doc.version + 1} and record an audit log.
				</p>
			</div>
		</div>

		<form onsubmit={handleSave} class="document-form">
			<div class="form-group">
				<label for="edit-title" class="form-label">
					Document Title <span class="text-red-400">*</span>
				</label>
				<input
					type="text"
					id="edit-title"
					class="input"
					bind:value={title}
					required
				/>
			</div>

			<div class="form-group">
				<label for="edit-content" class="form-label">
					Document Content <span class="text-red-400">*</span>
				</label>
				<textarea
					id="edit-content"
					class="textarea"
					rows="14"
					bind:value={content}
					required
				></textarea>
			</div>

			<div class="form-actions">
				<a href="/documents/{doc.id}" class="btn btn-outline">Cancel</a>
				<button
					type="submit"
					class="btn btn-primary"
					id="save-changes-btn"
					disabled={isSubmitting || !title.trim() || !content.trim()}
				>
					{#if isSubmitting}
						<span class="spinner"></span>
						<span>Saving...</span>
					{:else}
						<Save class="w-4 h-4" />
						<span>Save Changes</span>
					{/if}
				</button>
			</div>
		</form>
	</div>

	<ConflictDialog
		isOpen={isConflictDialogOpen}
		attemptedVersion={attemptedVersion}
		latestDocument={latestServerDoc}
		onReload={reloadLatest}
		onClose={() => (isConflictDialogOpen = false)}
	/>
</div>

<style>
	.form-page {
		max-width: 840px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
	}

	.page-nav { display: flex; align-items: center; }

	.form-card { display: flex; flex-direction: column; gap: 1.5rem; }

	.form-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--border-color);
	}

	.header-icon {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-lg);
		background: var(--accent-subtle);
		border: 1px solid var(--accent-border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.form-title {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-main);
	}

	.form-sub {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.document-form { display: flex; flex-direction: column; gap: 1.25rem; }

	.form-group { display: flex; flex-direction: column; gap: 0.5rem; }

	.form-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.form-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--border-color);
	}

	.text-red-400 { color: #F87171; }
</style>
