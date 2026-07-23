<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	$effect(() => {
		if (data.user) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex items-center justify-center min-h-[60vh]">
	<div class="text-center font-sans">
		<div class="spinner border-blue-500 mb-4 mx-auto"></div>
		<p class="text-muted text-sm">Redirecting to Document Approval System...</p>
	</div>
</div>

<style>
	.min-h-\[60vh\] { min-height: 60vh; }
	.flex { display: flex; }
	.items-center { align-items: center; }
	.justify-center { justify-content: center; }
	.text-center { text-align: center; }
	.mb-4 { margin-bottom: 1rem; }
	.mx-auto { margin-left: auto; margin-right: auto; }
	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid rgba(59, 130, 246, 0.2);
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
