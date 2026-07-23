import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DocumentService } from '$lib/server/services/document.service';
import { AuditRepository } from '$lib/server/repositories/audit.repository';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	try {
		const document = await DocumentService.getDocumentById(locals.user, params.id);
		const { items: auditLogs } = await AuditRepository.findByDocumentId(params.id);

		return {
			user: locals.user,
			document,
			auditLogs
		};
	} catch (err: any) {
		if (err.status === 403) {
			throw error(403, err.message || 'Forbidden access to document');
		}
		if (err.status === 404) {
			throw error(404, err.message || 'Document not found');
		}
		throw error(500, err.message || 'Internal server error');
	}
};
