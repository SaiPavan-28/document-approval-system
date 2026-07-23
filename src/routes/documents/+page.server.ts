import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DocumentService } from '$lib/server/services/document.service';
import type { DocumentStatus } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const status = url.searchParams.get('status') as DocumentStatus | null;
	const search = url.searchParams.get('search') || undefined;

	const { items: documents, total } = await DocumentService.listDocuments(locals.user, {
		status: status || undefined,
		search,
		page: 1,
		pageSize: 100,
		sortBy: 'createdAt',
		sortOrder: 'desc'
	});

	return {
		user: locals.user,
		documents,
		total,
		initialStatusFilter: status || 'all'
	};
};
