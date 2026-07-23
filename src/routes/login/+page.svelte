<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore, SEEDED_USERS } from '$lib/stores/auth';
	import {
		Shield, FileText, CheckCircle2, Eye, UserCheck,
		ArrowRight, Lock, CheckCircle, Sparkles, Activity
	} from 'lucide-svelte';

	const roleIcons: Record<string, any> = {
		author:   FileText,
		reviewer: CheckCircle2,
		admin:    Shield,
		viewer:   Eye
	};

	const roleDescriptions: Record<string, string> = {
		author:   'Create and edit draft documents, submit for review',
		reviewer: 'Approve or reject submitted documents with comments',
		admin:    'Full system control — archive and manage all documents',
		viewer:   'Read-only access to published documents'
	};

	const roleColors: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
		author:   { bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.2)',  icon: '#34D399', badge: 'role-badge-author'   },
		reviewer: { bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.2)',  icon: '#818CF8', badge: 'role-badge-reviewer' },
		admin:    { bg: 'rgba(168,85,247,0.06)',  border: 'rgba(168,85,247,0.2)',  icon: '#C084FC', badge: 'role-badge-admin'    },
		viewer:   { bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.2)', icon: '#94A3B8', badge: 'role-badge-viewer'   },
	};

	let loadingEmail = $state<string | null>(null);
	let errorMessage = $state<string>('');

	async function loginAs(email: string) {
		loadingEmail = email;
		errorMessage = '';
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await res.json();
			if (data.success && data.data?.user) {
				authStore.setUser(data.data.user);
				goto('/dashboard');
			} else {
				errorMessage = data.error?.message || 'Login failed';
			}
		} catch (err) {
			errorMessage = 'Network error during login. Is the server running?';
		} finally {
			loadingEmail = null;
		}
	}
</script>

<svelte:head>
	<title>Sign In — ElevateBox Document Approval</title>
</svelte:head>

<div class="login-page">
	<!-- Background decorations -->
	<div class="bg-glow bg-glow-1" aria-hidden="true"></div>
	<div class="bg-glow bg-glow-2" aria-hidden="true"></div>
	<div class="bg-glow bg-glow-3" aria-hidden="true"></div>

	<div class="login-container">
		<!-- Header Branding -->
		<div class="login-header">
			<div class="login-logo">
				<Shield class="w-7 h-7" />
			</div>
			<div class="chip">
				<Sparkles class="w-3.5 h-3.5" />
				<span>ElevateBox Engineering Challenge</span>
			</div>
			<h1 class="login-title">Controlled Document<br/>Approval System</h1>
			<p class="login-subtitle">
				A production-grade system demonstrating server-enforced RBAC,
				single-transaction audit logging, and optimistic concurrency control.
			</p>
		</div>

		<!-- Login Card -->
		<div class="login-card glass-modal">
			<div class="login-card-header">
				<div class="card-header-left">
					<UserCheck class="w-5 h-5 text-indigo-400" />
					<div>
						<h2 class="card-header-title">Select Test Account</h2>
						<p class="card-header-sub">Choose a role to test server-side permission enforcement</p>
					</div>
				</div>
				<div class="passwordless-chip">
					<Lock class="w-3 h-3" />
					<span>Passwordless</span>
				</div>
			</div>

			{#if errorMessage}
				<div class="error-alert" role="alert">
					<span>⚠</span>
					<span>{errorMessage}</span>
				</div>
			{/if}

			<!-- User Cards Grid -->
			<div class="user-cards-grid">
				{#each SEEDED_USERS as user}
					{@const colors = roleColors[user.role] || roleColors.viewer}
					{@const IconComp = roleIcons[user.role]}
					<button
						type="button"
						id="login-{user.role}"
						onclick={() => loginAs(user.email)}
						disabled={loadingEmail !== null}
						class="user-card"
						style="--card-bg: {colors.bg}; --card-border: {colors.border}; --card-icon: {colors.icon};"
					>
						<div class="user-card-top">
							<div class="user-card-icon">
								{#if IconComp}
									<IconComp class="w-5 h-5" />
								{/if}
							</div>
							<span class="{colors.badge} user-card-role">{user.role}</span>
						</div>

						<div class="user-card-body">
							<div class="user-card-name">{user.name}</div>
							<div class="user-card-email">{user.email}</div>
							<p class="user-card-desc">{roleDescriptions[user.role]}</p>
						</div>

						<div class="user-card-footer">
							<span>Sign in as {user.role}</span>
							{#if loadingEmail === user.email}
								<span class="spinner"></span>
							{:else}
								<ArrowRight class="w-4 h-4" />
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- Feature highlights -->
			<div class="feature-grid">
				<div class="feature-item">
					<CheckCircle class="w-4 h-4 text-emerald-400" />
					<span>State Machine Enforcement</span>
				</div>
				<div class="feature-item">
					<CheckCircle class="w-4 h-4 text-emerald-400" />
					<span>Single-Transaction Audit Log</span>
				</div>
				<div class="feature-item">
					<Activity class="w-4 h-4 text-emerald-400" />
					<span>Optimistic Concurrency (OCC)</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		position: relative;
		overflow: hidden;
	}

	/* Background Glows */
	.bg-glow {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		filter: blur(80px);
		opacity: 0.35;
	}
	.bg-glow-1 { width: 600px; height: 400px; top: -100px; left: 50%; transform: translateX(-50%); background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%); }
	.bg-glow-2 { width: 350px; height: 350px; bottom: -80px; left: -60px; background: rgba(139,92,246,0.2); }
	.bg-glow-3 { width: 300px; height: 300px; top: 20%; right: -60px; background: rgba(16,185,129,0.1); }

	.login-container {
		width: 100%;
		max-width: 700px;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		position: relative;
		z-index: 10;
	}

	/* Header */
	.login-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.login-logo {
		width: 56px;
		height: 56px;
		border-radius: 16px;
		background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15));
		border: 1px solid rgba(99,102,241,0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #818CF8;
		box-shadow: 0 0 30px rgba(99,102,241,0.25);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.875rem;
		background: rgba(99,102,241,0.08);
		border: 1px solid rgba(99,102,241,0.25);
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		color: #818CF8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.login-title {
		font-size: 2rem;
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text-main);
	}

	.login-subtitle {
		font-size: 0.875rem;
		color: var(--text-muted);
		max-width: 440px;
		line-height: 1.6;
	}

	/* Login Card */
	.login-card {
		border-radius: var(--radius-2xl);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.login-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--border-color);
	}

	.card-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.card-header-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.card-header-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.passwordless-chip {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.75rem;
		background: rgba(16,185,129,0.08);
		border: 1px solid rgba(16,185,129,0.2);
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 600;
		color: #34D399;
		white-space: nowrap;
	}

	/* Error */
	.error-alert {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgba(239,68,68,0.08);
		border: 1px solid rgba(239,68,68,0.25);
		border-radius: var(--radius-md);
		font-size: 0.825rem;
		color: #FCA5A5;
	}

	/* User Cards Grid */
	.user-cards-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.875rem;
	}

	.user-card {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1.125rem;
		background: var(--card-bg, var(--bg-card));
		border: 1px solid var(--card-border, var(--border-color));
		border-radius: var(--radius-xl);
		text-align: left;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		font-family: var(--font-sans);
	}

	.user-card:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		background: var(--bg-raised);
	}

	.user-card:active:not(:disabled) { transform: translateY(0); }
	.user-card:disabled { opacity: 0.5; cursor: not-allowed; }

	.user-card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.user-card-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: var(--bg-raised);
		border: 1px solid var(--card-border, var(--border-color));
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--card-icon, var(--text-sub));
	}

	.user-card-role { font-size: 0.65rem !important; }

	.user-card-body { display: flex; flex-direction: column; gap: 2px; }

	.user-card-name {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.user-card-email {
		font-size: 0.72rem;
		font-family: var(--font-mono);
		color: var(--text-muted);
	}

	.user-card-desc {
		font-size: 0.775rem;
		color: var(--text-muted);
		margin-top: 0.375rem;
		line-height: 1.5;
	}

	.user-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color);
		font-size: 0.775rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.user-card:hover:not(:disabled) .user-card-footer {
		color: var(--card-icon, var(--text-sub));
	}

	/* Features */
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--border-color);
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	@media (max-width: 580px) {
		.user-cards-grid { grid-template-columns: 1fr; }
		.feature-grid { grid-template-columns: 1fr; }
		.login-title { font-size: 1.5rem; }
	}
</style>
