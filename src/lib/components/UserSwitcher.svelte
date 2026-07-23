<script lang="ts">
	import { authStore, SEEDED_USERS } from '$lib/stores/auth';
	import { ChevronDown, Check, Shield, FileText, CheckCircle2, Eye, RefreshCw, User as UserIcon } from 'lucide-svelte';

	let isOpen = $state(false);
	let loadingEmail = $state<string | null>(null);

	const roleIcons: Record<string, any> = {
		author: FileText,
		reviewer: CheckCircle2,
		admin: Shield,
		viewer: Eye
	};

	let currentUser = $derived($authStore);

	async function switchUser(email: string) {
		loadingEmail = email;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await res.json();
			if (data.success && data.data?.user) {
				authStore.setUser(data.data.user);
				isOpen = false;
				window.location.reload();
			}
		} catch (err) {
			console.error('Failed to switch user:', err);
		} finally {
			loadingEmail = null;
		}
	}
</script>

<div class="user-switcher-container">
	<!-- Trigger Button -->
	<button
		type="button"
		id="user-switcher-btn"
		onclick={() => (isOpen = !isOpen)}
		class="switcher-trigger"
		aria-expanded={isOpen}
		aria-label="Switch active user role"
	>
		<div class="trigger-avatar">
			{currentUser?.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'U'}
		</div>

		<div class="trigger-info">
			<span class="trigger-name">{currentUser?.name || 'Select User'}</span>
			<span class="role-badge-{currentUser?.role || 'viewer'} trigger-role">{currentUser?.role || 'viewer'}</span>
		</div>

		<ChevronDown class="trigger-chevron {isOpen ? 'rotated' : ''}" />
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="dropdown-backdrop"
			onclick={() => (isOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
			role="button"
			tabindex="-1"
			aria-label="Close menu"
		></div>

		<div class="dropdown-menu glass-modal animate-slide-down">
			<div class="dropdown-header">
				<span class="dropdown-header-title">Switch Active Role</span>
				<span class="dropdown-header-sub">Instant server-side RBAC simulation</span>
			</div>

			<div class="dropdown-list">
				{#each SEEDED_USERS as seed}
					{@const isActive = currentUser?.email === seed.email}
					{@const IconComp = roleIcons[seed.role] || UserIcon}
					<button
						type="button"
						id="switch-user-{seed.role}"
						onclick={() => switchUser(seed.email)}
						disabled={loadingEmail !== null}
						class="user-option-btn {isActive ? 'option-active' : ''}"
					>
						<div class="option-icon">
							{#if loadingEmail === seed.email}
								<RefreshCw class="w-4 h-4 animate-spin text-indigo-400" />
							{:else}
								<IconComp class="w-4 h-4" />
							{/if}
						</div>

						<div class="option-details">
							<div class="option-top">
								<span class="option-name">{seed.name}</span>
								<span class="role-badge-{seed.role} option-role">{seed.role}</span>
							</div>
							<p class="option-desc">{seed.description}</p>
						</div>

						{#if isActive}
							<Check class="option-check" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.user-switcher-container {
		position: relative;
	}

	.switcher-trigger {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.35rem 0.75rem 0.35rem 0.35rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-color);
		border-radius: 999px;
		cursor: pointer;
		transition: all 0.2s;
		color: var(--text-main);
		font-family: var(--font-sans);
	}

	.switcher-trigger:hover {
		background: rgba(255, 255, 255, 0.07);
		border-color: var(--border-light);
	}

	.trigger-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366F1, #8B5CF6);
		color: white;
		font-size: 0.65rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.trigger-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1px;
		line-height: 1;
	}

	.trigger-name {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.trigger-role {
		font-size: 0.58rem !important;
		padding: 0.05rem 0.35rem !important;
	}

	:global(.trigger-chevron) {
		width: 14px;
		height: 14px;
		color: var(--text-muted);
		transition: transform 0.2s;
	}

	:global(.rotated) {
		transform: rotate(180deg);
	}

	.dropdown-backdrop {
		position: fixed;
		inset: 0;
		z-index: 90;
	}

	.dropdown-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		width: 320px;
		z-index: 100;
		border-radius: var(--radius-xl);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dropdown-header {
		display: flex;
		flex-direction: column;
		padding: 0.375rem 0.5rem 0.625rem;
		border-bottom: 1px solid var(--border-color);
	}

	.dropdown-header-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.dropdown-header-sub {
		font-size: 0.7rem;
		color: var(--text-dim);
		margin-top: 2px;
	}

	.dropdown-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.user-option-btn {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		border-radius: var(--radius-lg);
		background: transparent;
		border: 1px solid transparent;
		color: var(--text-main);
		cursor: pointer;
		text-align: left;
		transition: all 0.15s;
		width: 100%;
		font-family: var(--font-sans);
	}

	.user-option-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--border-color);
	}

	.option-active {
		background: rgba(99, 102, 241, 0.1) !important;
		border-color: rgba(99, 102, 241, 0.3) !important;
	}

	.option-icon {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: var(--bg-raised);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #818CF8;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.option-details {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.option-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.option-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.option-role {
		font-size: 0.58rem !important;
		padding: 0.05rem 0.35rem !important;
	}

	.option-desc {
		font-size: 0.72rem;
		color: var(--text-muted);
		line-height: 1.3;

		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.option-check) {
		width: 14px;
		height: 14px;
		color: #818CF8;
		margin-top: 6px;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.trigger-info { display: none; }
		.dropdown-menu { right: -1rem; width: 290px; }
	}
</style>
