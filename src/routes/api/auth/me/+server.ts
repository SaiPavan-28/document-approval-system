// ──────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/middleware/auth';
import { errorResponse } from '$lib/server/errors';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = requireAuth(locals);

		return json({
			success: true,
			data: { user }
		});
	} catch (error) {
		return errorResponse(error);
	}
};
