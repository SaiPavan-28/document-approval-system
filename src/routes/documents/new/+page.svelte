<script lang="ts">
	import { toastStore } from '$lib/stores/toast';
	import { FilePlus, ArrowLeft, Save, AlertCircle } from 'lucide-svelte';

	let { form } = $props();

	let title = $state('');
	let content = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (form?.message) {
			toastStore.error(form.message);
			isSubmitting = false;
		}
	});

	function handleSubmit() {
		if (!title.trim() || !content.trim()) {
			toastStore.error('Title and Content are required.');
			return;
		}
		isSubmitting = true;
	}
</script>

<svelte:head>
	<title>Create New Document — ElevateBox Approval</title>
</svelte:head>

<div class="form-page">
	<div class="page-nav">
		<a href="/documents" class="btn btn-outline btn-sm">
			<ArrowLeft class="w-4 h-4" />
			Back to Documents
		</a>
	</div>

	<div class="card form-card">
		<div class="form-header">
			<div class="header-icon">
				<FilePlus class="w-5 h-5 text-indigo-400" />
			</div>
			<div>
				<h1 class="form-title">Create New Document</h1>
				<p class="form-sub">Document will start in 'draft' status (Version 1). An audit event will be recorded.</p>
			</div>
		</div>

		{#if form?.message}
			<div class="error-banner">
				<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
				<span>{form.message}</span>
			</div>
		{/if}

		<form method="POST" onsubmit={handleSubmit} class="document-form">
			<div class="form-group">
				<label for="title" class="form-label">
					Document Title <span class="text-red-400">*</span>
				</label>
				<input
					type="text"
					id="title"
					name="title"
					class="input"
					placeholder="e.g. Technical System Architecture Specification"
					bind:value={title}
					required
				/>
			</div>

			<div class="form-group">
				<label for="content" class="form-label">
					Document Content <span class="text-red-400">*</span>
				</label>
				<textarea
					id="content"
					name="content"
					class="textarea"
					rows="12"
					placeholder="Enter detailed document content, technical specs, policy guidelines, or procedure instructions..."
					bind:value={content}
					required
				></textarea>
			</div>

			<div class="form-actions">
				<a href="/documents" class="btn btn-outline">Cancel</a>
				<button
					type="submit"
					class="btn btn-primary"
					id="save-draft-btn"
					disabled={isSubmitting || !title.trim() || !content.trim()}
				>
					{#if isSubmitting}
						<span class="spinner"></span>
						<span>Saving Draft...</span>
					{:else}
						<Save class="w-4 h-4" />
						<span>Create Draft Document</span>
					{/if}
				</button>
			</div>
		</form>
	</div>
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

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		font-size: 0.825rem;
		color: #FCA5A5;
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
	:global(.shrink-0) { flex-shrink: 0; }
</style>
