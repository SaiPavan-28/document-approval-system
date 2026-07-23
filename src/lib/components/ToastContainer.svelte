<script lang="ts">
	import { toastStore } from '$lib/stores/toast';
	import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-svelte';

	let toasts = $derived($toastStore);

	const iconMap = {
		success: CheckCircle2,
		error:   AlertCircle,
		warning: AlertTriangle,
		info:    Info
	};

	const colorMap: Record<string, { bg: string; border: string; color: string; icon: string }> = {
		success: { bg: 'rgba(6,78,59,0.92)',    border: 'rgba(16,185,129,0.4)', color: '#6EE7B7', icon: '#34D399' },
		error:   { bg: 'rgba(127,29,29,0.92)',  border: 'rgba(239,68,68,0.4)',  color: '#FCA5A5', icon: '#F87171' },
		warning: { bg: 'rgba(120,53,15,0.92)',  border: 'rgba(245,158,11,0.4)', color: '#FDE68A', icon: '#FBBF24' },
		info:    { bg: 'rgba(30,58,138,0.92)',  border: 'rgba(59,130,246,0.4)', color: '#BFDBFE', icon: '#60A5FA' },
	};
</script>

{#if toasts.length > 0}
	<div class="toast-container" role="region" aria-label="Notifications">
		{#each toasts as toast (toast.id)}
			{@const colors = colorMap[toast.type] || colorMap.info}
			{@const IconComp = iconMap[toast.type as keyof typeof iconMap] || Info}
			<div
				class="toast"
				role="alert"
				style="background:{colors.bg}; border-color:{colors.border}; color:{colors.color};"
			>
				<div class="toast-icon" style="color:{colors.icon};">
					<IconComp class="w-4 h-4" />
				</div>
				<p class="toast-message">{toast.message}</p>
				<button
					type="button"
					onclick={() => toastStore.remove(toast.id)}
					class="toast-close"
					aria-label="Dismiss"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		flex-direction: column-reverse;
		gap: 0.5rem;
		z-index: 9999;
		pointer-events: none;
		max-width: 380px;
		width: calc(100vw - 2rem);
	}

	.toast {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border: 1px solid;
		border-radius: 12px;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
		pointer-events: all;
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		border-left-width: 3px;
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(8px) scale(0.96); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}

	.toast-icon { flex-shrink: 0; margin-top: 1px; }

	.toast-message {
		flex: 1;
		font-size: 0.85rem;
		font-weight: 500;
		line-height: 1.4;
		margin: 0;
	}

	.toast-close {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 4px;
		color: inherit;
		opacity: 0.6;
		transition: opacity 0.15s;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.toast-close:hover { opacity: 1; }
</style>
