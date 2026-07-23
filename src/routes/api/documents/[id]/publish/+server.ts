// ──────────────────────────────────────────────
// POST /api/documents/[id]/publish
// Transition state from 'approved' to 'published'
// ──────────────────────────────────────────────

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/middleware/auth';
import { validateBody } from '$lib/server/middleware/validate';
import { transitionSchema } from '$lib/schemas/document.schema';
import { DocumentService } from '$lib/server/services/document.service';
import { errorResponse } from '$lib/server/errors';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = requireAuth(locals);
		const input = await validateBody(request, transitionSchema);
		const doc = await DocumentService.publish(user, params.id!, input);

		return json({
			success: true,
			data: doc
		});
	} catch (error) {
		return errorResponse(error);
	}
};
