<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let isDark = $state(false);

	onMount(() => {
		// Check initial state applied by the app.html script
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('app-theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('app-theme', 'light');
		}
	}
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={toggleTheme}
	title={isDark ? "Switch to light mode" : "Switch to dark mode"}
	aria-label="Toggle dark mode"
>
	{#if isDark}
		<Sun class="w-4 h-4" />
	{:else}
		<Moon class="w-4 h-4" />
	{/if}
</button>

<style>
	.theme-toggle {
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

	.theme-toggle:hover {
		background: var(--bg-raised);
		color: var(--text-main);
		border-color: var(--border-light);
	}
</style>
