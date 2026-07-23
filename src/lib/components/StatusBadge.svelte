<script lang="ts">
	import type { DocumentStatus } from '$lib/types';

	let {
		status,
		size = 'md'
	}: {
		status: DocumentStatus;
		size?: 'sm' | 'md' | 'lg' | 'small' | 'large';
	} = $props();

	// Map legacy size names reactively
	let normalizedSize = $derived(size === 'small' ? 'sm' : size === 'large' ? 'lg' : size);

	const statusConfig: Record<DocumentStatus, { label: string; cssClass: string }> = {
		draft:     { label: 'Draft',     cssClass: 'badge-draft'     },
		submitted: { label: 'Submitted', cssClass: 'badge-submitted' },
		approved:  { label: 'Approved',  cssClass: 'badge-approved'  },
		rejected:  { label: 'Rejected',  cssClass: 'badge-rejected'  },
		published: { label: 'Published', cssClass: 'badge-published' },
		archived:  { label: 'Archived',  cssClass: 'badge-archived'  },
	};

	let cfg = $derived(statusConfig[status] || statusConfig.draft);
	let sizeClass = $derived(normalizedSize === 'lg' ? 'badge-lg' : normalizedSize === 'sm' ? 'badge-sm' : '');
</script>

<span class="badge {cfg.cssClass} {sizeClass}" aria-label="Status: {cfg.label}">
	<span class="badge-dot" aria-hidden="true"></span>
	{cfg.label}
</span>

<style>
	.badge-sm {
		padding: 0.12rem 0.5rem !important;
		font-size: 0.62rem !important;
	}

	.badge-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background-color: currentColor;
		opacity: 0.7;
		flex-shrink: 0;
	}
</style>
