<script lang="ts">
	import type { User } from '$lib/types';
	import UserSwitcher from './UserSwitcher.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { Shield, FileText, LayoutDashboard, LogOut, Menu, X } from 'lucide-svelte';
	import { page } from '$app/stores';

	let { user }: { user: User | null } = $props();

	let mobileMenuOpen = $state(false);

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.href = '/login';
	}
</script>

<header class="navbar glass-nav">
	<div class="navbar-inner">
		<!-- Brand Logo -->
		<a href="/dashboard" class="brand-link">
			<div class="brand-icon">
				<Shield class="brand-icon-svg" />
			</div>
			<div class="brand-text">
				<span class="brand-name">ElevateBox</span>
				<span class="brand-sub">Document Approval</span>
			</div>
		</a>

		<!-- Desktop Navigation -->
		{#if user}
			<nav class="desktop-nav">
				<a
					href="/dashboard"
					class="nav-link {$page.url.pathname === '/dashboard' ? 'nav-link-active' : ''}"
				>
					<LayoutDashboard class="nav-icon" />
					Dashboard
				</a>
				<a
					href="/documents"
					class="nav-link {$page.url.pathname.startsWith('/documents') ? 'nav-link-active' : ''}"
				>
					<FileText class="nav-icon" />
					Documents
				</a>
			</nav>
		{/if}

		<!-- Right Controls -->
		<div class="navbar-right">
			<ThemeToggle />

			{#if user}
				<UserSwitcher />

				<div class="user-pill">
					<div class="user-pill-avatar">
						{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
					</div>
					<div class="user-pill-info">
						<span class="user-pill-name">{user.name.split(' ')[0]}</span>
						<span class="role-badge-{user.role} user-pill-role">{user.role}</span>
					</div>
				</div>

				<button
					type="button"
					onclick={logout}
					title="Sign Out"
					class="btn btn-danger btn-sm"
					style="padding: 0.35rem 0.75rem;"
				>
					<LogOut class="w-3.5 h-3.5" />
					Logout
				</button>
			{/if}
		</div>
	</div>
</header>

<style>
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		height: var(--navbar-height);
	}

	.navbar-inner {
		height: 100%;
		max-width: 1600px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	/* Brand */
	.brand-link {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		text-decoration: none;
		flex-shrink: 0;
	}

	.brand-icon {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15));
		border: 1px solid rgba(99,102,241,0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #818CF8;
		transition: all 0.2s;
	}

	.brand-link:hover .brand-icon {
		background: linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.25));
		box-shadow: 0 0 16px rgba(99,102,241,0.3);
	}

	:global(.brand-icon-svg) { width: 18px; height: 18px; }

	.brand-text { display: flex; flex-direction: column; line-height: 1; }

	.brand-name {
		font-size: 0.9rem;
		font-weight: 800;
		background: linear-gradient(135deg, #fff 0%, #C7D2FE 60%, #818CF8 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.01em;
	}

	.brand-sub {
		font-size: 0.62rem;
		font-family: var(--font-mono);
		font-weight: 500;
		color: rgba(129, 140, 248, 0.7);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-top: 1px;
	}

	/* Desktop Nav */
	.desktop-nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba(255,255,255,0.03);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.25rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 0.85rem;
		border-radius: 7px;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
		transition: all 0.15s;
	}

	.nav-link:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }

	.nav-link-active {
		color: #818CF8 !important;
		background: rgba(99,102,241,0.12) !important;
		font-weight: 600;
	}

	:global(.nav-icon) { width: 14px; height: 14px; }

	/* Right Section */
	.navbar-right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255,255,255,0.03);
		border: 1px solid var(--border-color);
		border-radius: 999px;
		padding: 0.3rem 0.75rem 0.3rem 0.35rem;
	}

	.user-pill-avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366F1, #8B5CF6);
		color: white;
		font-size: 0.65rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		text-transform: uppercase;
	}

	.user-pill-info {
		display: flex;
		flex-direction: column;
		line-height: 1;
		gap: 2px;
	}

	.user-pill-name {
		font-size: 0.775rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.user-pill-role {
		font-size: 0.6rem !important;
		padding: 0.05rem 0.35rem !important;
	}

	.logout-btn {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		background: transparent;
		border: 1px solid var(--border-color);
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
		color: #F87171;
	}

	@media (max-width: 768px) {
		.desktop-nav { display: none; }
		.user-pill-info { display: none; }
		.brand-sub { display: none; }
	}
</style>
