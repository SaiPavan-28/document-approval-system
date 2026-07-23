// ──────────────────────────────────────────────
// GET /api/documents (List documents with filtering/sorting/pagination)
// POST /api/documents (Create new document draft)
// ──────────────────────────────────────────────

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/middleware/auth';
import { validateBody, validateQuery } from '$lib/server/middleware/validate';
import { createDocumentSchema, documentListQuerySchema } from '$lib/schemas/document.schema';
import { DocumentService } from '$lib/server/services/document.service';
import { errorResponse } from '$lib/server/errors';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const user = requireAuth(locals);
		const query = validateQuery(url, documentListQuerySchema);
		const result = await DocumentService.listDocuments(user, query);

		return json({
			success: true,
			data: result
		});
	} catch (error) {
		return errorResponse(error);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = requireAuth(locals);
		const input = await validateBody(request, createDocumentSchema);
		const doc = await DocumentService.createDocument(user, input);

		return json(
			{
				success: true,
				data: doc
			},
			{ status: 201 }
		);
	} catch (error) {
		return errorResponse(error);
	}
};
