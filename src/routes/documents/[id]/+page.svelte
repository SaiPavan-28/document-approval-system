<script lang="ts">
	import type { DocumentStatus, DocumentWithAuthor, AuditLogWithActor } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import RejectModal from '$lib/components/RejectModal.svelte';
	import ConflictDialog from '$lib/components/ConflictDialog.svelte';
	import AuditTimeline from '$lib/components/AuditTimeline.svelte';
	import { toastStore } from '$lib/stores/toast';
	import { api, ApiFetchError } from '$lib/utils/api';
	import { ArrowLeft, User, Calendar, FileText, RefreshCw, Clock, Download, AlertTriangle } from 'lucide-svelte';

	let { data } = $props();

	let doc        = $state<DocumentWithAuthor>(data.document);
	let auditLogs  = $state<AuditLogWithActor[]>(data.auditLogs);
	let isRejectModalOpen   = $state(false);
	let isRejecting         = $state(false);
	let isConflictDialogOpen = $state(false);
	let attemptedVersion    = $state(1);
	let latestServerDoc     = $state<DocumentWithAuthor | null>(null);
	let isRefreshing        = $state(false);

	$effect(() => {
		doc = data.document;
		auditLogs = data.auditLogs;
	});

	function formatDate(d: Date | string) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short', day: 'numeric', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		}).format(new Date(d));
	}

	async function reloadDocument() {
		isRefreshing = true;
		try {
			const [updatedDoc, auditRes] = await Promise.all([
				api.get<DocumentWithAuthor>(`/api/documents/${doc.id}`),
				api.get<{ items: AuditLogWithActor[] }>(`/api/documents/${doc.id}/audit`)
			]);
			doc = updatedDoc;
			auditLogs = auditRes.items || [];
			isConflictDialogOpen = false;
			toastStore.info('Document refreshed with latest state');
		} catch (err: any) {
			toastStore.error('Failed to refresh: ' + err.message);
		} finally {
			isRefreshing = false;
		}
	}

	async function executeTransition(targetStatus: DocumentStatus, comment?: string) {
		const endpointMap: Record<DocumentStatus, string> = {
			submitted: `/api/documents/${doc.id}/submit`,
			approved:  `/api/documents/${doc.id}/approve`,
			rejected:  `/api/documents/${doc.id}/reject`,
			draft:     `/api/documents/${doc.id}/reopen`,
			published: `/api/documents/${doc.id}/publish`,
			archived:  `/api/documents/${doc.id}/archive`
		};

		const url = endpointMap[targetStatus];
		if (!url) return;
		attemptedVersion = doc.version;

		try {
			const updatedDoc = await api.post<DocumentWithAuthor>(url, {
				expectedVersion: doc.version,
				comment: comment || undefined
			});
			doc = updatedDoc;
			toastStore.success(`Document moved to ${targetStatus.toUpperCase()} ✓`);
			// Refresh audit log
			try {
				const auditRes = await api.get<{ items: AuditLogWithActor[] }>(`/api/documents/${doc.id}/audit`);
				auditLogs = auditRes.items || [];
			} catch {}
		} catch (err: any) {
			if (err instanceof ApiFetchError && err.isConflict) {
				try { latestServerDoc = await api.get<DocumentWithAuthor>(`/api/documents/${doc.id}`); }
				catch { latestServerDoc = null; }
				isConflictDialogOpen = true;
			} else {
				toastStore.error(err.message || `Failed to transition to ${targetStatus}`);
			}
		}
	}

	async function handleRejectConfirm(comment: string) {
		isRejecting = true;
		try {
			await executeTransition('rejected', comment);
			isRejectModalOpen = false;
		} finally {
			isRejecting = false;
		}
	}

	let latestRejection = $derived(
		doc.status === 'rejected'
			? auditLogs.find(l => l.action === 'DOCUMENT_REJECTED')
			: null
	);

	let approvedBy = $derived(
		auditLogs.find(l => l.action === 'DOCUMENT_APPROVED')?.actor.name || 'Unknown'
	);
	
	function handleDownload() {
		const text = `Title: ${doc.title}\nAuthor: ${doc.author.name}\nApproved by: ${approvedBy}\n\n${doc.content}`;
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${doc.title.replace(/\s+/g, '_')}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>{doc.title} — ElevateBox Approval</title>
</svelte:head>

<div class="doc-detail font-sans">
	<!-- Back Navigation -->
	<div class="doc-detail-nav">
		<a href="/documents" class="btn btn-outline btn-sm">
			<ArrowLeft class="w-4 h-4" />
			Documents
		</a>
		<div style="display: flex; gap: 0.5rem;">
			{#if doc.status === 'published'}
				<button
					type="button"
					class="btn btn-outline btn-sm"
					onclick={handleDownload}
					title="Download published document"
				>
					<Download class="w-3.5 h-3.5" />
					Download
				</button>
			{/if}
			<button
				type="button"
				class="btn btn-outline btn-sm"
				onclick={reloadDocument}
				disabled={isRefreshing}
				title="Refresh to latest server state"
				id="refresh-doc-btn"
			>
				<RefreshCw class="w-3.5 h-3.5 {isRefreshing ? 'animate-spin' : ''}" />
				{isRefreshing ? 'Refreshing...' : 'Refresh'}
			</button>
		</div>
	</div>

	<!-- Main Content Layout -->
	<div class="doc-layout">
		<!-- Left: Document Content -->
		<div class="doc-main">
			<!-- Header Card -->
			{#if latestRejection}
				<div class="card error-banner mb-5" style="border-left: 4px solid #F87171; background: rgba(248, 113, 113, 0.1); margin-bottom: 1.25rem; display: flex; align-items: flex-start; gap: 0.75rem;">
					<AlertTriangle class="w-5 h-5 text-red-400 mt-0.5" style="color: #F87171; flex-shrink: 0;" />
					<div>
						<h4 style="font-weight: 700; color: #FCA5A5; font-size: 0.85rem;">Document Rejected by {latestRejection.actor.name}</h4>
						<p style="color: #FECACA; font-size: 0.9rem; margin-top: 0.25rem; font-style: italic;">Reason: "{latestRejection.comment}"</p>
					</div>
				</div>
			{/if}
			<div class="doc-header-card card">
				<div class="doc-header-top">
					<div class="doc-header-info">
						<div class="doc-header-badges">
							<StatusBadge status={doc.status} size="md" />
							<span class="version-tag">Version {doc.version}</span>
						</div>
						<h1 class="doc-main-title">{doc.title}</h1>
					</div>
				</div>

				<div class="doc-header-meta">
					<div class="meta-item">
						<User class="meta-icon-svg" />
						<span>Author: <strong>{doc.author.name}</strong></span>
						<span class="role-badge-{doc.author.role} meta-role">{doc.author.role}</span>
					</div>
					<div class="meta-item">
						<Calendar class="meta-icon-svg" />
						<span>Created: <strong>{formatDate(doc.createdAt)}</strong></span>
					</div>
					<div class="meta-item">
						<Clock class="meta-icon-svg" />
						<span>Updated: <strong>{formatDate(doc.updatedAt)}</strong></span>
					</div>
				</div>
			</div>

			<!-- Action Bar -->
			<ActionBar
				document={doc}
				currentUser={data.user}
				onTransition={(target, comment) => executeTransition(target, comment)}
				onOpenRejectModal={() => (isRejectModalOpen = true)}
			/>

			<!-- Content Card -->
			<div class="card doc-content-card">
				<div class="content-header">
					<FileText class="w-4 h-4 text-indigo-400" />
					<h2 class="content-title">Document Content</h2>
				</div>
				<div class="content-divider"></div>
				<div class="content-body">{doc.content}</div>
			</div>
		</div>

		<!-- Right: Audit Timeline -->
		<div class="doc-sidebar">
			<AuditTimeline logs={auditLogs} />
		</div>
	</div>

	<!-- Modals -->
	<RejectModal
		isOpen={isRejectModalOpen}
		isSubmitting={isRejecting}
		onConfirm={handleRejectConfirm}
		onCancel={() => (isRejectModalOpen = false)}
	/>

	<ConflictDialog
		isOpen={isConflictDialogOpen}
		attemptedVersion={attemptedVersion}
		latestDocument={latestServerDoc}
		onReload={reloadDocument}
		onClose={() => (isConflictDialogOpen = false)}
	/>
</div>

<style>
	.doc-detail {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 1400px;
	}

	.doc-detail-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.doc-layout {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 1.5rem;
		align-items: start;
	}

	.doc-main {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
	}

	.doc-sidebar {
		position: sticky;
		top: calc(var(--navbar-height) + 1.5rem);
	}

	/* Header Card */
	.doc-header-card { display: flex; flex-direction: column; gap: 1.25rem; }

	.doc-header-top { display: flex; align-items: flex-start; justify-content: space-between; }

	.doc-header-info { display: flex; flex-direction: column; gap: 0.625rem; }

	.doc-header-badges {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.version-tag {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		background: var(--bg-raised);
		color: var(--text-muted);
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--border-color);
	}

	.doc-main-title {
		font-size: 1.625rem;
		font-weight: 800;
		color: var(--text-main);
		letter-spacing: -0.015em;
		line-height: 1.25;
	}

	/* Meta Row */
	.doc-header-meta {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.meta-item strong { color: var(--text-sub); font-weight: 600; }

	:global(.meta-icon-svg) {
		width: 14px;
		height: 14px;
		color: var(--text-dim);
		flex-shrink: 0;
	}

	.meta-role { font-size: 0.6rem !important; padding: 0.08rem 0.4rem !important; }

	/* Content Card */
	.doc-content-card { display: flex; flex-direction: column; gap: 1rem; }

	.content-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.content-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.content-divider {
		height: 1px;
		background: var(--border-color);
	}

	.content-body {
		font-size: 0.925rem;
		line-height: 1.75;
		color: var(--text-sub);
		white-space: pre-wrap;
		word-break: break-word;
	}

	:global(.animate-spin) { animation: spin 0.7s linear infinite; }

	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 1100px) {
		.doc-layout { grid-template-columns: 1fr; }
		.doc-sidebar { position: static; }
	}

	@media (max-width: 640px) {
		.doc-header-meta { flex-direction: column; align-items: flex-start; gap: 0.625rem; }
		.doc-main-title { font-size: 1.25rem; }
	}
</style>
