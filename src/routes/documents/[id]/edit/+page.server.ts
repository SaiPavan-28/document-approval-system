import { redirect, error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { DocumentService } from '$lib/server/services/document.service';
import { isEditableStatus } from '$lib/state-machine/transitions';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	try {
		const document = await DocumentService.getDocumentById(locals.user, params.id);

		if (!isEditableStatus(document.status)) {
			throw error(403, `Document in '${document.status}' state cannot be edited.`);
		}

		if (locals.user.role !== 'admin' && document.authorId !== locals.user.id) {
			throw error(403, 'Only the document author can edit this document.');
		}

		return {
			user: locals.user,
			document
		};
	} catch (err: any) {
		if (err.status === 403 || err.status === 404) {
			throw err;
		}
		throw error(500, err.message || 'Internal server error');
	}
};
