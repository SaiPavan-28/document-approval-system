// ──────────────────────────────────────────────
// GET /api/documents/[id] (Get document details)
// PATCH /api/documents/[id] (Edit document draft/rejected)
// ──────────────────────────────────────────────

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/middleware/auth';
import { validateBody } from '$lib/server/middleware/validate';
import { updateDocumentSchema } from '$lib/schemas/document.schema';
import { DocumentService } from '$lib/server/services/document.service';
import { errorResponse } from '$lib/server/errors';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const user = requireAuth(locals);
		const doc = await DocumentService.getDocumentById(user, params.id!);

		return json({
			success: true,
			data: doc
		});
	} catch (error) {
		return errorResponse(error);
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = requireAuth(locals);
		const input = await validateBody(request, updateDocumentSchema);
		const doc = await DocumentService.updateDocument(user, params.id!, input);

		return json({
			success: true,
			data: doc
		});
	} catch (error) {
		return errorResponse(error);
	}
};
