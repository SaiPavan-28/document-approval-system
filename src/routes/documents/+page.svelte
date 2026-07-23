<script lang="ts">
	import DocumentTable from '$lib/components/DocumentTable.svelte';
	import { FileText, Plus } from 'lucide-svelte';

	let { data } = $props();

	let canCreate = $derived(data.user?.role === 'author' || data.user?.role === 'admin');
</script>

<svelte:head>
	<title>Documents — ElevateBox Document Approval</title>
</svelte:head>

<div class="docs-page">
	<!-- Page Header -->
	<div class="docs-header">
		<div class="docs-header-left">
			<div class="docs-header-icon">
				<FileText class="w-5 h-5" />
			</div>
			<div>
				<h1 class="docs-title">Document Repository</h1>
				<p class="docs-sub">Browse, filter, and manage approval workflow documents with role-based access.</p>
			</div>
		</div>

		{#if canCreate}
			<a href="/documents/new" class="btn btn-primary" id="docs-create-btn">
				<Plus class="w-4 h-4" />
				New Document
			</a>
		{/if}
	</div>

	<!-- Table -->
	<DocumentTable documents={data.documents} {canCreate} />
</div>

<style>
	.docs-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1400px;
	}

	.docs-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 1.5rem 1.75rem;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		border-top: 2px solid var(--accent-primary);
	}

	.docs-header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.docs-header-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--accent-subtle);
		border: 1px solid var(--accent-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-primary);
		flex-shrink: 0;
	}

	.docs-title {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-main);
		letter-spacing: -0.01em;
		margin-bottom: 0.25rem;
	}

	.docs-sub {
		font-size: 0.825rem;
		color: var(--text-muted);
	}
</style>
