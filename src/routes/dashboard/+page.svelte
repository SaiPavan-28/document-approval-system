<script lang="ts">
	import type { PageData } from './$types';
	import type { DocumentStatus } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import {
		FileText, Send, CheckCircle2, XCircle, Globe, Archive,
		Plus, ArrowRight, Activity, Clock, TrendingUp, Layers,
		Bell, CheckCheck, AlertCircle, Eye, RotateCcw, BookOpen
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const statCards: { label: string; key: DocumentStatus; icon: any; color: string; borderClass: string }[] = [
		{ label: 'Drafts',    key: 'draft',     icon: FileText,    color: '#94A3B8', borderClass: 'stat-draft'     },
		{ label: 'Submitted', key: 'submitted', icon: Send,        color: '#FBBF24', borderClass: 'stat-submitted' },
		{ label: 'Approved',  key: 'approved',  icon: CheckCircle2,color: '#34D399', borderClass: 'stat-approved'  },
		{ label: 'Rejected',  key: 'rejected',  icon: XCircle,     color: '#F87171', borderClass: 'stat-rejected'  },
		{ label: 'Published', key: 'published', icon: Globe,       color: '#A78BFA', borderClass: 'stat-published' },
		{ label: 'Archived',  key: 'archived',  icon: Archive,     color: '#64748B', borderClass: 'stat-archived'  },
	];

	let totalDocs = $derived(Object.values(data.metrics.byStatus || {}).reduce((a: number, b: unknown) => a + (b as number), 0) as number);
	let recentDocs = $derived(data.recentDocuments || []);
	let notifications = $derived((data as any).notifications || []);

	function getNotifIcon(action: string) {
		if (action === 'DOCUMENT_CREATED') return FileText;
		if (action === 'DOCUMENT_UPDATED') return BookOpen;
		if (action === 'SUBMITTED_FOR_REVIEW') return Send;
		if (action === 'APPROVED') return CheckCheck;
		if (action === 'REJECTED') return XCircle;
		if (action === 'PUBLISHED') return Globe;
		if (action === 'ARCHIVED') return Archive;
		if (action === 'REOPENED') return RotateCcw;
		return Activity;
	}

	function getNotifColor(action: string): string {
		if (action === 'APPROVED') return '#34D399';
		if (action === 'REJECTED') return '#F87171';
		if (action === 'PUBLISHED') return '#A78BFA';
		if (action === 'SUBMITTED_FOR_REVIEW') return '#FBBF24';
		if (action === 'ARCHIVED') return '#64748B';
		if (action === 'REOPENED') return '#60A5FA';
		return '#818CF8';
	}

	function getNotifLabel(action: string): string {
		const map: Record<string, string> = {
			'DOCUMENT_CREATED': 'Draft created',
			'DOCUMENT_UPDATED': 'Document edited',
			'SUBMITTED_FOR_REVIEW': 'Submitted for review',
			'APPROVED': 'Approved',
			'REJECTED': 'Rejected',
			'PUBLISHED': 'Published',
			'ARCHIVED': 'Archived',
			'REOPENED': 'Reopened as draft'
		};
		return map[action] || action;
	}

	function formatRelative(ts: number | string): string {
		const date = new Date(typeof ts === 'number' ? ts : ts);
		const diff = Date.now() - date.getTime();
		const mins = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	}
</script>

<svelte:head>
	<title>Dashboard — ElevateBox Document Approval</title>
</svelte:head>

<div class="dashboard">
	<!-- Page Header -->
	<div class="page-header card">
		<div class="page-header-content">
			<div>
				<div class="page-header-eyebrow">
					<TrendingUp class="w-4 h-4" />
					<span>System Overview</span>
					<span class="role-badge-{data.user.role} header-role-badge">{data.user.role}</span>
				</div>
				<h1 class="page-title">Executive Dashboard</h1>
				<p class="page-subtitle">
					Welcome back, <strong>{data.user.name.split(' ')[0]}</strong> — 
					real-time document lifecycle metrics with single-transaction audit trails.
				</p>
			</div>
			{#if data.user.role === 'author' || data.user.role === 'admin'}
				<a href="/documents/new" id="dashboard-create-btn" class="btn btn-primary">
					<Plus class="w-4 h-4" />
					New Document
				</a>
			{/if}
		</div>
		<!-- Decorative gradient bar -->
		<div class="page-header-bar" aria-hidden="true"></div>
	</div>

	<!-- Metric Cards -->
	<section class="metrics-section" aria-label="Document metrics">
		<div class="metrics-header">
			<h2 class="section-title">
				<Layers class="w-4 h-4 text-indigo-400" />
				Document Pipeline
			</h2>
			<div class="total-badge">
				<span>{totalDocs}</span> total
			</div>
		</div>
		<div class="metrics-grid">
			{#each statCards as card}
				{@const count = (data.metrics.byStatus as Record<string, number>)[card.key] ?? 0}
				{@const IconComp = card.icon}
				<a
					href="/documents?status={card.key}"
					class="metric-card glass-card glass-card-hover {card.borderClass}"
					style="--stat-color: {card.color};"
				>
					<div class="metric-card-header">
						<span class="metric-label">{card.label}</span>
						<div class="metric-icon">
							<IconComp class="w-4 h-4" />
						</div>
					</div>
					<div class="metric-count">{count}</div>
					<div class="metric-footer">
						<span class="metric-pct">
							{totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0}%
						</span>
						<span class="metric-label-small">of total</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- Main Content Grid -->
	<div class="dashboard-grid">
		<!-- Recent Documents -->
		<section class="recent-docs-section">
			<div class="section-header">
				<h2 class="section-title">
					<Clock class="w-4 h-4 text-indigo-400" />
					Recent Activity
				</h2>
				<a href="/documents" class="view-all-link">
					View all <ArrowRight class="w-3.5 h-3.5" />
				</a>
			</div>

			<div class="docs-list card" style="padding: 0;">
				{#if recentDocs.length === 0}
					<div class="empty-state">
						<FileText class="w-8 h-8" />
						<p class="empty-title">No documents yet</p>
						<p class="empty-sub">
							{data.user.role === 'author' || data.user.role === 'admin'
								? 'Create your first document to get started.'
								: 'No documents are visible for your current role.'}
						</p>
						{#if data.user.role === 'author' || data.user.role === 'admin'}
							<a href="/documents/new" class="btn btn-primary btn-sm" style="margin-top:1rem">
								<Plus class="w-3.5 h-3.5" /> Create First Document
							</a>
						{/if}
					</div>
				{:else}
					<div class="docs-list-inner">
						{#each recentDocs as doc}
							<a href="/documents/{doc.id}" class="doc-row">
								<div class="doc-row-content">
									<div class="doc-row-title">
										<span class="doc-title">{doc.title}</span>
										<StatusBadge status={doc.status} size="sm" />
									</div>
									<div class="doc-row-meta">
										<span>by <strong>{doc.author?.name || 'Unknown'}</strong></span>
										<span class="meta-sep">·</span>
										<span>v{doc.version}</span>
										<span class="meta-sep">·</span>
										<span>{new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
									</div>
								</div>
								<ArrowRight class="doc-row-arrow" />
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<!-- Notifications / Activity Feed -->
		<section class="notifications-section">
			<div class="section-header">
				<h2 class="section-title">
					<Bell class="w-4 h-4 text-indigo-400" />
					{data.user.role === 'author' ? 'My Document Updates' : 'Recent Actions'}
				</h2>
				{#if notifications.length > 0}
					<span class="notif-count">{notifications.length}</span>
				{/if}
			</div>

			<div class="notif-feed card" style="padding: 0; overflow: hidden;">
				{#if notifications.length === 0}
					<div class="empty-state">
						<Bell class="w-8 h-8" />
						<p class="empty-title">No activity yet</p>
						<p class="empty-sub">Status changes and actions will appear here.</p>
					</div>
				{:else}
					<div class="notif-list">
						{#each notifications as notif}
							{@const Icon = getNotifIcon(notif.action)}
							{@const color = getNotifColor(notif.action)}
							<a href="/documents/{notif.documentId}" class="notif-item">
								<div class="notif-icon-wrap" style="--notif-color: {color};">
									<Icon class="w-3.5 h-3.5" />
								</div>
								<div class="notif-content">
									<div class="notif-header-row">
										<span class="notif-label" style="color: {color};">{getNotifLabel(notif.action)}</span>
										<span class="notif-time">{formatRelative(notif.createdAt)}</span>
									</div>
									<p class="notif-doc-title">{notif.document?.title || 'Unknown Document'}</p>
									<div class="notif-meta">
										<span class="notif-actor">by {notif.actor?.name || 'Unknown'}</span>
										{#if notif.comment}
											<span class="meta-sep">·</span>
											<span class="notif-comment">"{notif.comment}"</span>
										{/if}
									</div>
								</div>
								<ArrowRight class="notif-arrow" />
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		max-width: 1400px;
	}

	/* Page Header */
	.page-header {
		position: relative;
		overflow: hidden;
		padding: 1.75rem 2rem;
	}

	.page-header-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		position: relative;
		z-index: 1;
	}

	.page-header-eyebrow {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.625rem;
	}

	.header-role-badge {
		font-size: 0.62rem !important;
		padding: 0.1rem 0.45rem !important;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--text-main);
		line-height: 1.2;
		margin-bottom: 0.375rem;
	}

	.page-subtitle {
		font-size: 0.875rem;
		color: var(--text-muted);
		line-height: 1.5;
	}

	.page-subtitle strong { color: var(--text-sub); }

	.page-header-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, #6366F1, #8B5CF6, #3B82F6);
	}

	/* Metrics */
	.metrics-section { display: flex; flex-direction: column; gap: 0.875rem; }

	.metrics-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.total-badge {
		font-size: 0.75rem;
		color: var(--text-muted);
		background: var(--bg-raised);
		border: 1px solid var(--border-color);
		padding: 0.2rem 0.75rem;
		border-radius: 999px;
	}

	.total-badge span {
		font-weight: 700;
		color: var(--text-main);
		font-family: var(--font-mono);
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.875rem;
	}

	.metric-card {
		border-radius: var(--radius-xl);
		padding: 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-decoration: none;
		border-color: rgba(255,255,255,0.06) !important;
		border-left: 2px solid var(--stat-color, var(--border-color)) !important;
	}

	.metric-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.metric-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.metric-icon {
		width: 28px;
		height: 28px;
		border-radius: 7px;
		background: rgba(255,255,255,0.04);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--stat-color, var(--text-sub));
	}

	.metric-count {
		font-size: 2rem;
		font-weight: 800;
		font-family: var(--font-mono);
		color: var(--text-main);
		line-height: 1;
	}

	.metric-footer {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.metric-pct {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--stat-color, var(--text-sub));
	}

	.metric-label-small {
		font-size: 0.68rem;
		color: var(--text-dim);
	}

	/* Dashboard Grid */
	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 420px;
		gap: 1.75rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.875rem;
	}

	.view-all-link {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.775rem;
		font-weight: 600;
		color: #818CF8;
		text-decoration: none;
		transition: color 0.15s;
	}

	.view-all-link:hover { color: #A78BFA; }

	/* Recent Docs List */
	.docs-list { overflow: hidden; }

	.docs-list-inner { display: flex; flex-direction: column; }

	.doc-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		text-decoration: none;
		border-bottom: 1px solid rgba(255,255,255,0.04);
		transition: background 0.15s;
	}

	.doc-row:last-child { border-bottom: none; }

	.doc-row:hover { background: rgba(99,102,241,0.04); }

	.doc-row-content { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; min-width: 0; }

	.doc-row-title {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.doc-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 300px;
	}

	.doc-row:hover .doc-title { color: #818CF8; }

	.doc-row-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-family: var(--font-mono);
	}

	.doc-row-meta strong { color: var(--text-sub); font-family: var(--font-sans); }
	.meta-sep { opacity: 0.4; }

	:global(.doc-row-arrow) {
		width: 14px;
		height: 14px;
		color: var(--text-dim);
		flex-shrink: 0;
		transition: color 0.15s, transform 0.15s;
	}

	.doc-row:hover :global(.doc-row-arrow) {
		color: #818CF8;
		transform: translateX(2px);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-dim);
	}

	.empty-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
		margin-top: 0.75rem;
		margin-bottom: 0.375rem;
	}

	.empty-sub { font-size: 0.825rem; color: var(--text-dim); }

	/* Notifications */
	.notifications-section { display: flex; flex-direction: column; }

	.notif-count {
		font-size: 0.65rem;
		font-weight: 700;
		background: rgba(99,102,241,0.15);
		color: #818CF8;
		border: 1px solid rgba(99,102,241,0.25);
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		font-family: var(--font-mono);
	}

	.notif-feed { overflow: hidden; }

	.notif-list { display: flex; flex-direction: column; max-height: 520px; overflow-y: auto; }

	.notif-list::-webkit-scrollbar { width: 4px; }
	.notif-list::-webkit-scrollbar-track { background: transparent; }
	.notif-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

	.notif-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-bottom: 1px solid rgba(255,255,255,0.04);
		text-decoration: none;
		transition: background 0.15s;
		cursor: pointer;
	}

	.notif-item:last-child { border-bottom: none; }

	.notif-item:hover { background: rgba(99,102,241,0.04); }

	.notif-icon-wrap {
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		border-radius: 8px;
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.06);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--notif-color, #818CF8);
		margin-top: 0.1rem;
	}

	.notif-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }

	.notif-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.notif-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.notif-time {
		font-size: 0.65rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		flex-shrink: 0;
	}

	.notif-doc-title {
		font-size: 0.825rem;
		font-weight: 600;
		color: var(--text-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.notif-item:hover .notif-doc-title { color: #818CF8; }

	.notif-meta {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		color: var(--text-dim);
		flex-wrap: wrap;
	}

	.notif-actor { color: var(--text-muted); }

	.notif-comment {
		color: var(--text-dim);
		font-style: italic;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 160px;
	}

	:global(.notif-arrow) {
		width: 12px;
		height: 12px;
		color: var(--text-dim);
		flex-shrink: 0;
		margin-top: 0.35rem;
		transition: color 0.15s, transform 0.15s;
	}

	.notif-item:hover :global(.notif-arrow) {
		color: #818CF8;
		transform: translateX(2px);
	}

	/* Stat-specific accent borders */
	.stat-draft     { --stat-color: #94A3B8; }
	.stat-submitted { --stat-color: #FBBF24; }
	.stat-approved  { --stat-color: #34D399; }
	.stat-rejected  { --stat-color: #F87171; }
	.stat-published { --stat-color: #A78BFA; }
	.stat-archived  { --stat-color: #64748B; }

	@media (max-width: 1200px) {
		.metrics-grid { grid-template-columns: repeat(3, 1fr); }
		.dashboard-grid { grid-template-columns: 1fr; }
	}

	@media (max-width: 640px) {
		.metrics-grid { grid-template-columns: repeat(2, 1fr); }
		.page-header { padding: 1.25rem; }
		.page-header-content { flex-direction: column; }
	}
</style>
