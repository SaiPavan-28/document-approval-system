<script lang="ts">
	import type { AuditLogWithActor } from '$lib/types';
	import StatusBadge from './StatusBadge.svelte';
	import {
		History, MessageSquare, ArrowRight, Clock,
		FilePlus, Edit, Send, CheckCircle2, XCircle,
		RotateCcw, Globe, Archive
	} from 'lucide-svelte';

	let {
		logs = [],
		compact = false
	}: {
		logs: AuditLogWithActor[];
		compact?: boolean;
	} = $props();

	function getActionIcon(action: string) {
		const map: Record<string, any> = {
			DOCUMENT_CREATED:  FilePlus,
			DOCUMENT_UPDATED:  Edit,
			DOCUMENT_SUBMITTED: Send,
			DOCUMENT_APPROVED: CheckCircle2,
			DOCUMENT_REJECTED: XCircle,
			DOCUMENT_REOPENED: RotateCcw,
			DOCUMENT_PUBLISHED: Globe,
			DOCUMENT_ARCHIVED: Archive,
		};
		return map[action] || History;
	}

	const actionStyles: Record<string, { bg: string; color: string; label: string }> = {
		DOCUMENT_CREATED:  { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA', label: 'Created'   },
		DOCUMENT_UPDATED:  { bg: 'rgba(100,116,139,0.15)', color: '#94A3B8', label: 'Updated'   },
		DOCUMENT_SUBMITTED:{ bg: 'rgba(245,158,11,0.15)',  color: '#FBBF24', label: 'Submitted' },
		DOCUMENT_APPROVED: { bg: 'rgba(16,185,129,0.15)',  color: '#34D399', label: 'Approved'  },
		DOCUMENT_REJECTED: { bg: 'rgba(239,68,68,0.15)',   color: '#F87171', label: 'Rejected'  },
		DOCUMENT_REOPENED: { bg: 'rgba(245,158,11,0.15)',  color: '#FBBF24', label: 'Reopened'  },
		DOCUMENT_PUBLISHED:{ bg: 'rgba(139,92,246,0.15)',  color: '#A78BFA', label: 'Published' },
		DOCUMENT_ARCHIVED: { bg: 'rgba(71,85,105,0.15)',   color: '#64748B', label: 'Archived'  },
	};

	function getStyle(action: string) {
		return actionStyles[action] || { bg: 'rgba(100,116,139,0.15)', color: '#94A3B8', label: action.replace('DOCUMENT_','') };
	}

	function formatDate(d: Date | string) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit'
		}).format(new Date(d));
	}

	function initials(name: string): string {
		return (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
	}
	function getSentence(log: AuditLogWithActor, style: any) {
		const name = log.actor?.name || 'System';
		switch (log.action) {
			case 'DOCUMENT_CREATED': return `${name} created the draft.`;
			case 'DOCUMENT_UPDATED': return `${name} edited the document.`;
			case 'DOCUMENT_SUBMITTED': return `${name} submitted the document for review.`;
			case 'DOCUMENT_APPROVED': return `${name} approved the document.`;
			case 'DOCUMENT_REJECTED': return `${name} rejected the document.`;
			case 'DOCUMENT_REOPENED': return `${name} reopened the document as a draft.`;
			case 'DOCUMENT_PUBLISHED': return `${name} published the document.`;
			case 'DOCUMENT_ARCHIVED': return `${name} archived the document.`;
			default: return `${name} performed ${style.label.toLowerCase()}.`;
		}
	}
</script>

<div class="timeline-root {compact ? 'timeline-compact' : ''}">
	{#if !compact}
		<div class="timeline-header">
			<div class="timeline-header-left">
				<History class="w-4 h-4 text-indigo-400" />
				<h3 class="timeline-title">Audit History</h3>
			</div>
			<span class="timeline-count">{logs.length} events</span>
		</div>
	{/if}

	{#if logs.length === 0}
		<div class="timeline-empty">
			<Clock class="w-7 h-7" />
			<p>No history recorded yet</p>
		</div>
	{:else}
		<div class="timeline-list">
			{#each logs as log, index (log.id)}
				{@const style = getStyle(log.action)}
				{@const IconComp = getActionIcon(log.action)}
				{@const isLatest = index === 0}
				
				<div class="timeline-item animate-fade-in {isLatest ? 'is-latest' : ''}">
					<div class="timeline-node" style="background:{style.bg}; color:{style.color}; border-color:{style.color}30; {isLatest ? `box-shadow: 0 0 0 4px ${style.bg};` : ''}">
						<IconComp class="w-3.5 h-3.5" />
					</div>

					<div class="timeline-card {isLatest ? 'latest-card' : ''}" style={isLatest ? `border-left: 4px solid ${style.color}; background: ${style.bg}20;` : ''}>
						<div class="timeline-card-top">
							<div class="timeline-actor">
								<div class="actor-avatar" title="{log.actor?.name}">
									{initials(log.actor?.name || 'User')}
								</div>
								<div class="actor-details">
									<span class="actor-name">{log.actor?.name || 'System'}</span>
									{#if log.actor?.role}
										<span class="role-badge-{log.actor.role} actor-role">{log.actor.role}</span>
									{/if}
								</div>
							</div>
							<div class="timeline-time">
								{#if isLatest}
									<span style="color: {style.color}; font-weight: bold; margin-right: 0.25rem; font-size: 0.75rem;">FINAL ACTION</span>
								{/if}
								<Clock class="w-3 h-3" />
								{formatDate(log.createdAt)}
							</div>
						</div>

						<div class="timeline-action-row" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
							<span class="action-sentence" style="font-size: 0.95rem; color: var(--text-main); font-weight: {isLatest ? '700' : '500'};">
								{getSentence(log, style)}
							</span>
						</div>

						<div class="timeline-action-row" style="opacity: {isLatest ? '1' : '0.8'};">
							<span
								class="action-chip"
								style="background:{style.bg}; color:{style.color}; border-color:{style.color}40;"
							>
								{style.label}
							</span>

							{#if log.fromStatus || log.toStatus}
								<div class="status-transition">
									{#if log.fromStatus}
										<StatusBadge status={log.fromStatus} size="sm" />
										<ArrowRight class="w-3 h-3 transition-arrow" />
									{/if}
									<StatusBadge status={log.toStatus} size="sm" />
								</div>
							{/if}
						</div>

						{#if log.comment}
							<div class="comment-block" style="margin-top: 0.75rem;">
								<MessageSquare class="w-3.5 h-3.5 comment-icon" />
								<span class="comment-text">"{log.comment}"</span>
							</div>
						{/if}

						{#if log.changes && Object.keys(log.changes).length > 0}
							<div class="changes-block" style="margin-top: 0.75rem;">
								<p class="changes-label">Field changes:</p>
								{#each Object.entries(log.changes) as [field, val]}
									<div class="change-row">
										<span class="change-field">{field}:</span>
										<span class="change-old">"{(val as any).old}"</span>
										<ArrowRight class="w-2.5 h-2.5 change-arrow" />
										<span class="change-new">"{(val as any).new}"</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.timeline-root {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
	}

	.timeline-compact {
		background: transparent;
		border: none;
		border-radius: 0;
		padding: 1rem;
		gap: 0.875rem;
	}

	.timeline-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.875rem;
		border-bottom: 1px solid var(--border-color);
	}

	.timeline-header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.timeline-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.timeline-count {
		font-size: 0.72rem;
		font-family: var(--font-mono);
		color: var(--text-dim);
		background: var(--bg-raised);
		border: 1px solid var(--border-color);
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
	}

	.timeline-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		color: var(--text-dim);
		font-size: 0.825rem;
		text-align: center;
	}

	/* Timeline list with vertical line */
	.timeline-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		position: relative;
	}

	.timeline-item {
		display: flex;
		gap: 0.875rem;
		position: relative;
		padding-bottom: 1.125rem;
	}

	.timeline-item:last-child { padding-bottom: 0; }

	/* Connecting vertical line */
	.timeline-item:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 14px;
		top: 30px;
		bottom: 0;
		width: 1px;
		background: var(--border-color);
	}

	/* Node */
	.timeline-node {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
	}

	/* Card */
	.timeline-card {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: rgba(255,255,255,0.02);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 0.75rem 0.875rem;
	}

	.timeline-card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.timeline-actor {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.actor-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366F1, #8B5CF6);
		color: white;
		font-size: 0.55rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.actor-details {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.actor-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.actor-role { font-size: 0.58rem !important; padding: 0.06rem 0.35rem !important; }

	.timeline-time {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.7rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		white-space: nowrap;
	}

	/* Action row */
	.timeline-action-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.action-chip {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		border: 1px solid;
	}

	.status-transition {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.status-none {
		font-size: 0.72rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
	}

	:global(.transition-arrow) { color: var(--text-dim); }

	/* Comment */
	.comment-block {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		background: rgba(245,158,11,0.06);
		border-left: 2px solid rgba(245,158,11,0.5);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}

	:global(.comment-icon) { color: #FBBF24; flex-shrink: 0; margin-top: 1px; }

	.comment-text {
		font-size: 0.78rem;
		color: #FDE68A;
		font-style: italic;
		line-height: 1.4;
	}

	/* Changes */
	.changes-block {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0.625rem;
		background: rgba(0,0,0,0.15);
		border-radius: var(--radius-sm);
	}

	.changes-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-dim);
		margin-bottom: 0.125rem;
	}

	.change-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.72rem;
		font-family: var(--font-mono);
	}

	.change-field { color: var(--text-muted); font-weight: 600; }
	.change-old   { color: #F87171; text-decoration: line-through; }
	.change-new   { color: #34D399; }
	:global(.change-arrow) { color: var(--text-dim); }
</style>
