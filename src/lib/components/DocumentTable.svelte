<script lang="ts">
	import type { DocumentWithAuthor, DocumentStatus } from '$lib/types';
	import StatusBadge from './StatusBadge.svelte';
	import { Search, Filter, SlidersHorizontal, Eye, Edit3, FileText, Plus, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-svelte';

	let {
		documents = [],
		isLoading = false,
		canCreate = false
	}: {
		documents: DocumentWithAuthor[];
		isLoading?: boolean;
		canCreate?: boolean;
	} = $props();

	let searchQuery   = $state('');
	let selectedStatus = $state<string>('all');
	let sortField     = $state<'title' | 'status' | 'version' | 'createdAt'>('createdAt');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let currentPage   = $state(1);
	const pageSize    = 10;

	let filteredDocuments = $derived(
		documents.filter(doc => {
			const q = searchQuery.toLowerCase();
			const matchSearch = !q || doc.title.toLowerCase().includes(q) || doc.author.name.toLowerCase().includes(q);
			const matchStatus = selectedStatus === 'all' || doc.status === selectedStatus;
			return matchSearch && matchStatus;
		})
	);

	let sortedDocuments = $derived(
		[...filteredDocuments].sort((a, b) => {
			const valA = sortField === 'createdAt' ? new Date(a.createdAt).getTime() : (a as any)[sortField];
			const valB = sortField === 'createdAt' ? new Date(b.createdAt).getTime() : (b as any)[sortField];
			if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
			if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		})
	);

	let totalPages = $derived(Math.ceil(sortedDocuments.length / pageSize) || 1);
	let paginatedDocs = $derived(sortedDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize));

	function toggleSort(field: typeof sortField) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
		currentPage = 1;
	}

	function formatDate(d: Date | string) {
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
	}

	const statusOptions: { value: string; label: string }[] = [
		{ value: 'all',       label: 'All Statuses' },
		{ value: 'draft',     label: 'Draft' },
		{ value: 'submitted', label: 'Submitted' },
		{ value: 'approved',  label: 'Approved' },
		{ value: 'rejected',  label: 'Rejected' },
		{ value: 'published', label: 'Published' },
		{ value: 'archived',  label: 'Archived' },
	];
</script>

<div class="doc-table-wrapper">
	<!-- Controls Bar -->
	<div class="controls-bar">
		<div class="search-wrapper">
			<Search class="search-icon-el" />
			<input
				type="search"
				placeholder="Search by title or author..."
				bind:value={searchQuery}
				oninput={() => (currentPage = 1)}
				class="input search-input"
				id="doc-search"
			/>
		</div>

		<div class="controls-right">
			<div class="select-wrapper">
				<SlidersHorizontal class="select-icon-el" />
				<select
					bind:value={selectedStatus}
					onchange={() => (currentPage = 1)}
					class="select filter-select"
					id="doc-status-filter"
				>
					{#each statusOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>

			{#if canCreate}
				<a href="/documents/new" class="btn btn-primary btn-sm" id="create-document-btn">
					<Plus class="w-3.5 h-3.5" />
					New Document
				</a>
			{/if}
		</div>
	</div>

	<!-- Results count -->
	{#if !isLoading}
		<div class="results-info">
			Showing <strong>{sortedDocuments.length}</strong> of <strong>{documents.length}</strong> documents
			{#if searchQuery || selectedStatus !== 'all'}
				<button class="clear-filters-btn" onclick={() => { searchQuery = ''; selectedStatus = 'all'; currentPage = 1; }}>
					Clear filters
				</button>
			{/if}
		</div>
	{/if}

	<!-- Table -->
	<div class="table-container">
		<table class="data-table">
			<thead>
				<tr>
					<th>
						<button class="sort-btn" onclick={() => toggleSort('title')}>
							Title <ArrowUpDown class="sort-icon" />
						</button>
					</th>
					<th>
						<button class="sort-btn" onclick={() => toggleSort('status')}>
							Status <ArrowUpDown class="sort-icon" />
						</button>
					</th>
					<th>
						<button class="sort-btn" onclick={() => toggleSort('version')}>
							Ver. <ArrowUpDown class="sort-icon" />
						</button>
					</th>
					<th>Author</th>
					<th>
						<button class="sort-btn" onclick={() => toggleSort('createdAt')}>
							Created <ArrowUpDown class="sort-icon" />
						</button>
					</th>
					<th class="text-right">Actions</th>
				</tr>
			</thead>

			<tbody>
				{#if isLoading}
					{#each Array(5) as _, i}
						<tr>
							<td><div class="skeleton" style="height:18px;width:180px;"></div></td>
							<td><div class="skeleton" style="height:18px;width:80px;"></div></td>
							<td><div class="skeleton" style="height:18px;width:40px;"></div></td>
							<td><div class="skeleton" style="height:18px;width:110px;"></div></td>
							<td><div class="skeleton" style="height:18px;width:90px;"></div></td>
							<td><div class="skeleton" style="height:28px;width:70px;margin-left:auto;"></div></td>
						</tr>
					{/each}
				{:else if paginatedDocs.length === 0}
					<tr>
						<td colspan="6" class="empty-cell">
							<div class="empty-state-inner">
								<FileText class="w-10 h-10 text-dim" />
								<p class="empty-title">No documents found</p>
								<p class="empty-sub">
									{searchQuery || selectedStatus !== 'all'
										? 'Try adjusting your search or filter.'
										: 'No documents in the system yet.'}
								</p>
								{#if canCreate && !searchQuery && selectedStatus === 'all'}
									<a href="/documents/new" class="btn btn-primary btn-sm" style="margin-top:1rem">
										<Plus class="w-3.5 h-3.5" /> Create First Document
									</a>
								{/if}
							</div>
						</td>
					</tr>
				{:else}
					{#each paginatedDocs as doc (doc.id)}
						<tr class="doc-row-tr">
							<td class="doc-title-cell">
								<a href="/documents/{doc.id}" class="doc-title-link">
									{doc.title}
								</a>
							</td>
							<td>
								<StatusBadge status={doc.status} />
							</td>
							<td>
								<span class="version-chip">v{doc.version}</span>
							</td>
							<td>
								<div class="author-cell">
									<div class="author-avatar">{doc.author.name.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
									<div class="author-info">
										<span class="author-name">{doc.author.name}</span>
										<span class="role-badge-{doc.author.role} author-role">{doc.author.role}</span>
									</div>
								</div>
							</td>
							<td class="date-cell">
								{formatDate(doc.createdAt)}
							</td>
							<td class="actions-cell">
								<div class="row-actions">
									<a href="/documents/{doc.id}" class="btn btn-ghost btn-sm" title="View Document" id="view-doc-{doc.id}">
										<Eye class="w-3.5 h-3.5" />
										View
									</a>
									{#if doc.status === 'draft' || doc.status === 'rejected'}
										<a href="/documents/{doc.id}/edit" class="btn btn-outline btn-sm" title="Edit Document" id="edit-doc-{doc.id}">
											<Edit3 class="w-3.5 h-3.5" />
										</a>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="pagination">
			<span class="pagination-info">
				Page {currentPage} of {totalPages} — {sortedDocuments.length} docs
			</span>
			<div class="pagination-btns">
				<button
					class="btn btn-outline btn-sm"
					disabled={currentPage === 1}
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
				>
					<ChevronLeft class="w-4 h-4" /> Prev
				</button>
				<button
					class="btn btn-outline btn-sm"
					disabled={currentPage === totalPages}
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
				>
					Next <ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.doc-table-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	/* Controls */
	.controls-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.search-wrapper {
		position: relative;
		flex: 1;
		min-width: 220px;
	}

	:global(.search-icon-el) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		width: 15px;
		height: 15px;
		color: var(--text-dim);
		pointer-events: none;
	}

	.search-input { padding-left: 2.25rem; }

	.controls-right {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.select-wrapper { position: relative; }

	:global(.select-icon-el) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		width: 14px;
		height: 14px;
		color: var(--text-dim);
		pointer-events: none;
	}

	.filter-select { padding-left: 2.25rem; min-width: 150px; }

	/* Results info */
	.results-info {
		font-size: 0.78rem;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.results-info strong { color: var(--text-sub); }

	.clear-filters-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.75rem;
		color: #818CF8;
		padding: 0;
		text-decoration: underline;
		font-family: var(--font-sans);
	}

	.clear-filters-btn:hover { color: #A78BFA; }

	/* Sort button */
	.sort-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		font-family: var(--font-sans);
		padding: 0;
	}

	.sort-btn:hover { color: var(--text-main); }

	:global(.sort-icon) {
		width: 11px;
		height: 11px;
		opacity: 0.4;
	}

	.sort-btn:hover :global(.sort-icon) { opacity: 0.8; }

	.text-right { text-align: right !important; }

	/* Document row */
	.doc-row-tr { cursor: default; }

	.doc-title-cell { max-width: 300px; }

	.doc-title-link {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-main);
		text-decoration: none;
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.15s;
	}

	.doc-title-link:hover { color: #818CF8; }

	.version-chip {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 600;
		background: var(--bg-raised);
		color: var(--text-muted);
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		border: 1px solid var(--border-color);
	}

	.author-cell {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.author-avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366F1, #8B5CF6);
		color: white;
		font-size: 0.6rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		text-transform: uppercase;
	}

	.author-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.author-name {
		font-size: 0.825rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.author-role { font-size: 0.6rem !important; padding: 0.05rem 0.35rem !important; }

	.date-cell {
		font-family: var(--font-mono);
		font-size: 0.775rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.actions-cell { text-align: right !important; }

	.row-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
	}

	/* Empty State */
	.empty-cell { padding: 3rem 1rem !important; text-align: center; }

	.empty-state-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	:global(.text-dim) { color: var(--text-dim) !important; }

	.empty-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
		margin-top: 0.5rem;
	}

	.empty-sub {
		font-size: 0.825rem;
		color: var(--text-dim);
	}

	/* Pagination */
	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.pagination-info {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.pagination-btns {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
