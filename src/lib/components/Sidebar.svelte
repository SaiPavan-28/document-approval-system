<script lang="ts">
	import type { User } from '$lib/types';
	import {
		LayoutDashboard, FileText, PlusCircle, Clock, Send,
		CheckCircle2, XCircle, Globe, Archive, ChevronRight
	} from 'lucide-svelte';

	let { user, currentPath }: { user: User | null; currentPath: string } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/documents', label: 'All Documents', icon: FileText, exact: true }
	];

	const statusItems = [
		{ href: '/documents?status=draft',     label: 'Drafts',      icon: Clock,        status: 'draft'     },
		{ href: '/documents?status=submitted', label: 'In Review',   icon: Send,         status: 'submitted' },
		{ href: '/documents?status=approved',  label: 'Approved',    icon: CheckCircle2, status: 'approved'  },
		{ href: '/documents?status=rejected',  label: 'Rejected',    icon: XCircle,      status: 'rejected'  },
		{ href: '/documents?status=published', label: 'Published',   icon: Globe,        status: 'published' },
		{ href: '/documents?status=archived',  label: 'Archived',    icon: Archive,      status: 'archived'  },
	];

	// Only show relevant queues per role
	let visibleStatus = $derived(() => {
		if (!user) return statusItems;
		if (user.role === 'viewer') return statusItems.filter(s => s.status === 'published');
		if (user.role === 'author') return statusItems.filter(s => ['draft','submitted','rejected','published'].includes(s.status));
		return statusItems;
	});

	function isActive(href: string, exact = false): boolean {
		if (exact) return currentPath === href;
		return currentPath.startsWith(href.split('?')[0]) && href.split('?')[0] !== '/';
	}
</script>

<aside class="sidebar">
	<div class="sidebar-inner">
		<!-- Quick Create (Authors & Admins) -->
		{#if user?.role === 'author' || user?.role === 'admin'}
			<a href="/documents/new" class="create-btn" id="sidebar-create-btn">
				<PlusCircle class="w-4 h-4" />
				<span>New Document</span>
			</a>
		{/if}

		<!-- Primary Navigation -->
		<nav class="nav-section">
			<div class="nav-section-label">Navigation</div>
			{#each navItems as item}
				{@const active = isActive(item.href, item.exact)}
				{@const IconComp = item.icon}
				<a href={item.href} class="nav-item {active ? 'nav-item-active' : ''}">
					<IconComp class="nav-item-icon" />
					<span>{item.label}</span>
					{#if active}
						<ChevronRight class="nav-item-chevron" />
					{/if}
				</a>
			{/each}
		</nav>

		<!-- Document Queues -->
		<nav class="nav-section">
			<div class="nav-section-label">Document Queues</div>
			{#each visibleStatus() as item}
				{@const IconComp = item.icon}
				<a href={item.href} class="nav-item nav-item-queue">
					<IconComp class="nav-item-icon queue-icon-{item.status}" />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- User Card (bottom) -->
		{#if user}
			<div class="sidebar-user-card">
				<div class="user-avatar">
					{user.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
				</div>
				<div class="user-info">
					<span class="user-display-name">{user.name}</span>
					<span class="role-badge-{user.role} user-role-tag">{user.role}</span>
				</div>
			</div>
		{/if}
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		flex-shrink: 0;
		height: calc(100vh - var(--navbar-height));
		position: sticky;
		top: var(--navbar-height);
		overflow-y: auto;
		padding: 1.25rem 0.875rem;
		border-right: 1px solid var(--border-color);
		background: var(--bg-surface);
		display: flex;
		flex-direction: column;
	}

	.sidebar-inner {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		flex: 1;
	}

	/* Create Button */
	.create-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: linear-gradient(135deg, #6366F1, #4F46E5);
		color: white;
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 700;
		text-decoration: none;
		box-shadow: 0 2px 12px rgba(99,102,241,0.3);
		transition: all 0.2s;
	}

	.create-btn:hover {
		background: linear-gradient(135deg, #818CF8, #6366F1);
		box-shadow: 0 4px 20px rgba(99,102,241,0.4);
		transform: translateY(-1px);
	}

	/* Nav Sections */
	.nav-section { display: flex; flex-direction: column; gap: 0.125rem; }

	.nav-section-label {
		font-size: 0.65rem;
		font-family: var(--font-mono);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-dim);
		padding: 0 0.625rem;
		margin-bottom: 0.375rem;
	}

	/* Nav Items */
	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-md);
		font-size: 0.825rem;
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
		transition: all 0.15s;
		position: relative;
	}

	.nav-item:hover {
		background: rgba(255,255,255,0.04);
		color: var(--text-main);
	}

	.nav-item-active {
		background: rgba(99,102,241,0.12) !important;
		color: #818CF8 !important;
		font-weight: 600;
	}

	:global(.nav-item-icon) {
		width: 15px;
		height: 15px;
		flex-shrink: 0;
	}

	:global(.nav-item-chevron) {
		width: 12px;
		height: 12px;
		margin-left: auto;
		opacity: 0.5;
	}

	/* Queue Icons Colors */
	:global(.queue-icon-draft)     { color: #94A3B8; }
	:global(.queue-icon-submitted) { color: #FBBF24; }
	:global(.queue-icon-approved)  { color: #34D399; }
	:global(.queue-icon-rejected)  { color: #F87171; }
	:global(.queue-icon-published) { color: #A78BFA; }
	:global(.queue-icon-archived)  { color: #64748B; }

	.nav-item-queue { font-size: 0.8rem; }

	/* User Card at Bottom */
	.sidebar-user-card {
		margin-top: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(255,255,255,0.02);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366F1, #8B5CF6);
		color: white;
		font-size: 0.7rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.user-display-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-role-tag {
		font-size: 0.6rem !important;
		padding: 0.08rem 0.4rem !important;
	}

	@media (max-width: 1024px) {
		.sidebar { display: none; }
	}
</style>
