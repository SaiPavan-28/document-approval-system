// ──────────────────────────────────────────────
// GET /api/documents/[id]/audit
// Get full audit history log for a document
// ──────────────────────────────────────────────

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/middleware/auth';
import { DocumentService } from '$lib/server/services/document.service';
import { AuditService } from '$lib/server/services/audit.service';
import { errorResponse } from '$lib/server/errors';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	try {
		const user = requireAuth(locals);

		// Ensure actor has read permission for this document
		await DocumentService.getDocumentById(user, params.id!);

		const pageParam = url.searchParams.get('page');
		const pageSizeParam = url.searchParams.get('pageSize');

		const page = pageParam ? parseInt(pageParam, 10) : 1;
		const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50;

		const auditHistory = await AuditService.getAuditHistory(params.id!, page, pageSize);

		return json({
			success: true,
			data: auditHistory
		});
	} catch (error) {
		return errorResponse(error);
	}
};
