<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { authStore } from '$lib/stores/auth';

	let { data, children } = $props();

	// Sync auth store with server-provided user session
	$effect(() => {
		authStore.setUser(data.user);
	});

	let showSidebar = $derived(!!data.user && data.urlPath !== '/login');
</script>

<svelte:head>
	<title>ElevateBox — Controlled Document Approval</title>
</svelte:head>

<div class="app-container">
	<Navbar user={data.user} />

	<div class="main-layout">
		{#if showSidebar}
			<Sidebar user={data.user} currentPath={data.urlPath} />
		{/if}

		<main class="content-area">
			{@render children()}
		</main>
	</div>

	<ToastContainer />
</div>
