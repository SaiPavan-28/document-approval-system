import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { DocumentService } from '$lib/server/services/document.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	if (locals.user.role === 'viewer') {
		throw redirect(303, '/documents');
	}
	return { user: locals.user };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}
		if (locals.user.role === 'viewer') {
			return fail(403, { message: 'Viewers cannot create documents' });
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim();
		const content = formData.get('content')?.toString().trim();

		if (!title || !content) {
			return fail(400, { message: 'Title and content are required' });
		}

		try {
			const doc = await DocumentService.createDocument(locals.user, {
				title,
				content
			});

			throw redirect(303, `/documents/${doc.id}`);
		} catch (err: any) {
			if (err.status === 303 || err.location) {
				throw err;
			}
			return fail(400, { message: err.message || 'Failed to create document' });
		}
	}
};
